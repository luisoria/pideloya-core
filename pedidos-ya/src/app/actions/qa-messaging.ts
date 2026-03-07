"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

/**
 * QA: Broadcast masivo a todos los repartidores
 */
export async function broadcastToDrivers(message: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
        return { error: "No autorizado." }
    }

    try {
        await prisma.message.create({
            data: {
                senderId: session.id,
                content: message,
                type: "BROADCAST",
                status: "SENT"
            }
        })
        
        // Aquí se dispararía el evento de Socket.io en una implementación real
        return { success: true }
    } catch (error) {
        console.error("Broadcast error:", error)
        return { error: "Fallo al enviar el broadcast." }
    }
}

/**
 * QA: Alerta de Imposibilidad de Entrega
 */
export async function reportDeliveryIncident(
    orderId: string, 
    type: string, 
    description: string, 
    lat: number, 
    lon: number
) {
    const session = await getSession()
    if (!session || session.role !== "DRIVER") {
        return { error: "Solo los repartidores pueden reportar incidencias." }
    }

    try {
        const incident = await prisma.$transaction(async (tx) => {
            // 1. Crear incidencia con ubicación de captura
            const inc = await tx.incident.create({
                data: {
                    orderId,
                    reporterId: session.id,
                    type,
                    description,
                    lastLat: lat,
                    lastLon: lon,
                    status: "PENDING"
                }
            })

            // 2. Actualizar la orden con el re-punteo dinámico (Pick-up en la ubicación actual del driver)
            await tx.order.update({
                where: { id: orderId },
                data: {
                    originLat: lat,
                    originLon: lon,
                    status: "READY" // Volver a listos para ser recogidos por otro driver
                }
            })

            return inc
        })

        revalidatePath(`/driver/orders`)
        return { success: true, incidentId: incident.id }
    } catch (error) {
        console.error("Incident report error:", error)
        return { error: "Fallo al reportar incidencia." }
    }
}

/**
 * QA: Chat Driver-Cliente
 */
export async function sendOrderMessage(orderId: string, content: string) {
    const session = await getSession()
    if (!session) return { error: "No autorizado" }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, customerId: true, driverId: true }
    })

    if (!order) return { error: "Orden no encontrada" }
    
    // Validar cierre automático de chat
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        return { error: "El canal de chat está cerrado para esta orden." }
    }

    try {
        await prisma.message.create({
            data: {
                orderId,
                senderId: session.id,
                content,
                status: "SENT",
                type: "CHAT"
            }
        })
        return { success: true }
    } catch (error) {
        return { error: "Error al enviar mensaje" }
    }
}
