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
