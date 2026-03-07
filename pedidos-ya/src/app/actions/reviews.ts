"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function submitOrderReview(
    orderId: string,
    restaurantRating: number,
    restaurantComment: string,
    productReviews: { productId: string, rating: number, comment: string }[]
) {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") {
        return { error: "Debe iniciar sesión para dejar una reseña." }
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                restaurant: true
            }
        })

        if (!order || order.customerId !== session.id) {
            return { error: "Pedido no encontrado." }
        }

        if (order.status !== "DELIVERED") {
            return { error: "Solo puedes calificar pedidos que ya han sido entregados." }
        }

        // 1 hour check
        const now = new Date()
        const deliveredAt = order.deliveredAt || order.updatedAt
        const oneHourInMs = 60 * 60 * 1000
        if (now.getTime() - new Date(deliveredAt).getTime() < oneHourInMs) {
            return { error: "Debes esperar al menos 1 hora después de la entrega para dejar tu opinión." }
        }

        await prisma.$transaction(async (tx) => {
            // 1. Restaurant Review
            await tx.review.create({
                data: {
                    rating: restaurantRating,
                    comment: restaurantComment,
                    customerId: session.id,
                    restaurantId: order.restaurantId,
                    orderId: orderId
                }
            })

            // 2. Product Reviews
            for (const pr of productReviews) {
                // Verify product was actually in the order
                const itemExists = order.items.find(i => i.productId === pr.productId)
                if (itemExists) {
                    await tx.productReview.create({
                        data: {
                            rating: pr.rating,
                            comment: pr.comment,
                            customerId: session.id,
                            productId: pr.productId,
                            orderId: orderId
                        }
                    })
                }
            }
        })

        revalidatePath(`/orders/${orderId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Error submitting review:", error)
        if (error.code === 'P2002') {
             return { error: "Ya has calificado este pedido." }
        }
        return { error: "Hubo un problema al guardar tu reseña." }
    }
}

// For compatibility with restaurant page (review without specific order link)
export async function submitReview(restaurantId: string, rating: number, comment: string) {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") {
        throw new Error("Debe iniciar sesión para dejar una reseña.")
    }

    // Check if user has an order delivered at least 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const order = await prisma.order.findFirst({
        where: {
            customerId: session.id,
            restaurantId: restaurantId,
            status: "DELIVERED",
            deliveredAt: { lte: oneHourAgo }
        }
    })

    if (!order) {
        throw new Error("Solo puedes calificar si has recibido un pedido hace más de una hora.")
    }

    await prisma.review.create({
        data: {
            rating,
            comment,
            customerId: session.id,
            restaurantId: restaurantId,
            orderId: order.id
        }
    })

    revalidatePath(`/restaurant/${restaurantId}`)
}
