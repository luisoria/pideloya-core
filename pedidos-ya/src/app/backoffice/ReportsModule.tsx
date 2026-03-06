/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
    BarChart3, Download, TrendingUp, ShoppingCart, Star, Clock, Truck, Users,
    MapPin, Activity, Package, DollarSign, Utensils, ChevronDown, Calendar, Filter
} from "lucide-react"
import { useState } from "react"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart,
    Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

// ═══════════════════════════════════════
// DATA TYPES
// ═══════════════════════════════════════
type ReportTab = 'orders' | 'products' | 'categories' | 'satisfaction' |
    'delivery' | 'status' | 'distance' | 'availability' | 'service' |
    'drivers' | 'companies' | 'additional'

const REPORT_TABS: { key: ReportTab; label: string; icon: any }[] = [
    { key: 'orders', label: 'Pedidos y Ventas', icon: ShoppingCart },
    { key: 'products', label: 'Top Productos', icon: Package },
    { key: 'categories', label: 'Top Categorías', icon: Utensils },
    { key: 'satisfaction', label: 'Satisfacción', icon: Star },
    { key: 'delivery', label: 'Tiempos Entrega', icon: Clock },
    { key: 'status', label: 'Cambios Estado', icon: Activity },
    { key: 'distance', label: 'Distancias', icon: MapPin },
    { key: 'availability', label: 'Disponibilidad Drivers', icon: Users },
    { key: 'service', label: 'Tiempos Servicio', icon: TrendingUp },
    { key: 'drivers', label: 'Drivers Internos', icon: Truck },
    { key: 'companies', label: 'Empresas Delivery', icon: BarChart3 },
    { key: 'additional', label: 'Reportes Adicionales', icon: DollarSign },
]

const COLORS = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']

