import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { customerEmail, restaurantId, items, total, paymentMethod = 'CASH', couponCode } = body

        const customer = await prisma.user.findUnique({
            where: { email: customerEmail }
        })

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404, headers: corsHeaders })
        }

        let validCouponId = null;
        let couponDiscountAmount = 0;

        // Validate coupon natively inside API
        if (couponCode) {
            const subtotal = items.reduce((acc: any, item: any) => acc + (item.price * item.quantity), 0);

            const couponsRaw: any[] = await prisma.$queryRaw`
                SELECT * FROM "Coupon" 
                WHERE "code" = ${couponCode} AND ("restaurantId" = ${restaurantId} OR "restaurantId" IS NULL) AND "status" = 'ACTIVE'
                LIMIT 1
            `;

            if (couponsRaw.length > 0) {
                const coupon = couponsRaw[0];
                const now = new Date();

                if (new Date(coupon.startDate) <= now && new Date(coupon.expirationDate) >= now && subtotal >= coupon.minOrderAmount) {
                    validCouponId = coupon.id;

                    if (coupon.type === "PERCENTAGE") {
                        couponDiscountAmount = subtotal * ((coupon.value || 0) / 100);
                        if (coupon.maxDiscount && couponDiscountAmount > coupon.maxDiscount) couponDiscountAmount = coupon.maxDiscount;
                    } else {
                        couponDiscountAmount = coupon.value || 0;
                        if (couponDiscountAmount > subtotal) couponDiscountAmount = subtotal;
                    }
                }
            }
        }

        const order = await prisma.$transaction(async (tx) => {
            if (validCouponId) {
                await tx.$executeRaw`
                    UPDATE "Coupon" SET "currentUsages" = "currentUsages" + 1 WHERE "id" = ${validCouponId}
                `
            }

            const newOrder = await tx.order.create({
                data: {
                    customerId: customer.id,
                    restaurantId,
                    total,
                    paymentMethod,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            });

            if (validCouponId) {
                await tx.$executeRaw`
                    INSERT INTO "CouponUsage" ("id", "couponId", "userId", "orderId", "discountAmount", "usedAt")
                    VALUES (${randomUUID()}, ${validCouponId}, ${customer.id}, ${newOrder.id}, ${couponDiscountAmount}, ${new Date().toISOString()})
                `
            }
            return newOrder;
        });

        return NextResponse.json(order, { headers: corsHeaders })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to create order" }, { status: 500, headers: corsHeaders })
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    try {
        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400, headers: corsHeaders })
        }

        const customer = await prisma.user.findUnique({
            where: { email }
        })

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404, headers: corsHeaders })
        }

        const orders = await prisma.order.findMany({
            where: { customerId: customer.id },
            include: {
                restaurant: true,
                driver: true,
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        return NextResponse.json(orders, { headers: corsHeaders })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500, headers: corsHeaders })
    }
}
