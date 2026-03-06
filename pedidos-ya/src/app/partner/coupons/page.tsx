import { getRestaurantCoupons } from "@/app/actions/coupons"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Tag, Plus, TrendingUp, CalendarX2, PauseCircle } from "lucide-react"

export default async function PartnerCouponsPage() {
    const data = await getRestaurantCoupons()

    if (data.error || !data.coupons) {
        redirect("/partner")
    }

    const coupons = data.coupons || []

    const activeCoupons = coupons.filter((c: any) => c.status === "ACTIVE")
    const pausedCoupons = coupons.filter((c: any) => c.status === "PAUSED")
    const expiredCoupons = coupons.filter((c: any) => c.status === "EXPIRED" || c.status === "DEPLETED")

    const totalUsages = coupons.reduce((acc: number, c: any) => acc + c._count.usages, 0)

    function StatusBadge({ status }: { status: string }) {
        if (status === 'ACTIVE') return <Badge className="bg-green-100 text-green-700 border-none font-bold">Activo</Badge>
        if (status === 'PAUSED') return <Badge className="bg-amber-100 text-amber-700 border-none font-bold">Pausado</Badge>
        if (status === 'EXPIRED') return <Badge className="bg-gray-100 text-gray-500 border-none font-bold">Expirado</Badge>
        if (status === 'DEPLETED') return <Badge className="bg-red-100 text-red-700 border-none font-bold">Agotado</Badge>
        return <Badge className="bg-gray-100 text-gray-600 border-none font-bold">{status}</Badge>
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/partner" className="text-gray-400 hover:text-gray-600 text-sm font-bold uppercase tracking-wide">← Partner Hub</Link>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase flex items-center gap-2">
                        <Tag className="h-6 w-6 text-red-600" /> Mis Promociones
                    </h1>
                </div>
                <Link href="/partner/coupons/create"
                    className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold px-6 rounded-lg text-sm uppercase flex items-center gap-2 w-full sm:w-auto justify-center"
                    style={{ backgroundColor: '#dc2626', color: '#fff' }}
                >
                    <Plus className="h-4 w-4" /> Crear nuevo cupón
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-xl"><Tag className="h-6 w-6 text-red-600" /></div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Cupones Activos</p>
                            <p className="text-3xl font-black text-gray-900">{activeCoupons.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-xl"><TrendingUp className="h-6 w-6 text-green-600" /></div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Usos Totales</p>
                            <p className="text-3xl font-black text-gray-900">{totalUsages}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl"><CalendarX2 className="h-6 w-6 text-gray-400" /></div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Expirados / Agotados</p>
                            <p className="text-3xl font-black text-gray-900">{expiredCoupons.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-lg font-bold uppercase tracking-wide text-gray-900 mb-4">Todos tus cupones</h2>

            {coupons.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-bold text-gray-700">Aún no tienes promociones</p>
                    <p className="text-gray-400 text-sm mt-1 mb-4">Atrae más clientes creando tu primer cupón de descuento.</p>
                    <Link href="/partner/coupons/create"
                        className="inline-flex items-center justify-center h-10 px-6 rounded-lg font-bold text-sm uppercase"
                        style={{ backgroundColor: '#dc2626', color: '#fff' }}
                    >Comenzar</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((coupon: any) => (
                        <Card key={coupon.id} className="rounded-xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 z-10">
                                <StatusBadge status={coupon.status} />
                            </div>
                            <CardContent className="p-5">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">{coupon.internalName}</p>
                                <div className="flex items-center gap-2 mb-3 mt-4">
                                    <div className="bg-gray-100 border border-dashed border-gray-300 px-3 py-1 rounded font-mono font-bold text-gray-900 tracking-wider">
                                        {coupon.code}
                                    </div>
                                    <span className="text-sm font-bold text-red-600">
                                        {coupon.type === 'PERCENTAGE' ? `${coupon.value}% Dcto` :
                                            coupon.type === 'FIXED_AMOUNT' ? `$${coupon.value} Dcto` :
                                                coupon.type === 'FREE_SHIPPING' ? `Envío Gratis` : coupon.type}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{coupon.description}</p>

                                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg border mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-xs font-bold uppercase">Usos</span>
                                        <span className="font-bold text-gray-900 flex items-center gap-1">
                                            {coupon.currentUsages} {coupon.totalUsageLimit ? `/ ${coupon.totalUsageLimit}` : ''}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-xs font-bold uppercase">Vence</span>
                                        <span className="font-bold text-gray-900">
                                            {new Date(coupon.expirationDate).toLocaleDateString('es-CL')}
                                        </span>
                                    </div>
                                </div>

                                <Link href={`/partner/coupons/${coupon.id}`}>
                                    <Button variant="outline" className="w-full font-bold text-sm h-10 rounded-lg border-gray-200 hover:bg-gray-50">
                                        Ver Detalles
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
