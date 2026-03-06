
import { AppShell } from "@/components/layout/AppShell"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DriverDashboard } from "./DriverDashboard"

export default async function DriverPage() {
    const session = await getSession()
    if (!session || session.role !== "DRIVER") {
        redirect("/login")
    }

    // Orders waiting to be picked up (available for any driver)
    const availableOrders = await prisma.order.findMany({
        where: { status: "READY" },
        include: {
            restaurant: true,
            customer: true,
            items: { include: { product: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    // Active order assigned to this driver
    const activeOrders = await prisma.order.findMany({
        where: { driverId: session.id, status: "PICKED_UP" },
        include: {
            restaurant: true,
            customer: true,
            items: { include: { product: true } }
        }
    })

    // Completed deliveries for earnings/history
    const completedOrders = await prisma.order.findMany({
        where: { driverId: session.id, status: "DELIVERED" },
        include: {
            restaurant: true,
            customer: true,
            items: { include: { product: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
    })

    // Earnings stats
    const totalDelivered = await prisma.order.count({
        where: { driverId: session.id, status: "DELIVERED" }
    })
    const allTimeSum = await prisma.order.aggregate({
        where: { driverId: session.id, status: "DELIVERED" },
        _sum: { total: true }
    })

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekDelivered = await prisma.order.count({
        where: { driverId: session.id, status: "DELIVERED", updatedAt: { gte: weekAgo } }
    })
    const weekSum = await prisma.order.aggregate({
        where: { driverId: session.id, status: "DELIVERED", updatedAt: { gte: weekAgo } },
        _sum: { total: true }
    })

    // Today deliveries
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDelivered = await prisma.order.count({
        where: { driverId: session.id, status: "DELIVERED", updatedAt: { gte: today } }
    })
    const todaySum = await prisma.order.aggregate({
        where: { driverId: session.id, status: "DELIVERED", updatedAt: { gte: today } },
        _sum: { total: true }
    })

    const commissionRate = 0.15

    const earningsData = {
        today: {
            deliveries: todayDelivered,
            earnings: Math.round((todaySum._sum.total || 0) * commissionRate),
        },
        week: {
            deliveries: weekDelivered,
            earnings: Math.round((weekSum._sum.total || 0) * commissionRate),
        },
        allTime: {
            deliveries: totalDelivered,
            earnings: Math.round((allTimeSum._sum.total || 0) * commissionRate),
        }
    }

    return (
        <AppShell>
            <DriverDashboard
                driverName={session.name}
                availableOrders={availableOrders}
                activeOrders={activeOrders}
                completedOrders={completedOrders}
                earnings={earningsData}
                commissionRate={commissionRate}
            />
        </AppShell>
    )
}
