import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { code, restaurantId, subtotal, customerEmail } = body

        if (!code || !restaurantId || !subtotal || !customerEmail) {
            return NextResponse.json({ error: "Faltan parámetros obligatorios" }, { status: 400, headers: corsHeaders })
        }

        const customer = await prisma.user.findUnique({
            where: { email: customerEmail }
        })

        if (!customer) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404, headers: corsHeaders })
        }

        const userId = customer.id;

        const couponsRaw: any[] = await prisma.$queryRaw`
            SELECT * FROM "Coupon" 
            WHERE "code" = ${code} AND ("restaurantId" = ${restaurantId} OR "restaurantId" IS NULL) AND "status" = 'ACTIVE'
            LIMIT 1
        `

        if (couponsRaw.length === 0) return NextResponse.json({ error: "Cupón inválido o inactivo" }, { headers: corsHeaders });
        const coupon = {
            ...couponsRaw[0],
            startDate: new Date(couponsRaw[0].startDate),
            expirationDate: new Date(couponsRaw[0].expirationDate)
        }

        const now = new Date();
        if (now < coupon.startDate || now > coupon.expirationDate) {
            return NextResponse.json({ error: "El cupón ha expirado o aún no es válido" }, { headers: corsHeaders });
        }

        if (subtotal < coupon.minOrderAmount) {
            return NextResponse.json({ error: `Este cupón requiere un mínimo de $${coupon.minOrderAmount}` }, { headers: corsHeaders });
        }

        if (coupon.totalUsageLimit && coupon.currentUsages >= coupon.totalUsageLimit) {
            return NextResponse.json({ error: "El cupón ha alcanzado su límite de usos" }, { headers: corsHeaders });
        }

        if (coupon.userUsageLimit) {
            const usageCount: any[] = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM "CouponUsage" 
                WHERE "couponId" = ${coupon.id} AND "userId" = ${userId}
            `
            if (Number(usageCount[0].count) >= coupon.userUsageLimit) {
                return NextResponse.json({ error: `Ya usaste este cupón el máximo de veces permitido` }, { headers: corsHeaders });
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
            if (discountAmount > subtotal) discountAmount = subtotal;
        }

        return NextResponse.json({ success: true, coupon, discountAmount }, { headers: corsHeaders });

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Error validando cupón" }, { status: 500, headers: corsHeaders })
    }
}
