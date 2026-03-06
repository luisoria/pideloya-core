import { AppShell } from "@/components/layout/AppShell"
import { getBackofficeData } from "./actions"
import { seedBackoffice } from "./seed"
import { BackofficeDashboard } from "./BackofficeDashboard"

export default async function BackofficePage() {
    // Seed initial data if needed
    try { await seedBackoffice() } catch (e) { }

    const data = await getBackofficeData()

    if ('error' in data) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold">Unauthorized</h1>
                <p>Necesitas permisos de ADMIN para acceder al Backoffice.</p>
            </div>
        )
    }

    return (
        <AppShell>
            <BackofficeDashboard
                initialTickets={data.tickets}
                initialUsers={data.users}
                driverApplications={data.driverApplications}
                restaurantApplications={data.restaurantApplications}
                allRestaurants={data.allRestaurants}
                appCounts={data.appCounts}
                allOrders={data.allOrders}
                activeOrders={data.activeOrders}
                kpis={data.kpis}
                deliveryZones={data.deliveryZones}
                allCoupons={data.allCoupons}
            />
        </AppShell>
    )
}
