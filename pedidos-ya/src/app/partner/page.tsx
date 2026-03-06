import { getPartnerData } from "./actions"
import { PartnerDashboard } from "./PartnerDashboard"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function PartnerPage() {
    const data: any = await getPartnerData()

    if (data.error === "No autorizado") {
        redirect("/login")
    }

    if (data.error === "Restaurante no configurado") {
        return (
            <div className="flex min-h-screen items-center justify-center p-8 bg-gray-50">
                <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl text-center border-t-8 border-red-600">
                    <div className="h-20 w-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                        🏪
                    </div>
                    <h1 className="text-2xl font-black italic uppercase text-gray-900 mb-4">Casi listos</h1>
                    <p className="text-gray-500 font-medium mb-8">
                        Tu usuario ya es un socio Partner, pero tu restaurante aún no se ha vinculado.
                        Por favor, contacta a soporte o espera la aprobación final del Backoffice.
                    </p>
                    <Link href="/" className="inline-block bg-gray-900 text-white font-black px-8 py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg">
                        Volver al inicio
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <PartnerDashboard
            restaurant={data.restaurant}
            totalSales={data.totalSales}
            pendingOrders={data.pendingOrders}
            inPreparationOrders={data.inPreparationOrders}
            deliveredOrders={data.deliveredOrders}
            todaySales={data.todaySales}
            todayCount={data.todayCount}
            avgRating={data.avgRating}
            reviewCount={data.reviewCount}
        />
    )
}
