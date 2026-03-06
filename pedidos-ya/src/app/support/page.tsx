import { AppShell } from "@/components/layout/AppShell"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SupportClient } from "./SupportClient"
import { prisma } from "@/lib/prisma"

export default async function SupportPage() {
    const session = await getSession()
    if (!session) redirect("/login")

    const tickets = await prisma.ticket.findMany({
        where: { userId: session.id },
        include: { replies: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" }
    })

    const orders = await prisma.order.findMany({
        where: { customerId: session.id },
        include: { restaurant: true },
        orderBy: { createdAt: "desc" },
        take: 20
    })

    return (
        <AppShell>
            <SupportClient
                tickets={JSON.parse(JSON.stringify(tickets))}
                orders={JSON.parse(JSON.stringify(orders))}
                session={JSON.parse(JSON.stringify(session))}
            />
        </AppShell>
    )
}
