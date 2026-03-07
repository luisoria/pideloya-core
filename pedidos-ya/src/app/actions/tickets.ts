"use server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ═══════════════════════════════════════
// TICKET NUMBER GENERATOR
// ═══════════════════════════════════════
function generateTicketNumber(): string {
    const num = Math.floor(10000 + Math.random() * 90000)
    return `TKT-${num}`
}

// ═══════════════════════════════════════
// CREATE TICKET (Client, Driver, Restaurant)
// ═══════════════════════════════════════
export async function createTicket(data: {
    issue: string
    description: string
    category: string
    priority?: string
    orderId?: string
    requesterType: string
}) {
    const session = await getSession()
    if (!session) return { error: "Debes iniciar sesión" }

    try {
        const ticket = await prisma.ticket.create({
            data: {
                issue: data.issue,
                description: data.description,
                category: data.category,
                priority: data.priority || "MEDIUM",
                orderId: data.orderId || null,
                requesterType: data.requesterType,
                ticketNumber: generateTicketNumber(),
                userId: session.id,
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h SLA
            }
        })

        // Send email notification
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tickets/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'CREATED',
                    ticketNumber: ticket.ticketNumber,
                    email: session.email,
                    userName: session.name,
                    issue: ticket.issue,
                    category: ticket.category,
                    priority: ticket.priority,
                })
            })
        } catch (_e) { /* email is best-effort */ }

        revalidatePath("/support")
        revalidatePath("/partner")
        revalidatePath("/driver")
        revalidatePath("/backoffice")
        return { success: true, ticketNumber: ticket.ticketNumber }
    } catch (_e) {
        return { error: "Error creando ticket" }
    }
}

// ═══════════════════════════════════════
// GET USER TICKETS
// ═══════════════════════════════════════
export async function getUserTickets() {
    const session = await getSession()
    if (!session) return []

    return await prisma.ticket.findMany({
        where: { userId: session.id },
        include: { replies: { orderBy: { createdAt: "asc" } }, user: true },
        orderBy: { createdAt: "desc" }
    })
}

// ═══════════════════════════════════════
// ADD REPLY TO TICKET
// ═══════════════════════════════════════
export async function addTicketReply(ticketId: string, message: string) {
    const session = await getSession()
    if (!session) return { error: "Debes iniciar sesión" }

    try {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
        if (!ticket) return { error: "Ticket no encontrado" }

        // Verify the user owns this ticket OR is admin
        if (ticket.userId !== session.id && session.role !== "ADMIN") {
            return { error: "No autorizado" }
        }

        const role = session.role === "ADMIN" ? "ADMIN" :
            session.role === "DRIVER" ? "DRIVER" :
                session.role === "RESTAURANT" ? "RESTAURANT" : "CUSTOMER"

        await prisma.ticketReply.create({
            data: {
                ticketId,
                message,
                author: session.name || session.email,
                authorRole: role,
            }
        })

        // If admin replies, set ticket to IN_PROGRESS
        if (session.role === "ADMIN" && ticket.status === "OPEN") {
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { status: "IN_PROGRESS" }
            })
        }

        revalidatePath("/support")
        revalidatePath("/partner")
        revalidatePath("/driver")
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error agregando respuesta" }
    }
}

// ═══════════════════════════════════════
// RESOLVE TICKET (Admin)
// ═══════════════════════════════════════
export async function resolveTicketAdvanced(ticketId: string, resolution: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }

    try {
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: "RESOLVED",
                resolution,
                resolvedBy: session.name || session.email,
                resolvedAt: new Date(),
            },
            include: { user: true }
        })

        // Send resolution email
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tickets/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'RESOLVED',
                    ticketNumber: ticket.ticketNumber,
                    email: ticket.user?.email,
                    userName: ticket.user?.name,
                    issue: ticket.issue,
                    resolution,
                    resolvedBy: session.name,
                })
            })
        } catch (_e) { /* email is best-effort */ }

        revalidatePath("/support")
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error resolviendo ticket" }
    }
}

// ═══════════════════════════════════════
// ESCALATE TICKET (Admin)
// ═══════════════════════════════════════
export async function escalateTicket(ticketId: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: "ESCALATED", priority: "CRITICAL" }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error escalando ticket" }
    }
}

// ═══════════════════════════════════════
// GET ALL TICKETS (Admin)
// ═══════════════════════════════════════
export async function getAllTickets(filters?: { status?: string; requesterType?: string; priority?: string }) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return []

    const where: any = {}
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status
    if (filters?.requesterType && filters.requesterType !== 'ALL') where.requesterType = filters.requesterType
    if (filters?.priority && filters.priority !== 'ALL') where.priority = filters.priority

    return await prisma.ticket.findMany({
        where,
        include: { user: true, replies: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" }
    })
}
