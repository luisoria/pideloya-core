/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import {
    MapPin, Navigation, Package, CheckCircle, Clock, Bike, DollarSign,
    TrendingUp, Star, ChevronRight, Activity, Truck, ArrowRight,
    Phone, Calendar, Hash, Utensils, AlertCircle
} from "lucide-react"
import { acceptOrderAsDriver, deliverOrder } from "@/app/actions/orders"
import { useRouter } from "next/navigation"
import { QAChatModal } from "./QAChatModal"
import { QAIncidentModal } from "./QAIncidentModal"
import { MessageSquare } from "lucide-react"

interface EarningsData {
    today: { deliveries: number; earnings: number }
    week: { deliveries: number; earnings: number }
    allTime: { deliveries: number; earnings: number }
}

interface Props {
    driverName: string
    availableOrders: any[]
    activeOrders: any[]
    completedOrders: any[]
    earnings: EarningsData
    commissionRate: number
}

type Tab = 'orders' | 'active' | 'earnings' | 'history'

export function DriverDashboard({
    driverName, availableOrders, activeOrders, completedOrders, earnings, commissionRate
}: Props) {
    const router = useRouter()
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<Tab>(activeOrders.length > 0 ? 'active' : 'orders')
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [isIncidentOpen, setIsIncidentOpen] = useState(false)

    const currentOrder = activeOrders.length > 0 ? activeOrders[0] : null

    const handleAccept = async (orderId: string) => {
        setIsUpdating(orderId)
        try {
            await acceptOrderAsDriver(orderId)
            router.refresh()
        } catch (e: any) {
            alert(e.message || "Error al aceptar el pedido.")
        } finally {
            setIsUpdating(null)
        }
    }

    const handleComplete = async (orderId: string) => {
        setIsUpdating(orderId)
        try {
            await deliverOrder(orderId)
            router.refresh()
        } catch (e: any) {
            alert(e.message || "Error al procesar la entrega.")
        } finally {
            setIsUpdating(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                <div className="container py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-[var(--primary)]/20 border border-[var(--primary)]/30 flex items-center justify-center">
                                <Bike className="h-6 w-6 text-[var(--primary)]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tight">Panel Repartidor</h1>
                                <p className="text-sm text-gray-400">Hola, {driverName} 👋</p>
                            </div>
                        </div>
                        {currentOrder && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-bold text-xs animate-pulse">
                                <Activity className="h-3 w-3 mr-1" /> Pedido Activo
                            </Badge>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                            <p className="text-3xl font-black text-green-400">${earnings.today.earnings.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Hoy</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                            <p className="text-3xl font-black text-blue-400">${earnings.week.earnings.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Esta Semana</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                            <p className="text-3xl font-black text-yellow-400">{earnings.allTime.deliveries}</p>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Viajes Totales</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="container">
                <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200 -mt-3 relative z-10">
                    {([
                        { key: 'orders' as Tab, label: 'Disponibles', icon: Package, count: availableOrders.length },
                        { key: 'active' as Tab, label: 'En Curso', icon: Truck, count: activeOrders.length },
                        { key: 'earnings' as Tab, label: 'Ganancias', icon: DollarSign },
                        { key: 'history' as Tab, label: 'Historial', icon: Clock },
                    ]).map(tab => (
                        <button
                            key={tab.key}
                            className={`flex-1 py-3 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.key
                                    ? 'bg-[var(--primary)] text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-red-100 text-red-600'
                                    }`}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="container py-6">
                {/* ═══ TAB: AVAILABLE ORDERS ═══ */}
                {activeTab === 'orders' && (
                    <div>
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                            {availableOrders.length} Pedido{availableOrders.length !== 1 ? 's' : ''} Disponible{availableOrders.length !== 1 ? 's' : ''}
                        </h2>
                        {availableOrders.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg font-bold text-gray-700">Sin pedidos disponibles</p>
                                <p className="text-gray-500 text-sm mt-1">Los nuevos pedidos aparecerán aquí automáticamente</p>
                                <Button variant="outline" className="mt-4 font-bold" onClick={() => router.refresh()}>
                                    🔄 Actualizar
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {availableOrders.map(order => (
                                    <Card key={order.id} className="rounded-2xl border-gray-200 overflow-hidden hover:shadow-lg hover:border-[var(--secondary)] transition-all">
                                        <CardHeader className="bg-white pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                                                        <Utensils className="h-5 w-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base font-bold">{order.restaurant.name}</CardTitle>
                                                        <CardDescription className="flex items-center gap-1 text-xs">
                                                            <MapPin className="h-3 w-3" /> {order.restaurant.address}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="bg-green-100 text-green-700 font-black text-sm border-green-200">
                                                        ${Math.round(order.total * commissionRate).toLocaleString()}
                                                    </Badge>
                                                    <p className="text-[10px] text-gray-400 mt-1">Tu comisión</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">
                                                <Hash className="h-3 w-3 text-gray-400" />
                                                <span>#{order.id.slice(0, 8)}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="font-bold text-gray-700">Total: ${order.total.toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-4">
                                                {order.items.slice(0, 3).map((it: any, i: number) => (
                                                    <span key={i} className="mr-2">{it.quantity}x {it.product.name}{i < Math.min(order.items.length - 1, 2) ? ',' : ''}</span>
                                                ))}
                                                {order.items.length > 3 && <span className="text-gray-400">+{order.items.length - 3} más</span>}
                                            </div>
                                            <Button
                                                className="w-full h-12 font-black text-sm uppercase tracking-wider bg-[var(--primary)] hover:bg-red-700 shadow-lg shadow-red-200 rounded-xl"
                                                onClick={() => handleAccept(order.id)}
                                                disabled={isUpdating === order.id}
                                            >
                                                {isUpdating === order.id ? 'Aceptando...' : '✅ Aceptar Viaje'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ TAB: ACTIVE DELIVERY ═══ */}
                {activeTab === 'active' && (
                    <div>
                        {!currentOrder ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg font-bold text-gray-700">Sin pedido activo</p>
                                <p className="text-gray-500 text-sm mt-1">Acepta un pedido de la pestaña &quot;Disponibles&quot;</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Active Order Card */}
                                <Card className="rounded-2xl border-2 border-[var(--primary)] shadow-xl overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-white/20 text-white font-bold border-none animate-pulse">
                                                <Activity className="h-3 w-3 mr-1" /> PEDIDO EN CURSO
                                            </Badge>
                                            <span className="text-2xl font-black">${Math.round(currentOrder.total * commissionRate).toLocaleString()}</span>
                                        </div>
                                        <CardTitle className="text-xl font-black mt-2">{currentOrder.restaurant.name}</CardTitle>
                                        <CardDescription className="text-red-200">Pedido #{currentOrder.id.slice(0, 8)}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        {/* Pickup */}
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="h-10 w-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-lg">
                                                    <Package className="h-5 w-5" />
                                                </div>
                                                <div className="w-0.5 h-10 bg-gray-200 my-1" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Retirar en</p>
                                                <p className="font-bold text-gray-900 mt-1">{currentOrder.restaurant.name}</p>
                                                <p className="text-sm text-gray-500">{currentOrder.restaurant.address}</p>
                                                <div className="text-xs text-gray-400 mt-2 bg-gray-50 rounded-lg p-2">
                                                    {currentOrder.items.map((it: any, i: number) => (
                                                        <span key={i}>{it.quantity}x {it.product.name}{i < currentOrder.items.length - 1 ? ', ' : ''}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery */}
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Entregar a</p>
                                                <p className="font-bold text-gray-900 mt-1">{currentOrder.customer?.name || "Cliente Desconocido"}</p>
                                                <p className="text-sm text-gray-500">Tel: {currentOrder.customer?.phone || "N/A"}</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                                            <Button
                                                variant="outline"
                                                className="h-12 font-bold rounded-xl border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.restaurant.address + ' Santiago Chile')}`, '_blank')}
                                            >
                                                <Navigation className="mr-2 h-4 w-4 text-blue-500" /> Ir al Local
                                            </Button>
                                            <Button
                                                className="h-12 font-black rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                                                onClick={() => handleComplete(currentOrder.id)}
                                                disabled={isUpdating === currentOrder.id}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" /> Entregado
                                            </Button>
                                        </div>

                                        {/* QA Features */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                className="h-10 text-xs font-bold rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                                                onClick={() => setIsChatOpen(true)}
                                            >
                                                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Chat QA
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-10 text-xs font-bold rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                                onClick={() => setIsIncidentOpen(true)}
                                            >
                                                <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Incidencia
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <QAChatModal 
                                    isOpen={isChatOpen} 
                                    onClose={() => setIsChatOpen(false)} 
                                    orderId={currentOrder?.id || ""}
                                    customerName={currentOrder?.customer?.name || "Cliente"}
                                />
                                
                                <QAIncidentModal 
                                    isOpen={isIncidentOpen}
                                    onClose={() => setIsIncidentOpen(false)}
                                    orderId={currentOrder?.id || ""}
                                    onSuccess={() => {
                                        setActiveTab('orders')
                                        router.refresh()
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ TAB: EARNINGS ═══ */}
                {activeTab === 'earnings' && (
                    <div className="space-y-6">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Resumen de Ganancias</h2>

                        {/* Earnings Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="rounded-2xl border-gray-200 overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                                <CardContent className="p-6 text-center">
                                    <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-3xl font-black text-green-700">${earnings.today.earnings.toLocaleString()}</p>
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mt-1">Hoy</p>
                                    <p className="text-xs text-green-500 mt-1">{earnings.today.deliveries} entrega{earnings.today.deliveries !== 1 ? 's' : ''}</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-gray-200 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardContent className="p-6 text-center">
                                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <p className="text-3xl font-black text-blue-700">${earnings.week.earnings.toLocaleString()}</p>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">Esta Semana</p>
                                    <p className="text-xs text-blue-500 mt-1">{earnings.week.deliveries} entrega{earnings.week.deliveries !== 1 ? 's' : ''}</p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-2xl border-gray-200 overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                                <CardContent className="p-6 text-center">
                                    <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                                    <p className="text-3xl font-black text-yellow-700">${earnings.allTime.earnings.toLocaleString()}</p>
                                    <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mt-1">Total Histórico</p>
                                    <p className="text-xs text-yellow-500 mt-1">{earnings.allTime.deliveries} entrega{earnings.allTime.deliveries !== 1 ? 's' : ''}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Commission Info */}
                        <Card className="rounded-2xl bg-gray-900 text-white border-none overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tu Comisión por Viaje</p>
                                        <p className="text-4xl font-black mt-2">{commissionRate * 100}%</p>
                                        <p className="text-xs text-gray-500 mt-1">Del total de cada pedido entregado</p>
                                    </div>
                                    <div className="h-20 w-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                        <DollarSign className="h-10 w-10 text-green-400" />
                                    </div>
                                </div>
                                {earnings.allTime.deliveries > 0 && (
                                    <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between text-sm">
                                        <span className="text-gray-400">Promedio por viaje</span>
                                        <span className="font-black text-green-400">
                                            ${Math.round(earnings.allTime.earnings / earnings.allTime.deliveries).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Level Badge */}
                        <Card className="rounded-2xl border-gray-200 overflow-hidden">
                            <CardContent className="p-6 text-center">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Tu Nivel de Repartidor</p>
                                {earnings.allTime.deliveries >= 100 ? (
                                    <div>
                                        <p className="text-4xl mb-2">💎</p>
                                        <p className="text-lg font-black text-purple-700">Repartidor Diamante</p>
                                    </div>
                                ) : earnings.allTime.deliveries >= 50 ? (
                                    <div>
                                        <p className="text-4xl mb-2">🥇</p>
                                        <p className="text-lg font-black text-yellow-700">Repartidor Oro</p>
                                    </div>
                                ) : earnings.allTime.deliveries >= 20 ? (
                                    <div>
                                        <p className="text-4xl mb-2">🥈</p>
                                        <p className="text-lg font-black text-gray-600">Repartidor Plata</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-4xl mb-2">🥉</p>
                                        <p className="text-lg font-black text-orange-700">Repartidor Bronce</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {20 - earnings.allTime.deliveries} viajes más para subir a Plata
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══ TAB: TRIP HISTORY ═══ */}
                {activeTab === 'history' && (
                    <div>
                        <h2 className="text-sm font-black text-green-600 bg-gray-100 py-3 rounded-xl uppercase tracking-widest mb-6 text-center shadow-sm border border-gray-200">
                            {completedOrders.length} Viaje{completedOrders.length !== 1 ? 's' : ''} Completado{completedOrders.length !== 1 ? 's' : ''}
                        </h2>

                        {completedOrders.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg font-bold text-gray-700">Sin viajes completados</p>
                                <p className="text-gray-500 text-sm mt-1">Tu historial de entregas aparecerá aquí</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {completedOrders.map(order => (
                                    <Card key={order.id} className="rounded-2xl border-gray-200 overflow-hidden hover:shadow-md transition-all">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center">
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-base">{order.restaurant?.name || "Local Desconocido"}</p>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(order.updatedAt).toLocaleDateString('es-CL', {
                                                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </div>
                                                    <p className="text-sm text-gray-400 mt-0.5">
                                                        Para: {order.customer.name} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-green-600">
                                                    +${Math.round(order.total * commissionRate).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Total: ${order.total.toLocaleString()}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
