"use server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getBackofficeData() {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
        return { error: "No autorizado" }
    }

    const tickets = await prisma.ticket.findMany({
        include: { user: true, replies: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" }
    })

    const users = await prisma.user.findMany({
        orderBy: { ltv: "desc" },
        take: 50
    })

    const driverApplications = await prisma.driverApplication.findMany({
        orderBy: { createdAt: "desc" }
    })

    const restaurantApplications = await prisma.restaurantApplication.findMany({
        orderBy: { createdAt: "desc" },
        include: { restaurant: true }
    })

    const allRestaurants = await prisma.restaurant.findMany({
        orderBy: { name: "asc" },
        include: { owner: true, reviews: true }
    })

    const appCounts = {
        total: driverApplications.length,
        submitted: driverApplications.filter(a => a.status === 'SUBMITTED').length,
        inReview: driverApplications.filter(a => a.status === 'IN_REVIEW').length,
        approved: driverApplications.filter(a => a.status === 'APPROVED').length,
        rejected: driverApplications.filter(a => a.status === 'REJECTED').length,
        docsIncomplete: driverApplications.filter(a => a.status === 'DOCS_INCOMPLETE').length,
        resSubmitted: restaurantApplications.filter(a => a.status === 'SUBMITTED').length
    }

    // === REAL KPIs ===
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const allOrders = await prisma.order.findMany({
        include: {
            customer: true,
            restaurant: true,
            driver: true,
            items: { include: { product: true } }
        },
        orderBy: { createdAt: "desc" }
    })

    const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0)
    const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today)
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)
    const activeOrders = allOrders.filter(o => ['PENDING', 'CONFIRMED', 'READY', 'PICKED_UP'].includes(o.status))
    const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED').length

    const userCounts = {
        total: await prisma.user.count(),
        customers: await prisma.user.count({ where: { role: 'CUSTOMER' } }),
        drivers: await prisma.user.count({ where: { role: 'DRIVER' } }),
        restaurants: await prisma.user.count({ where: { role: 'RESTAURANT' } }),
    }

    const kpis = {
        totalRevenue,
        todayRevenue,
        totalOrders: allOrders.length,
        todayOrderCount: todayOrders.length,
        activeOrderCount: activeOrders.length,
        deliveredOrders,
        userCounts,
    }

    // Delivery zones - may fail if table hasn't been created yet
    let deliveryZones: any[] = []
    try {
        deliveryZones = await (prisma as any).deliveryZone.findMany({ orderBy: { name: "asc" } })
    } catch (_e) { /* table may not exist yet */ }

    // Coupons – raw query to bypass Prisma Client sync issues
    let allCoupons: any[] = []
    try {
        const couponsRaw: any[] = await prisma.$queryRaw`
            SELECT c.*, r.name as restaurantName
            FROM "Coupon" c
            LEFT JOIN "Restaurant" r ON c."restaurantId" = r."id"
            ORDER BY c."createdAt" DESC
        `
        allCoupons = await Promise.all(couponsRaw.map(async (c: any) => {
            const usageCount: any[] = await prisma.$queryRaw`
                SELECT COUNT(*) as count, COALESCE(SUM("discountAmount"), 0) as totalDiscount
                FROM "CouponUsage" WHERE "couponId" = ${c.id}
            `
            return {
                ...c,
                startDate: new Date(c.startDate),
                expirationDate: new Date(c.expirationDate),
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
                restaurant: { name: c.restaurantName },
                _count: { usages: Number(usageCount[0].count) },
                totalDiscount: Number(usageCount[0].totalDiscount)
            }
        }))
    } catch (_e) { /* coupon table may not exist yet */ }

    return {
        tickets, users, driverApplications, restaurantApplications, allRestaurants, appCounts,
        allOrders, activeOrders, kpis, deliveryZones, allCoupons
    }
}

export async function updateRestaurantCommission(restaurantId: string, rate: number) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }

    try {
        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { commissionRate: rate }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (e) {
        return { error: "Error actualizando comisión" }
    }
}

export async function resolveTicket(ticketId: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
        return { error: "No autorizado" }
    }

    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: "RESOLVED" }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (e) {
        return { error: "Error resolviendo ticket" }
    }
}