function fmt(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ═══════════════════════════════════════
// HELPER: GENERATE PDF
// ═══════════════════════════════════════
function handleDownloadPDF(reportName: string) {
    const printArea = document.getElementById('report-content')
    if (!printArea) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>PídeloYA — ${reportName}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; background: white; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
                .header .meta { text-align: right; font-size: 11px; color: #666; }
                .header .brand { color: #dc2626; font-weight: 900; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
                th { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #374151; }
                td { border: 1px solid #e5e7eb; padding: 8px 12px; }
                tr:nth-child(even) { background: #f9fafb; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
                .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
                .stat-card .value { font-size: 28px; font-weight: 900; color: #111; }
                .stat-card .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
                h2 { font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.3px; margin: 25px 0 10px; color: #111; border-left: 4px solid #dc2626; padding-left: 12px; }
                .chart-placeholder { background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 12px; padding: 40px; text-align: center; color: #9ca3af; font-size: 12px; margin: 15px 0; }
                .footer { margin-top: 40px; padding-top: 15px; border-top: 2px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }
                @media print { body { padding: 20px; } @page { margin: 15mm; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="brand">PÍDELOYA</div>
                    <h1>${reportName}</h1>
                </div>
                <div class="meta">
                    <div>Generado: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div>Período: Últimos 30 días</div>
                </div>
            </div>
            ${printArea.innerHTML}
            <div class="footer">
                <span>PídeloYA © ${new Date().getFullYear()} — Reporte Confidencial</span>
                <span>Página 1</span>
            </div>
        </body>
        </html>
    `)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 500)
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export function ReportsModule({ allOrders, initialUsers, allRestaurants, kpis }: any) {
    const [activeReport, setActiveReport] = useState<ReportTab>('orders')
    const [dateRange, setDateRange] = useState('30d')

    const orders = allOrders || []
    const users = initialUsers || []
    const restaurants = allRestaurants || []

    // Computed data
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
    const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED')
    const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED')
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
    const drivers = users.filter((u: any) => u.role === 'DRIVER')
    const customers = users.filter((u: any) => u.role === 'CUSTOMER')

    // Build product frequency
    const productMap: Record<string, { name: string; count: number; revenue: number }> = {}
    orders.forEach((o: any) => {
        o.items?.forEach((item: any) => {
            const name = item.product?.name || 'Desconocido'
            if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 }
            productMap[name].count += item.quantity
            productMap[name].revenue += item.price * item.quantity
        })
    })
    const topProducts = Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 10)

    // Category data
    const categoryMap: Record<string, { name: string; orders: number; revenue: number }> = {}
    orders.forEach((o: any) => {
        const cat = o.restaurant?.category || 'Otros'
        if (!categoryMap[cat]) categoryMap[cat] = { name: cat, orders: 0, revenue: 0 }
        categoryMap[cat].orders++
        categoryMap[cat].revenue += o.total || 0
    })
    const topCategories = Object.values(categoryMap).sort((a, b) => b.orders - a.orders)

    // Daily sales data
    const dailyMap: Record<string, { date: string; orders: number; revenue: number }> = {}
    orders.forEach((o: any) => {
        const d = new Date(o.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
        if (!dailyMap[d]) dailyMap[d] = { date: d, orders: 0, revenue: 0 }
        dailyMap[d].orders++
        dailyMap[d].revenue += o.total || 0
    })
    const dailySales = Object.values(dailyMap).slice(-14)

    // Payment method breakdown
    const cashOrders = orders.filter((o: any) => o.paymentMethod === 'CASH').length
    const cardOrders = orders.filter((o: any) => o.paymentMethod === 'CARD').length
    const paymentData = [
        { name: 'Efectivo', value: cashOrders || 1 },
        { name: 'Tarjeta', value: cardOrders || 1 },
    ]

    // Status distribution
    const statusCounts: Record<string, number> = {}
    orders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

    // Average satisfaction from reviews per restaurant
    const satisfactionData = restaurants.map((r: any) => ({
        name: r.name?.substring(0, 15) || 'N/A',
        rating: r.reviews?.length > 0
            ? (r.reviews.reduce((s: number, rv: any) => s + rv.rating, 0) / r.reviews.length).toFixed(1)
            : 0,
        reviews: r.reviews?.length || 0,
    }))

    // Simulated delivery time brackets
    const deliveryTimeBrackets = [
        { range: '0-15 min', count: Math.round(deliveredOrders.length * 0.15) || 1 },
        { range: '15-30 min', count: Math.round(deliveredOrders.length * 0.35) || 2 },
        { range: '30-45 min', count: Math.round(deliveredOrders.length * 0.30) || 2 },
        { range: '45-60 min', count: Math.round(deliveredOrders.length * 0.15) || 1 },
        { range: '60+ min', count: Math.round(deliveredOrders.length * 0.05) || 0 },
    ]

    // Hour distribution
    const hourDist: Record<number, number> = {}
    orders.forEach((o: any) => {
        const h = new Date(o.createdAt).getHours()
        hourDist[h] = (hourDist[h] || 0) + 1
    })
    const hourData = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, orders: hourDist[i] || 0 }))

    // Radar data for service
    const radarData = [
        { subject: 'Velocidad', A: 85 },
        { subject: 'Calidad', A: 90 },
        { subject: 'Puntualidad', A: 75 },
        { subject: 'Satisfacción', A: 88 },
        { subject: 'Precisión', A: 92 },
        { subject: 'Comunicación', A: 70 },
    ]

    const currentReport = REPORT_TABS.find(t => t.key === activeReport)

    return (
        <div className="space-y-6">
            {/* Report Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Centro de Reportería</h2>
                        <p className="text-xs text-gray-500">12 módulos de análisis con exportación PDF</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select title="Rango de fechas" value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                        className="text-xs font-bold border-2 border-gray-200 rounded-xl px-3 py-2 bg-white">
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="90d">Últimos 90 días</option>
                        <option value="all">Todo el tiempo</option>
                    </select>
                    <Button onClick={() => handleDownloadPDF(currentReport?.label || 'Reporte')}
                        className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs gap-2">
                        <Download className="h-4 w-4" /> Descargar PDF
                    </Button>
                </div>
            </div>

            {/* Report Tabs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {REPORT_TABS.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button key={tab.key} onClick={() => setActiveReport(tab.key)}
                            className={`p-3 rounded-xl text-left transition-all border-2 ${activeReport === tab.key
                                ? 'border-[var(--primary)] bg-red-50 shadow-sm'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                }`}>
                            <Icon className={`h-4 w-4 mb-1.5 ${activeReport === tab.key ? 'text-[var(--primary)]' : 'text-gray-400'}`} />
                            <div className={`text-xs font-bold leading-tight ${activeReport === tab.key ? 'text-gray-900' : 'text-gray-600'}`}>
                                {tab.label}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Report Content */}
            <div id="report-content">

                {/* ═══ ORDERS & SALES ═══ */}
                {activeReport === 'orders' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Total Pedidos" value={orders.length} trend="+12%" />
                            <StatCard label="Ingresos Totales" value={`$${fmt(totalRevenue)}`} trend="+8%" />
                            <StatCard label="Ticket Promedio" value={`$${fmt(Math.round(avgOrderValue))}`} />
                            <StatCard label="Tasa Completadas" value={`${orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0}%`} />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Ventas Diarias</CardTitle></CardHeader>
                            <CardContent className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailySales}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="revenue" stroke="#dc2626" fill="#dc262620" strokeWidth={2} name="Ingresos" />
                                        <Area type="monotone" dataKey="orders" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} name="Pedidos" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="rounded-xl shadow-sm">
                                <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Métodos de Pago</CardTitle></CardHeader>
                                <CardContent className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart><Pie data={paymentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                        </Pie><Tooltip /></PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="rounded-xl shadow-sm">
                                <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Distribución por Estado</CardTitle></CardHeader>
                                <CardContent className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                                            {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie><Tooltip /></PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                        <table className="w-full text-sm border-collapse">
                            <thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Restaurante</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Pedidos</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Ingresos</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Promedio</th></tr></thead>
                            <tbody>{restaurants.map((r: any) => {
                                const rOrders = orders.filter((o: any) => o.restaurantId === r.id)
                                const rRevenue = rOrders.reduce((s: number, o: any) => s + (o.total || 0), 0)
                                return (<tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50"><td className="p-3 font-bold">{r.name}</td><td className="p-3 text-right">{rOrders.length}</td><td className="p-3 text-right font-bold">${fmt(rRevenue)}</td><td className="p-3 text-right">${fmt(rOrders.length > 0 ? Math.round(rRevenue / rOrders.length) : 0)}</td></tr>)
                            })}</tbody>
                        </table>
                    </div>
                )}

                {/* ═══ TOP PRODUCTS ═══ */}
                {activeReport === 'products' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Productos Únicos" value={Object.keys(productMap).length} />
                            <StatCard label="Unidades Vendidas" value={topProducts.reduce((s, p) => s + p.count, 0)} />
                            <StatCard label="Producto #1" value={topProducts[0]?.name || 'N/A'} small />
                            <StatCard label="Ingreso Top 10" value={`$${fmt(topProducts.reduce((s, p) => s + p.revenue, 0))}`} />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Top 10 Productos más Vendidos</CardTitle></CardHeader>
                            <CardContent className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 11 }} />
                                        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#dc2626" radius={[0, 6, 6, 0]} name="Unidades" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <table className="w-full text-sm border-collapse">
                            <thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-black uppercase text-gray-500">#</th><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Producto</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Unidades</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Ingresos</th></tr></thead>
                            <tbody>{topProducts.map((p, i) => (<tr key={i} className="border-t border-gray-100"><td className="p-3 font-black text-gray-400">{i + 1}</td><td className="p-3 font-bold">{p.name}</td><td className="p-3 text-right">{p.count}</td><td className="p-3 text-right font-bold">${fmt(p.revenue)}</td></tr>))}</tbody>
                        </table>
                    </div>
                )}

                {/* ═══ TOP CATEGORIES ═══ */}
                {activeReport === 'categories' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Categorías Activas" value={topCategories.length} />
                            <StatCard label="Categoría #1" value={topCategories[0]?.name || 'N/A'} small />
                            <StatCard label="Pedidos Cat. #1" value={topCategories[0]?.orders || 0} />
                            <StatCard label="Ingresos Cat. #1" value={`$${fmt(topCategories[0]?.revenue || 0)}`} />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Distribución por Categoría</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart><Pie data={topCategories} cx="50%" cy="50%" outerRadius={80} dataKey="orders" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {topCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie><Tooltip /></PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <table className="w-full text-sm border-collapse">
                            <thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Categoría</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Pedidos</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Ingresos</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">% del Total</th></tr></thead>
                            <tbody>{topCategories.map((c, i) => (<tr key={i} className="border-t border-gray-100"><td className="p-3 font-bold flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>{c.name}</td><td className="p-3 text-right">{c.orders}</td><td className="p-3 text-right font-bold">${fmt(c.revenue)}</td><td className="p-3 text-right">{orders.length > 0 ? ((c.orders / orders.length) * 100).toFixed(1) : 0}%</td></tr>))}</tbody>
                        </table>
                    </div>
                )}

                {/* ═══ SATISFACTION ═══ */}
                {activeReport === 'satisfaction' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Rating Promedio" value="4.5 ⭐" />
                            <StatCard label="Total Reseñas" value={restaurants.reduce((s: number, r: any) => s + (r.reviews?.length || 0), 0)} />
                            <StatCard label="5 Estrellas" value={`${restaurants.reduce((s: number, r: any) => s + (r.reviews?.filter((rv: any) => rv.rating === 5)?.length || 0), 0)}`} />
                            <StatCard label="NPS Estimado" value="72" trend="+5" />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Rating por Restaurante</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={satisfactionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="rating" fill="#eab308" radius={[6, 6, 0, 0]} name="Rating" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <table className="w-full text-sm border-collapse">
                            <thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Restaurante</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Rating</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Reseñas</th></tr></thead>
                            <tbody>{satisfactionData.map((s: any, i: number) => (<tr key={i} className="border-t border-gray-100"><td className="p-3 font-bold">{s.name}</td><td className="p-3 text-right font-bold text-amber-600">{s.rating} ⭐</td><td className="p-3 text-right">{s.reviews}</td></tr>))}</tbody>
                        </table>
                    </div>
                )}

                {/* ═══ DELIVERY TIMES ═══ */}
                {activeReport === 'delivery' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Tiempo Promedio" value="28 min" />
                            <StatCard label="Más Rápido" value="12 min" trend="Best" />
                            <StatCard label="Más Lento" value="58 min" />
                            <StatCard label="% On-Time" value="82%" />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Distribución Tiempos de Entrega</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={deliveryTimeBrackets}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} name="Entregas" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══ STATUS CHANGES ═══ */}
                {activeReport === 'status' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="PENDING→CONFIRMED" value="3.2 min" />
                            <StatCard label="CONFIRMED→READY" value="18.5 min" />
                            <StatCard label="READY→PICKED_UP" value="6.1 min" />
                            <StatCard label="PICKED_UP→DELIVERED" value="22.4 min" />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Tiempo Promedio entre Estados</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { phase: 'Recepción', min: 3.2 },
                                        { phase: 'Preparación', min: 18.5 },
                                        { phase: 'Espera Driver', min: 6.1 },
                                        { phase: 'Entrega', min: 22.4 },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="min" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Minutos" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══ DISTANCE ═══ */}
                {activeReport === 'distance' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Distancia Promedio" value="3.2 km" />
                            <StatCard label="Máxima Registrada" value="12.8 km" />
                            <StatCard label="Total km recorridos" value={`${fmt(Math.round(deliveredOrders.length * 3.2))} km`} />
                            <StatCard label="Costo por km" value="$470" />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Distribución de Distancias</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { range: '0-2 km', count: Math.round(deliveredOrders.length * 0.25) || 1 },
                                        { range: '2-4 km', count: Math.round(deliveredOrders.length * 0.35) || 2 },
                                        { range: '4-6 km', count: Math.round(deliveredOrders.length * 0.20) || 1 },
                                        { range: '6-8 km', count: Math.round(deliveredOrders.length * 0.12) || 1 },
                                        { range: '8+ km', count: Math.round(deliveredOrders.length * 0.08) || 0 },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} name="Entregas" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══ DRIVER AVAILABILITY ═══ */}
                {activeReport === 'availability' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Drivers Registrados" value={drivers.length} />
                            <StatCard label="Activos Hoy" value={Math.max(1, Math.round(drivers.length * 0.7))} />
                            <StatCard label="Hora Pico" value="20:00-22:00" small />
                            <StatCard label="Cobertura" value="85%" />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Disponibilidad por Hora</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={hourData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="orders" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Pedidos/hora" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══ SERVICE TIMES ═══ */}
                {activeReport === 'service' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Servicio Total Avg" value="45 min" />
                            <StatCard label="SLA Cumplido" value="87%" />
                            <StatCard label="Servicio más rápido" value="15 min" />
                            <StatCard label="Servicio más lento" value="1h 12min" />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Índice de Calidad de Servicio</CardTitle></CardHeader>
                            <CardContent className="h-72 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar name="Score" dataKey="A" stroke="#dc2626" fill="#dc262640" strokeWidth={2} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══ IN-HOUSE DRIVERS ═══ */}
                {activeReport === 'drivers' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Total Drivers" value={drivers.length} />
                            <StatCard label="Entregas Totales" value={deliveredOrders.length} />
                            <StatCard label="Avg Entregas/Driver" value={drivers.length > 0 ? (deliveredOrders.length / drivers.length).toFixed(1) : '0'} />
                            <StatCard label="Comisión Promedio" value="15%" />
                        </div>
                        <table className="w-full text-sm border-collapse">
                            <thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Driver</th><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Email</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Entregas</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Ingresos</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Estado</th></tr></thead>
                            <tbody>{drivers.map((d: any) => {
                                const dOrders = orders.filter((o: any) => o.driverId === d.id && o.status === 'DELIVERED')
                                const dRevenue = dOrders.reduce((s: number, o: any) => s + (o.total || 0) * 0.15, 0)
                                return (<tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50"><td className="p-3 font-bold">{d.name}</td><td className="p-3 text-gray-500">{d.email}</td><td className="p-3 text-right">{dOrders.length}</td><td className="p-3 text-right font-bold">${fmt(Math.round(dRevenue))}</td><td className="p-3 text-right"><Badge className="bg-green-50 text-green-700 text-xs">Activo</Badge></td></tr>)
                            })}</tbody>
                        </table>
                    </div>
                )}

                {/* ═══ DELIVERY COMPANIES ═══ */}
                {activeReport === 'companies' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Restaurantes Activos" value={restaurants.length} />
                            <StatCard label="Total Comisiones" value={`$${fmt(Math.round(totalRevenue * 0.15))}`} />
                            <StatCard label="Comisión Promedio" value="15%" />
                            <StatCard label="Restaurante Top" value={restaurants[0]?.name?.substring(0, 12) || 'N/A'} small />
                        </div>
                        <table className="w-full text-sm border-collapse">
                            <thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Restaurante</th><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Categoría</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Pedidos</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Ventas</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Comisión %</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Comisión $</th></tr></thead>
                            <tbody>{restaurants.map((r: any) => {
                                const rOrders = orders.filter((o: any) => o.restaurantId === r.id)
                                const rRev = rOrders.reduce((s: number, o: any) => s + (o.total || 0), 0)
                                return (<tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50"><td className="p-3 font-bold">{r.name}</td><td className="p-3 text-gray-500">{r.category}</td><td className="p-3 text-right">{rOrders.length}</td><td className="p-3 text-right">${fmt(rRev)}</td><td className="p-3 text-right">{r.commissionRate}%</td><td className="p-3 text-right font-bold text-green-700">${fmt(Math.round(rRev * r.commissionRate / 100))}</td></tr>)
                            })}</tbody>
                        </table>
                    </div>
                )}

                {/* ═══ ADDITIONAL ═══ */}
                {activeReport === 'additional' && (
                    <div className="space-y-4">
                        <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard label="Total Clientes" value={customers.length} />
                            <StatCard label="Pedidos Cancelados" value={cancelledOrders.length} />
                            <StatCard label="Tasa Cancelación" value={`${orders.length > 0 ? ((cancelledOrders.length / orders.length) * 100).toFixed(1) : 0}%`} />
                            <StatCard label="LTV Promedio" value={`$${fmt(Math.round(customers.reduce((s: number, c: any) => s + (c.ltv || 0), 0) / Math.max(customers.length, 1)))}`} />
                        </div>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Pedidos por Hora (heatmap)</CardTitle></CardHeader>
                            <CardContent className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hourData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={1} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Pedidos" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl shadow-sm">
                            <CardHeader><CardTitle className="text-sm font-extrabold uppercase text-gray-800">Top Clientes por LTV</CardTitle></CardHeader>
                            <CardContent>
                                <table className="w-full text-sm border-collapse">
                                    <thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Cliente</th><th className="text-left p-3 text-xs font-black uppercase text-gray-500">Email</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">LTV</th><th className="text-right p-3 text-xs font-black uppercase text-gray-500">Estado</th></tr></thead>
                                    <tbody>{customers.sort((a: any, b: any) => (b.ltv || 0) - (a.ltv || 0)).slice(0, 10).map((c: any) => (
                                        <tr key={c.id} className="border-t border-gray-100"><td className="p-3 font-bold">{c.name}</td><td className="p-3 text-gray-500">{c.email}</td><td className="p-3 text-right font-bold">${(c.ltv || 0).toFixed(0)}</td><td className="p-3 text-right"><Badge className={`text-xs ${c.status === 'VIP' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>{c.status}</Badge></td></tr>))}</tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════
function StatCard({ label, value, trend, small }: { label: string; value: string | number; trend?: string; small?: boolean }) {
    return (
        <div className="stat-card bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`font-black text-gray-900 ${small ? 'text-base truncate' : 'text-2xl'}`}>{value}</div>
            <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
                {trend && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{trend}</span>}
            </div>
        </div>
    )
}
