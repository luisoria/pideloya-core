"use server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function submitReview(restaurantId: string, rating: number, comment: string) {
    const session = await getSession()
    if (!session) throw new Error("Debes iniciar sesión")
    if (session.role !== "CUSTOMER") throw new Error("Solo clientes pueden dejar reseñas")

    if (rating < 1 || rating > 5) throw new Error("Rating inválido")

    // Check if already reviewed
    const existing = await prisma.review.findFirst({
        where: { customerId: session.id, restaurantId }
    })
    if (existing) throw new Error("Ya dejaste una reseña en este restaurante")

    // Check if user has a delivered order
    const deliveredOrder = await prisma.order.findFirst({
        where: {
            customerId: session.id,
            restaurantId,
            status: "DELIVERED"
        }
    })
    if (!deliveredOrder) throw new Error("Solo puedes reseñar restaurantes donde hayas hecho un pedido")

    await prisma.review.create({
        data: {
            rating,
            comment: comment.trim() || null,
            customerId: session.id,
            restaurantId,
            orderId: deliveredOrder.id,
        }
    })

    revalidatePath(`/restaurant/${restaurantId}`)
    revalidatePath("/")
}