export async function approveDriverApplication(applicationId: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
        return { error: "No autorizado" }
    }

    try {
        await prisma.driverApplication.update({
            where: { id: applicationId },
            data: {
                status: "APPROVED",
                reviewedBy: session.email || 'admin',
                reviewedAt: new Date(),
            }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (e) {
        return { error: "Error aprobando solicitud" }
    }
}

export async function rejectDriverApplication(applicationId: string, reason: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
        return { error: "No autorizado" }
    }

    try {
        await prisma.driverApplication.update({
            where: { id: applicationId },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
                reviewedBy: session.email || 'admin',
                reviewedAt: new Date(),
            }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (e) {
        return { error: "Error rechazando solicitud" }
    }
}

export async function requestDocsDriverApplication(applicationId: string, reason: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
        return { error: "No autorizado" }
    }

    try {
        await prisma.driverApplication.update({
            where: { id: applicationId },
            data: {
                status: "DOCS_INCOMPLETE",
                rejectionReason: reason,
                reviewedBy: session.email || 'admin',
                reviewedAt: new Date(),
            }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (e) {
        return { error: "Error actualizando solicitud" }
    }
}
export async function deleteDriverApplication(applicationId: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
        return { error: "No autorizado. Solo super-admins pueden realizar esta acción." }
    }

    try {
        await prisma.driverApplication.delete({
            where: { id: applicationId }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (e) {
        console.error('[DELETE ERROR]', e)
        return { error: "Error eliminando el registro de forma definitiva." }
    }
}

export async function clearDraftDriverApplications() {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
        return { error: "No autorizado. Solo admins pueden realizar esta acción." }
    }

    try {
        const result = await prisma.driverApplication.deleteMany({
            where: { status: 'DRAFT' }
        })
        revalidatePath("/backoffice")
        return { success: true, count: result.count }
    } catch (e) {
        console.error('[CLEAR DRAFTS ERROR]', e)
        return { error: "Error eliminando los registros en borrador." }
    }
}
export async function approveRestaurantApplication(applicationId: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }

    try {
        const app = await prisma.restaurantApplication.findUnique({
            where: { id: applicationId }
        })

        if (!app) return { error: "Solicitud no encontrada" }

        // 1. Create User for Restaurant (if not exists)
        let user = await prisma.user.findUnique({
            where: { email: app.email! }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: app.email!,
                    name: app.fantasyName || app.businessName || "Restaurante",
                    role: "RESTAURANT",
                    status: "ACTIVE"
                }
            })
        } else {
            // Update role to RESTAURANT if it was generic
            await prisma.user.update({
                where: { id: user.id },
                data: { role: "RESTAURANT" }
            })
        }

        // 2. Create Restaurant
        const restaurant = await prisma.restaurant.create({
            data: {
                name: app.fantasyName || app.businessName || "Nuevo Restaurante",
                address: app.address || "Por definir",
                category: app.category || "General",
                ownerId: user.id,
                applicationId: app.id,
                phone: app.phone,
                image: app.storefrontPhotoUrl,
                commissionRate: 15.0 // Default commission
            }
        })

        // 3. Update Application Status
        await prisma.restaurantApplication.update({
            where: { id: applicationId },
            data: {
                status: "APPROVED",
                reviewedBy: session.email || 'admin',
                reviewedAt: new Date(),
            }
        })

        revalidatePath("/backoffice")
        return { success: true }
    } catch (e) {
        console.error('[APPROVE RESTAURANT ERROR]', e)
        return { error: "Error aprobando restaurante" }
    }
}

export async function rejectRestaurantApplication(applicationId: string, reason: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }

    try {
        await prisma.restaurantApplication.update({
            where: { id: applicationId },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
                reviewedBy: session.email || 'admin',
                reviewedAt: new Date(),
            }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (e) {
        return { error: "Error rechazando solicitud" }
    }
}

export async function requestDocsRestaurantApplication(applicationId: string, reason: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }

    try {
        await prisma.restaurantApplication.update({
            where: { id: applicationId },
            data: {
                status: "DOCS_INCOMPLETE",
                rejectionReason: reason,
                reviewedBy: session.email || 'admin',
                reviewedAt: new Date(),
            }
        })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error actualizando solicitud" }
    }
}

// ═══════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════

export async function updateUserStatus(userId: string, status: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    try {
        await prisma.user.update({ where: { id: userId }, data: { status } })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error actualizando estado" }
    }
}

export async function updateUserRole(userId: string, role: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    try {
        await prisma.user.update({ where: { id: userId }, data: { role } })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error actualizando rol" }
    }
}

// ═══════════════════════════════════════
// ORDER MANAGEMENT
// ═══════════════════════════════════════

export async function adminUpdateOrderStatus(orderId: string, status: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    try {
        await prisma.order.update({ where: { id: orderId }, data: { status } })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error actualizando pedido" }
    }
}

export async function adminCancelOrder(orderId: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    try {
        await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error cancelando pedido" }
    }
}

// ═══════════════════════════════════════
// DELIVERY ZONES
// ═══════════════════════════════════════

export async function getDeliveryZones() {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    return await (prisma as any).deliveryZone.findMany({ orderBy: { name: "asc" } })
}

export async function createDeliveryZone(data: {
    name: string; deliveryFee: number; minOrder: number; radiusKm: number; lat?: number; lon?: number
}) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    try {
        await (prisma as any).deliveryZone.create({ data })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error creando zona" }
    }
}

export async function updateDeliveryZone(zoneId: string, data: {
    name?: string; active?: boolean; deliveryFee?: number; minOrder?: number; radiusKm?: number
}) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    try {
        await (prisma as any).deliveryZone.update({ where: { id: zoneId }, data })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error actualizando zona" }
    }
}

export async function deleteDeliveryZone(zoneId: string) {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return { error: "No autorizado" }
    try {
        await (prisma as any).deliveryZone.delete({ where: { id: zoneId } })
        revalidatePath("/backoffice")
        return { success: true }
    } catch (_e) {
        return { error: "Error eliminando zona" }
    }
}

