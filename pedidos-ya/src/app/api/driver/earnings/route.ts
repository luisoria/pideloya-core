/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

// GET /api/driver/earnings?email=xxx
// Returns: deliveries, total earned, daily breakdown, trips list
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')
        const period = searchParams.get('period') || 'week' // week, month, all

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400, headers: corsHeaders })
        }

        const driver = await prisma.user.findUnique({ where: { email } })
        if (!driver) {
            return NextResponse.json({ error: 'Driver no encontrado' }, { status: 404, headers: corsHeaders })
        }

        // Date filtering
        const now = new Date()
        let dateFilter: Date | undefined
        if (period === 'week') {
            dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (period === 'month') {
            dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        const whereClause: any = { driverId: driver.id, status: 'DELIVERED' }
        if (dateFilter) whereClause.updatedAt = { gte: dateFilter }

        // Fetch completed deliveries
        const deliveries = await prisma.order.findMany({
            where: whereClause,
            include: {
                restaurant: true,
                customer: true,
                items: { include: { product: true } }
            },
            orderBy: { updatedAt: 'desc' }
        })

        // Calculate earnings (driver gets 15% of order total as commission)
        const commissionRate = 0.15
        const trips = deliveries.map(d => ({
            id: d.id,
            orderNumber: '#' + d.id.substring(0, 6).toUpperCase(),
            restaurantName: d.restaurant.name,
            restaurantAddress: d.restaurant.address,
            customerName: d.customer.name,
            orderTotal: d.total,
            driverEarning: Math.round(d.total * commissionRate),
            deliveredAt: d.updatedAt,
            createdAt: d.createdAt,
            itemCount: d.items.reduce((sum: number, i: any) => sum + i.quantity, 0),
        }))

        const totalEarnings = trips.reduce((sum, t) => sum + t.driverEarning, 0)
        const totalDeliveries = trips.length
        const avgEarningPerTrip = totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0

        // Daily breakdown for chart
        const dailyMap = new Map<string, { date: string, earnings: number, trips: number }>()
        for (const trip of trips) {
            const dayKey = new Date(trip.deliveredAt).toISOString().split('T')[0]
            const existing = dailyMap.get(dayKey) || { date: dayKey, earnings: 0, trips: 0 }
            existing.earnings += trip.driverEarning
            existing.trips += 1
            dailyMap.set(dayKey, existing)
        }
        const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

        // All-time stats
        const allTimeDeliveries = await prisma.order.count({
            where: { driverId: driver.id, status: 'DELIVERED' }
        })
        const allTimeSum = await prisma.order.aggregate({
            where: { driverId: driver.id, status: 'DELIVERED' },
            _sum: { total: true }
        })

        return NextResponse.json({
            driver: {
                name: driver.name,
                email: driver.email,
            },
            period,
            summary: {
                totalDeliveries,
                totalEarnings,
                avgEarningPerTrip,
                commissionRate: commissionRate * 100,
            },
            allTime: {
                totalDeliveries: allTimeDeliveries,
                totalEarnings: Math.round((allTimeSum._sum.total || 0) * commissionRate),
            },
            dailyBreakdown,
            trips,
        }, { headers: corsHeaders })

    } catch (error) {
        console.error('[driver/earnings GET]', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: corsHeaders })
    }
}
