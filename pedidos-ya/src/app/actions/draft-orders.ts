"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function getDraftOrder(orderId: string) {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") {
        return { error: "No autorizado" }
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        if (!order || order.customerId !== session.id || order.status !== "DRAFT") {
            return { error: "Borrador de carrito no encontrado" }
        }

        return { order }
    } catch (e: any) {
        return { error: e.message || "Error al obtener borrador" }
    }
}
