"use server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPartnerData() {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") {
        return { error: "No autorizado" }
    }

    // 1. Asegurar que el usuario exista en la DB (por si se borró en el seed)
    let user = await prisma.user.findUnique({ where: { id: session.id } })
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: session.id,
                email: session.email || `partner-${session.id}@test.com`,
                name: session.name || "Socio",
                role: "RESTAURANT"
            }
        })
    }

    // 2. Buscar o crear el restaurante vinculado
    let restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: user.id },
        include: {
            products: true,
            orders: {
                include: {
                    customer: true,
                    items: { include: { product: true } },
                    driver: true,
                    couponUsage: true
                },
                orderBy: { createdAt: "desc" },
                take: 200
            },
            reviews: {
                include: { customer: true },
                orderBy: { createdAt: "desc" },
                take: 10
            }
        }
    })

    if (!restaurant) {
        restaurant = await prisma.restaurant.create({
            data: {
                name: `Mi Local (${user.name})`,
                phone: "+569 0000 0000",
                address: "Dirección de demostración",
                category: "Burgers",
                image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80",
                ownerId: user.id
            },
            include: {
                products: true,
                orders: { include: { customer: true, items: { include: { product: true } }, driver: true, couponUsage: true } },
                reviews: { include: { customer: true } }
            }
        })
    }

    // Aggregate stats
    const totalSales = restaurant.orders.reduce((acc: number, o: { total: number }) => acc + o.total, 0)
    const pendingOrders = restaurant.orders.filter((o: { status: string }) => o.status === "PENDING").length
    const inPreparationOrders = restaurant.orders.filter((o: { status: string }) => o.status === "CONFIRMED" || o.status === "READY").length
    const deliveredOrders = restaurant.orders.filter((o: { status: string }) => o.status === "DELIVERED").length

    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayOrders = restaurant.orders.filter((o: { createdAt: Date }) => new Date(o.createdAt) >= today)
    const todaySales = todayOrders.reduce((acc: number, o: { total: number }) => acc + o.total, 0)
    const todayCount = todayOrders.length

    // Average rating
    const avgRating = restaurant.reviews.length > 0
        ? restaurant.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / restaurant.reviews.length
        : 0

    return {
        restaurant,
        totalSales,
        pendingOrders,
        inPreparationOrders,
        deliveredOrders,
        todaySales,
        todayCount,
        avgRating,
        reviewCount: restaurant.reviews.length
    }
}

export async function addProduct(data: { name: string; description: string; price: number; image?: string }) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") return { error: "No autorizado" }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { ownerId: session.id }
        })

        if (!restaurant) return { error: "Restaurante no encontrado" }

        await prisma.product.create({
            data: {
                ...data,
                restaurantId: restaurant.id
            }
        })

        revalidatePath("/partner")
        return { success: true }
    } catch (e) {
        return { error: "Error creando producto" }
    }
}

export async function updateProduct(id: string, data: any) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") return { error: "No autorizado" }

    try {
        await prisma.product.update({
            where: { id },
            data
        })
        revalidatePath("/partner")
        return { success: true }
    } catch (e) {
        return { error: "Error actualizando producto" }
    }
}

export async function deleteProduct(id: string) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") return { error: "No autorizado" }

    try {
        await prisma.product.delete({
            where: { id }
        })
        revalidatePath("/partner")
        return { success: true }
    } catch (e) {
        return { error: "Error eliminando producto" }
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") return { error: "No autorizado" }

    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status }
        })
        revalidatePath("/partner")
        return { success: true }
    } catch (e) {
        return { error: "Error actualizando orden" }
    }
}

export async function updateRestaurantSettings(data: {
    openTime?: string;
    closeTime?: string;
    acceptingOrders?: boolean;
    preparation?: number;
    deliveryRadiusKm?: number;
    minOrder?: number;
    deliveryZones?: string;
    address?: string;
    phone?: string;
}) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") return { error: "No autorizado" }

    try {
        await prisma.restaurant.update({
            where: { ownerId: session.id },
            data
        })
        revalidatePath("/partner")
        return { success: true }
    } catch (e: any) {
        console.error("[SETTINGS_ERROR]", e)
        return { error: "Error actualizando configuración" }
    }
}
