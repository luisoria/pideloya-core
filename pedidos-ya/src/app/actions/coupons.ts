"use server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

export async function getRestaurantCoupons() {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") {
        return { error: "No autorizado" }
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { ownerId: session.id },
            select: { id: true }
        })

        if (!restaurant) return { error: "Restaurante no encontrado" }

        // Raw query to bypass Prisma Client sync issues
        const couponsRaw: any[] = await prisma.$queryRaw`
            SELECT * FROM "Coupon" 
            WHERE "restaurantId" = ${restaurant.id} 
            ORDER BY "createdAt" DESC
        `

        // SQLite returns dates as strings/numbers sometimes, and we need the usage counts
        const coupons = await Promise.all(couponsRaw.map(async (c: any) => {
            const usageCount: any[] = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM "CouponUsage" WHERE "couponId" = ${c.id}
            `
            return {
                ...c,
                startDate: new Date(c.startDate),
                expirationDate: new Date(c.expirationDate),
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
                _count: { usages: Number(usageCount[0].count) }
            }
        }))

        return { coupons }
    } catch (e) {
        console.error(e)
        return { error: "Error obteniendo cupones" }
    }
}

export async function createCoupon(data: any) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") {
        return { error: "No autorizado" }
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { ownerId: session.id },
            select: { id: true }
        })

        if (!restaurant) return { error: "Restaurante no encontrado" }

        const couponId = crypto.randomUUID()
        const now = new Date().toISOString()
        await prisma.$executeRaw`
            INSERT INTO "Coupon" (
                "id", "code", "internalName", "description", "type", "value",
                "minOrderAmount", "maxDiscount", "startDate", "expirationDate",
                "validDays", "timeWindowStart", "timeWindowEnd",
                "totalUsageLimit", "currentUsages", "userUsageLimit",
                "appliesToAll", "targetProducts", "targetCategories",
                "channel", "restaurantSplit", "platformSplit",
                "status", "restaurantId", "createdAt", "updatedAt"
            ) VALUES (
                ${couponId}, ${data.code}, ${data.internalName}, ${data.description}, ${data.type}, ${data.value ?? null},
                ${data.minOrderAmount ?? 0}, ${data.maxDiscount ?? null}, ${data.startDate}, ${data.expirationDate},
                ${data.validDays ?? '[]'}, ${data.timeWindowStart ?? null}, ${data.timeWindowEnd ?? null},
                ${data.totalUsageLimit ?? null}, ${0}, ${data.userUsageLimit ?? null},
                ${data.appliesToAll ?? true}, ${data.targetProducts ?? '[]'}, ${data.targetCategories ?? '[]'},
                ${data.channel ?? 'ALL'}, ${data.restaurantSplit ?? 100.0}, ${data.platformSplit ?? 0.0},
                ${data.status ?? 'ACTIVE'}, ${restaurant.id}, ${now}, ${now}
            )
        `
        const coupon = { id: couponId, ...data, restaurantId: restaurant.id }

        revalidatePath("/partner/coupons")
        return { success: true, coupon }
    } catch (e) {
        console.error(e)
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return { error: "El código de cupón ya existe" }
        }
        return { error: "Error creando el cupón" }
    }
}

export async function updateCouponStatus(couponId: string, status: string) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") {
        return { error: "No autorizado" }
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { ownerId: session.id },
            select: { id: true }
        })

        if (!restaurant) return { error: "Restaurante no encontrado" }

        // Verify ownership with raw query
        const couponRows: any[] = await prisma.$queryRaw`
            SELECT "id" FROM "Coupon" WHERE "id" = ${couponId} AND "restaurantId" = ${restaurant.id} LIMIT 1
        `

        if (couponRows.length === 0) return { error: "Cupón no encontrado" }

        await prisma.$executeRaw`
            UPDATE "Coupon" SET "status" = ${status}, "updatedAt" = ${new Date().toISOString()} WHERE "id" = ${couponId}
        `

        revalidatePath("/partner/coupons")
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Error actualizando el cupón" }
    }
}

export async function getCouponAnalytics(couponId: string) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") {
        return { error: "No autorizado" }
    }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { ownerId: session.id },
            select: { id: true }
        })

        if (!restaurant) return { error: "Restaurante no encontrado" }

        // Raw query for coupon
        const couponsRaw: any[] = await prisma.$queryRaw`
            SELECT * FROM "Coupon" 
            WHERE "id" = ${couponId} AND "restaurantId" = ${restaurant.id}
            LIMIT 1
        `

        if (couponsRaw.length === 0) return { error: "Cupón no encontrado" }
        const coupon = {
            ...couponsRaw[0],
            startDate: new Date(couponsRaw[0].startDate),
            expirationDate: new Date(couponsRaw[0].expirationDate)
        }

        // Raw query for usages with order inclusion
        const usagesRaw: any[] = await prisma.$queryRaw`
            SELECT cu.*, o.total as orderTotal, o.status as orderStatus, o.createdAt as orderDate
            FROM "CouponUsage" cu
            JOIN "Order" o ON cu."orderId" = o."id"
            WHERE cu."couponId" = ${couponId}
            ORDER BY cu."usedAt" DESC
        `

        const usages = usagesRaw.map(u => ({
            ...u,
            usedAt: new Date(u.usedAt),
            order: {
                id: u.orderId,
                total: u.orderTotal,
                status: u.orderStatus,
                createdAt: new Date(u.orderDate),
                items: [] // Products are complex to join raw, keeping it empty for now
            }
        }))

        const totalDiscounted = usages.reduce((acc, usage) => acc + usage.discountAmount, 0)

        return { coupon: { ...coupon, usages }, totalDiscounted }
    } catch (e) {
        console.error(e)
        return { error: "Error obteniendo métricas" }
    }
}

export async function validateCoupon(code: string, restaurantId: string, subtotal: number) {
    try {
        const session = await getSession();
        const userId = session?.id;
        const couponsRaw: any[] = await prisma.$queryRaw`
            SELECT * FROM "Coupon" 
            WHERE "code" = ${code} AND "restaurantId" = ${restaurantId} AND "status" = 'ACTIVE'
            LIMIT 1
        `

        if (couponsRaw.length === 0) return { error: "Cupón inválido o inactivo" };
        const coupon = {
            ...couponsRaw[0],
            startDate: new Date(couponsRaw[0].startDate),
            expirationDate: new Date(couponsRaw[0].expirationDate)
        }

        const now = new Date();
        if (now < coupon.startDate || now > coupon.expirationDate) {
            return { error: "El cupón ha expirado o aún no es válido" };
        }

        if (subtotal < coupon.minOrderAmount) {
            return { error: `Este cupón requiere un mínimo de $${coupon.minOrderAmount}` };
        }

        if (coupon.totalUsageLimit && coupon.currentUsages >= coupon.totalUsageLimit) {
            return { error: "El cupón ha alcanzado su límite de usos" };
        }

        if (coupon.userUsageLimit) {
            if (!userId) return { error: "Debes iniciar sesión para verificar este cupón" };
            const usageCount: any[] = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM "CouponUsage" 
                WHERE "couponId" = ${coupon.id} AND "userId" = ${userId}
            `
            if (Number(usageCount[0].count) >= coupon.userUsageLimit) {
                return { error: `Ya usaste este cupón el máximo de veces permitido` };
            }
        }

        let discountAmount = 0;
        if (coupon.type === "PERCENTAGE") {
            discountAmount = subtotal * ((coupon.value || 0) / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else if (coupon.type === "FIXED_AMOUNT") {
            discountAmount = coupon.value || 0;
            if (discountAmount > subtotal) discountAmount = subtotal; // Cannot discount more than subtotal
        }

        return { success: true, coupon, discountAmount };
    } catch (e) {
        console.error(e);
        return { error: "Error validando cupón" };
    }
}
