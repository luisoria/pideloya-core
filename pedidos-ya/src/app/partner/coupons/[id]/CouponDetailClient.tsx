"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { updateCouponStatus } from "@/app/actions/coupons"
import {
    Tag, Activity, PauseCircle, PlayCircle, BarChart3,
    CalendarIcon, TrendingUp, Users, DollarSign
} from "lucide-react"

export function CouponDetailClient({ coupon, totalDiscounted }: { coupon: any, totalDiscounted: number }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const toggleStatus = async () => {
        setLoading(true)
        const newStatus = coupon.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
        await updateCouponStatus(coupon.id, newStatus)
        setLoading(false)
        router.refresh()
    }

    function StatusBadge({ status }: { status: string }) {
        if (status === 'ACTIVE') return <Badge className="bg-green-100 text-green-700 border-none font-bold px-3 py-1">Activo</Badge>
        if (status === 'PAUSED') return <Badge className="bg-amber-100 text-amber-700 border-none font-bold px-3 py-1">Pausado</Badge>
        if (status === 'EXPIRED') return <Badge className="bg-gray-100 text-gray-500 border-none font-bold px-3 py-1">Expirado</Badge>
        if (status === 'DEPLETED') return <Badge className="bg-red-100 text-red-700 border-none font-bold px-3 py-1">Agotado</Badge>
        return <Badge className="bg-gray-100 text-gray-600 border-none font-bold px-3 py-1">{status}</Badge>
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <button onClick={() => router.back()} className="text-gray-400 font-bold uppercase text-sm mb-4 tracking-wide hover:text-gray-900 inline-flex items-center">
                        ← Volver a Promociones
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-gray-900 uppercase">{coupon.internalName}</h1>
                        <StatusBadge status={coupon.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                        <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                            {coupon.code}
                        </span>
                        <span>Creado el {new Date(coupon.createdAt).toLocaleDateString('es-CL')}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    {coupon.status !== 'EXPIRED' && coupon.status !== 'DEPLETED' && (
                        <Button
                            variant="outline"
                            onClick={toggleStatus}
                            disabled={loading}
                            className={`h-10 rounded-xl font-bold uppercase tracking-wide px-6 
                                ${coupon.status === 'ACTIVE' ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                        >
                            {coupon.status === 'ACTIVE' ? <><PauseCircle className="mr-2 h-4 w-4" /> Pausar</> : <><PlayCircle className="mr-2 h-4 w-4" /> Activar</>}
                        </Button>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="rounded-xl border shadow-sm col-span-1 md:col-span-2">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" /> Total Descontado
                                </p>
                                <p className="text-3xl font-black text-gray-900 mt-2">${totalDiscounted.toLocaleString('es-CL')}</p>
                                <p className="text-xs font-bold text-green-600 mt-1 uppercase">Aumentando ventas</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                            <Users className="h-4 w-4" /> Usos Actuales
                        </p>
                        <p className="text-3xl font-black text-gray-900 mt-2">{coupon.currentUsages}</p>
                        <p className="text-xs font-bold text-gray-500 mt-1">
                            {coupon.totalUsageLimit ? `de ${coupon.totalUsageLimit} disponibles` : 'Sin límite configurado'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-6">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Conversión
                        </p>
                        <p className="text-3xl font-black text-gray-900 mt-2">
                            {coupon.usages?.length > 0 ? 'Exitoso' : 'Nuevo'}
                        </p>
                        <p className="text-xs font-bold text-gray-500 mt-1">Status de campaña</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Layout 2 cols */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Configuration Details */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="p-5 pb-0">
                            <CardTitle className="text-base font-bold uppercase tracking-wide text-gray-700">Configuración</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Tipo</p>
                                <p className="font-bold text-gray-900">{coupon.type}</p>
                            </div>
                            {coupon.value > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Beneficio</p>
                                    <p className="font-bold text-red-600">{coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `$${coupon.value}`}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Descripción Pública</p>
                                <p className="font-medium text-gray-700 text-sm">{coupon.description}</p>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-xs font-bold text-gray-400 uppercase">Reglas</p>
                                <ul className="text-sm font-medium text-gray-700 mt-1 space-y-1">
                                    <li>Mínimo: ${coupon.minOrderAmount}</li>
                                    <li>Límite por usuario: {coupon.userUsageLimit || 'Sin límite'}</li>
                                    <li>Vigencia: {new Date(coupon.expirationDate).toLocaleDateString('es-CL')}</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: History chart/table */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-bold uppercase tracking-wide text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-gray-400" /> Historial de Usos
                    </h2>

                    <Card className="rounded-xl border shadow-sm overflow-hidden">
                        {coupon.usages && coupon.usages.length > 0 ? (
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 border-b uppercase text-xs font-bold text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Fecha</th>
                                        <th className="px-6 py-3">Orden</th>
                                        <th className="px-6 py-3">Descuento aplicado</th>
                                        <th className="px-6 py-3">Total Cliente</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {coupon.usages.map((usage: any) => (
                                        <tr key={usage.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-500">{new Date(usage.usedAt).toLocaleString('es-CL')}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                #{usage.order.id.split('-')[0]}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-red-600">
                                                ${usage.discountAmount.toLocaleString('es-CL')}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                ${usage.order.total.toLocaleString('es-CL')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                <Activity className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                <p className="font-bold text-gray-700">Aún no hay datos</p>
                                <p className="text-sm">Este cupón no ha sido utilizado en ninguna orden.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
