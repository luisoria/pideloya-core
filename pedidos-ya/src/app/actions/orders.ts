"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { validateCoupon } from "./coupons"

export async function createOrder(
    restaurantId: string,
    total: number,
    items: { productId: string, quantity: number, price: number }[],
    paymentMethod: string = "CASH",
    couponCode?: string
) {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") return { error: "Debe iniciar sesión como Cliente para realizar un pedido." }

    let couponDiscountAmount = 0
    let validCouponId: string | null = null

    if (couponCode) {
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        const validation = await validateCoupon(couponCode, restaurantId, subtotal)
        if (validation.error) {
            return { error: validation.error }
        }
        if (validation.coupon && validation.discountAmount !== undefined) {
            validCouponId = validation.coupon.id
            couponDiscountAmount = validation.discountAmount
        }
    }

    try {
        const order = await prisma.$transaction(async (tx) => {
            // 1. Verificación de Restaurante
            const restaurant = await tx.restaurant.findUnique({ where: { id: restaurantId } })
            if (!restaurant?.acceptingOrders) {
                 throw new Error("El restaurante actualmente no acepta pedidos.")
            }

            // 2. Verificación y Decremento de Inventario
            const productIds = items.map(i => i.productId)
            const productsInDb = await tx.product.findMany({
                where: { id: { in: productIds } }
            })

            for (const item of items) {
                const prod = productsInDb.find(p => p.id === item.productId)
                if (!prod || !prod.available) throw new Error(`El producto "${prod?.name || 'Desconocido'}" ya no está disponible.`)
                if (prod.stock !== null && prod.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para "${prod.name}". Quedan ${prod.stock} disponibles.`)
                }
            }

            for (const item of items) {
                const prod = productsInDb.find(p => p.id === item.productId)
                if (prod?.stock !== null) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    })
                }
            }

            // 3. Verificación de Cupón
            if (validCouponId) {
                // Raw query to check usage within transaction
                const couponsRaw: any[] = await tx.$queryRaw`
                    SELECT "totalUsageLimit", "currentUsages" FROM "Coupon" WHERE "id" = ${validCouponId}
                `
                const currentCoupon = couponsRaw[0];

                if (currentCoupon?.totalUsageLimit && currentCoupon.currentUsages >= currentCoupon.totalUsageLimit) {
                    throw new Error("El cupón se ha agotado justo ahora");
                }
                if (currentCoupon) {
                    // Raw update within transaction
                    await tx.$executeRaw`
                        UPDATE "Coupon" SET "currentUsages" = "currentUsages" + 1 WHERE "id" = ${validCouponId}
                    `
                }
            }

            const newOrder = await tx.order.create({
                data: {
                    customerId: session.id,
                    restaurantId,
                    total,
                    paymentMethod,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            })

            if (validCouponId) {
                // Raw insert for coupon usage
                await tx.$executeRaw`
                    INSERT INTO "CouponUsage" ("id", "couponId", "userId", "orderId", "discountAmount", "usedAt")
                    VALUES (${crypto.randomUUID()}, ${validCouponId}, ${session.id}, ${newOrder.id}, ${couponDiscountAmount}, ${new Date().toISOString()})
                `
            }

            return newOrder
        })

        revalidatePath("/restaurant")
        revalidatePath("/(user)")
        revalidatePath("/orders")
        return order
    } catch (error: any) {
        console.error("Order creation error:", error)
        return { error: error.message || "Ocurrió un error al procesar el pedido" }
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    const session = await getSession()
    if (!session) throw new Error("Unauthorized")

    await prisma.order.update({
        where: { id: orderId },
        data: { status }
    })
    revalidatePath("/restaurant")
    revalidatePath("/driver")
}

export async function acceptOrderAsDriver(orderId: string) {
    const session = await getSession()
    if (!session || session.role !== "DRIVER") {
        throw new Error("🔐 Error de Sesión Múltiple:\nEstás logueado como otra cuenta (probablemente Cliente o Dueño) en otra pestaña. Por favor inicia sesión nuevamente como Repartidor (Rider) para hacer esto.")
    }

    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: "PICKED_UP",
            driverId: session.id
        }
    })
    revalidatePath("/driver")
}

export async function deliverOrder(orderId: string) {
    const session = await getSession()
    if (!session || session.role !== "DRIVER") {
        throw new Error("🔐 Error de Sesión Múltiple:\nEstás logueado como otra cuenta en otra pestaña. Por favor inicia sesión nuevamente como Repartidor (Rider) para completar esta entrega.")
    }

    await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" }
    })
    revalidatePath("/driver")
}

export async function saveOrderAsDraft(
    restaurantId: string,
    total: number,
    items: { productId: string, quantity: number, price: number }[],
    couponCode?: string
) {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") return { error: "Debe iniciar sesión como Cliente para guardar el carrito." }

    let couponDiscountAmount = 0
    let validCouponId: string | null = null

    if (couponCode) {
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        const validation = await validateCoupon(couponCode, restaurantId, subtotal)
        if (!validation.error && validation.coupon && validation.discountAmount !== undefined) {
            validCouponId = validation.coupon.id
            couponDiscountAmount = validation.discountAmount
        }
    }

    try {
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    customerId: session.id,
                    restaurantId,
                    total,
                    status: "DRAFT",
                    paymentMethod: "NONE",
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            })
            return newOrder
        })

        revalidatePath("/restaurant")
        revalidatePath("/(user)")
        revalidatePath("/orders")
        return { success: true, orderId: order.id }
    } catch (error: any) {
        console.error("Cart save error:", error)
        return { error: error.message || "Ocurrió un error al guardar el carrito" }
    }
}

export async function deleteDraftOrder(orderId: string) {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") throw new Error("Unauthorized")

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order || order.customerId !== session.id) {
        throw new Error("Order not found or not yours")
    }

    if (order.status !== "DRAFT") {
        throw new Error("Solo las órdenes guardadas como borrador pueden ser eliminadas")
    }

    // Delete related items manually first just in case
    await prisma.orderItem.deleteMany({ where: { orderId: orderId } })
    await prisma.couponUsage.deleteMany({ where: { orderId: orderId } })

    await prisma.order.delete({
        where: { id: orderId }
    })
    
    revalidatePath("/orders")
}
