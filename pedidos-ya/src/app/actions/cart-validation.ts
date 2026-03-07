"use server"

import { prisma } from "@/lib/prisma"

export async function validateCart(restaurantId: string, items: { productId: string, quantity: number }[]) {
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { acceptingOrders: true, openTime: true, closeTime: true }
        })

        if (!restaurant) {
            return { error: "Restaurante no encontrado" }
        }

        let isOpen = restaurant.acceptingOrders

        // Horario chileno para la validación:
        const now = new Date()
        const chileTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Santiago" }))
        
        const currentHour = chileTime.getHours()
        const currentMinute = chileTime.getMinutes()
        const currentTotalMinutes = currentHour * 60 + currentMinute
        
        // Parse "HH:MM"
        const [openH, openM] = restaurant.openTime.split(":").map(Number)
        let [closeH, closeM] = restaurant.closeTime.split(":").map(Number)
        
        const openTotalMinutes = openH * 60 + openM
        let closeTotalMinutes = closeH * 60 + closeM
        
        // Si el cierre es pasada la medianoche (ej. 02:00) y abrieron antes (ej. 18:00)
        let closesNextDay = closeTotalMinutes <= openTotalMinutes

        // Lógica de si está cerrado por hora o cierre pronto:
        // El enunciado dice: "faltan 30 minutos para su cierre, este cliente no podra pedir los productos".
        // O sea, la fecha límite es closeTotalMinutes - 30.
        
        let isOpenTime = false
        if (!closesNextDay) {
            isOpenTime = currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= (closeTotalMinutes - 30)
        } else {
            // Cierra el día siguiente (ej. de 18:00 a 03:00)
            const strictCloseTime = closeTotalMinutes - 30
            if (currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= strictCloseTime) {
                isOpenTime = true
            }
        }

        if (!isOpenTime) {
            isOpen = false
        }

        // Validate products
        const productIds = items.map(i => i.productId)
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, available: true, stock: true }
        })

        const unavailableProductIds: string[] = []

        for (const item of items) {
            const prod = products.find(p => p.id === item.productId)
            if (!prod) {
                unavailableProductIds.push(item.productId)
                continue
            }
            if (!prod.available) {
                unavailableProductIds.push(item.productId)
                continue
            }
            if (prod.stock !== null && prod.stock < item.quantity) {
                unavailableProductIds.push(item.productId)
            }
        }

        return {
            isOpen,
            unavailableProductIds
        }

    } catch (e: any) {
        console.error(e)
        return { error: "Error validando el carrito" }
    }
}
