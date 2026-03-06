/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Search, MapPin, Phone, MessageSquare, CheckCircle, Clock, TrendingUp, Users, Package, DollarSign, Activity, AlertTriangle, Bike, Car, Zap, XCircle, FileText, Eye, ChevronDown, User2, Trash2, Store, LayoutDashboard, Settings, Bell, LogOut, ChevronRight, Menu, Filter, Map, Plus, BarChart3, Tag } from "lucide-react"
import { ReportsModule } from "./ReportsModule"
import { resolveTicket, approveDriverApplication, rejectDriverApplication, requestDocsDriverApplication, deleteDriverApplication, clearDraftDriverApplications, updateRestaurantCommission, approveRestaurantApplication, rejectRestaurantApplication, requestDocsRestaurantApplication, updateUserStatus, updateUserRole, adminUpdateOrderStatus, adminCancelOrder, createDeliveryZone, updateDeliveryZone, deleteDeliveryZone } from "./actions"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// Mock Data for Charts
const weeklyData = [
    { day: 'Lun', revenue: 4000, pedidos: 240 },
    { day: 'Mar', revenue: 3000, pedidos: 139 },
    { day: 'Mie', revenue: 5000, pedidos: 380 },
    { day: 'Jue', revenue: 2780, pedidos: 390 },
    { day: 'Vie', revenue: 7890, pedidos: 480 },
    { day: 'Sab', revenue: 8390, pedidos: 580 },
    { day: 'Dom', revenue: 9490, pedidos: 800 },
]

const deliveryTimes = [
    { time: '08:00', min: 24 },
    { time: '12:00', min: 35 },
    { time: '14:00', min: 42 },
    { time: '18:00', min: 19 },
    { time: '20:00', min: 45 },
    { time: '22:00', min: 28 },
]

const VEHICLE_ICONS: Record<string, any> = {
    'BICYCLE': <Bike className="h-4 w-4" />,
    'EBIKE': <Zap className="h-4 w-4" />,
    'MOTORCYCLE': <Bike className="h-4 w-4" />,
    'CAR': <Car className="h-4 w-4" />,
}

const VEHICLE_LABELS: Record<string, string> = {
    'BICYCLE': 'Bicicleta',
    'EBIKE': 'E-Bike',
    'MOTORCYCLE': 'Moto',
    'CAR': 'Auto',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    'SUBMITTED': { label: 'Pendiente', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    'IN_REVIEW': { label: 'En Revisión', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    'APPROVED': { label: 'Aprobado', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    'REJECTED': { label: 'Rechazado', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    'DOCS_INCOMPLETE': { label: 'Docs Faltan', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
    'DRAFT': { label: 'Borrador', bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
}

type TabType = 'operations' | 'drivers' | 'restaurants' | 'orders' | 'users' | 'zones' | 'reports' | 'coupons'

function fmt(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
function fmtTime(d: Date | string): string {
    const date = new Date(d)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
function fmtDate(d: Date | string): string {
    const date = new Date(d)
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${fmtTime(date)}`
}

export function BackofficeDashboard({ initialTickets, initialUsers, driverApplications, restaurantApplications, allRestaurants, appCounts, allOrders, activeOrders, kpis, deliveryZones, allCoupons }: any) {
    const router = useRouter()
    const [resolving, setResolving] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<TabType>('operations')
    const [resTab, setResTab] = useState<'applications' | 'active'>('applications')
    const [driverFilter, setDriverFilter] = useState('ALL')
    const [driverSearch, setDriverSearch] = useState('')
    const [resSearch, setResSearch] = useState('')
    const [expandedApp, setExpandedApp] = useState<string | null>(null)
    const [expandedRes, setExpandedRes] = useState<string | null>(null)
    const [commissionDraft, setCommissionDraft] = useState<Record<string, number>>({})
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [rejectModal, setRejectModal] = useState<{ id: string; type: 'reject' | 'docs'; category: 'driver' | 'res' } | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const handleResolve = async (id: string) => {
        setResolving(id)
        await resolveTicket(id)
        setResolving(null)
        router.refresh()
    }

    const handleApprove = async (id: string) => {
        setActionLoading(id)
        await approveDriverApplication(id)
        setActionLoading(null)
        router.refresh()
    }

    const handleUpdateCommission = async (resId: string, restaurantId: string) => {
        const rate = commissionDraft[resId]
        if (rate === undefined) return
        setActionLoading(resId)
        await updateRestaurantCommission(restaurantId, rate)
        setActionLoading(null)
        router.refresh()
    }

    const handleReject = async () => {
        if (!rejectModal) return
        setActionLoading(rejectModal.id)

        if (rejectModal.category === 'res') {
            if (rejectModal.type === 'reject') {
                await rejectRestaurantApplication(rejectModal.id, rejectReason)
            } else {
                await requestDocsRestaurantApplication(rejectModal.id, rejectReason)
            }
        } else {
            if (rejectModal.type === 'reject') {
                await rejectDriverApplication(rejectModal.id, rejectReason)
            } else {
                await requestDocsDriverApplication(rejectModal.id, rejectReason)
            }
        }

        setActionLoading(null)
        setRejectModal(null)
        setRejectReason('')
        router.refresh()
    }

    const handleDeleteArr = async (id: string) => {
        setActionLoading(id)
        const res = await deleteDriverApplication(id)
        if (res.error) {
            alert(res.error)
        }
        setActionLoading(null)
        setDeleteConfirm(null)
        router.refresh()
    }

    // Filter driver applications
    const filteredApps = (driverApplications || []).filter((app: any) => {
        const matchesFilter = driverFilter === 'ALL' || app.status === driverFilter
        const matchesSearch = !driverSearch ||
            `${app.firstName} ${app.lastNameP}`.toLowerCase().includes(driverSearch.toLowerCase()) ||
            app.rut?.toLowerCase().includes(driverSearch.toLowerCase()) ||
            app.email?.toLowerCase().includes(driverSearch.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* ═══════════════════════════════════════════
                SIDEBAR NAVIGATION
                ═══════════════════════════════════════════ */}
            <aside className="w-72 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 z-20">
                <div className="p-8 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">PídeloYA</h2>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Backoffice v2.0</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    <SidebarItem
                        active={activeTab === 'operations'}
                        icon={<LayoutDashboard className="h-5 w-5" />}
                        label="Dashboard Control"
                        onClick={() => setActiveTab('operations')}
                    />
                    <SidebarItem
                        active={activeTab === 'drivers'}
                        icon={<Bike className="h-5 w-5" />}
                        label="Gestión de Drivers"
                        badge={appCounts?.submitted}
                        onClick={() => setActiveTab('drivers')}
                    />
                    <SidebarItem
                        active={activeTab === 'restaurants'}
                        icon={<Store className="h-5 w-5" />}
                        label="Aliados Restaurantes"
                        badge={appCounts?.resSubmitted}
                        onClick={() => setActiveTab('restaurants')}
                    />

                    <SidebarItem
                        active={activeTab === 'orders'}
                        icon={<Package className="h-5 w-5" />}
                        label="Pedidos en Vivo"
                        badge={kpis?.activeOrderCount}
                        onClick={() => setActiveTab('orders')}
                    />

                    <div className="pt-8 pb-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase px-4 tracking-widest">Administración</span>
                    </div>
                    <SidebarItem
                        active={activeTab === 'users'}
                        icon={<Users className="h-5 w-5" />}
                        label="Usuarios"
                        onClick={() => setActiveTab('users')}
                    />
                    <SidebarItem
                        active={activeTab === 'zones'}
                        icon={<Map className="h-5 w-5" />}
                        label="Zonas de Entrega"
                        badge={(deliveryZones || []).length}
                        onClick={() => setActiveTab('zones')}
                    />
                    <SidebarItem
                        active={activeTab === 'coupons'}
                        icon={<Tag className="h-5 w-5" />}
                        label="Cupones Globales"
                        badge={(allCoupons || []).filter((c: any) => c.status === 'ACTIVE').length}
                        onClick={() => setActiveTab('coupons')}
                    />
                    <SidebarItem
                        active={activeTab === 'reports'}
                        icon={<BarChart3 className="h-5 w-5" />}
                        label="Reportería"
                        onClick={() => setActiveTab('reports')}
                    />
                    <SidebarItem icon={<Settings className="h-5 w-5" />} label="Parámetros App" onClick={() => { }} />
                </nav>

                <div className="p-6 border-t border-[#F1F5F9]">
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                        <div className="h-10 w-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate uppercase">Admin Central</p>
                            <p className="text-[10px] text-gray-500 truncate">Súper Administrador</p>
                        </div>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════
                MAIN VIEWPORT
                ═══════════════════════════════════════════ */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Global Topbar */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] flex items-center justify-between px-8 z-10 shrink-0">
                    <div>
                        <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                            {activeTab === 'operations' && 'Dashboard de Control Estratégico'}
                            {activeTab === 'drivers' && 'Monitoreo y Onboarding de Drivers'}
                            {activeTab === 'restaurants' && 'Relaciones y Comisiones de Aliados'}
                            {activeTab === 'orders' && 'Monitoreo de Pedidos en Vivo'}
                            {activeTab === 'users' && 'Administración de Usuarios'}
                            {activeTab === 'zones' && 'Zonas de Entrega'}
                            {activeTab === 'reports' && 'Centro de Reportería'}
                            {activeTab === 'coupons' && 'Gestión de Cupones y Promociones'}
                        </h1>
                        <p className="text-xs text-gray-400 font-medium">Actualizado hace pocos segundos · <span className="text-green-500">Sincronizado</span></p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-6 px-6 border-x border-gray-100 h-10">
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-gray-400 uppercase leading-none">Usuarios</span>
                                <span className="text-sm font-black text-gray-800">{fmt(kpis?.userCounts?.total || 0)}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-gray-400 uppercase leading-none">Pedidos</span>
                                <span className="text-sm font-black text-red-600">{kpis?.todayOrderCount || 0} Hoy</span>
                            </div>
                        </div>

                        <button className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 py-10">

                    {/* ═══════════════════════════════════════════
                TAB: OPERACIONES & CRM
                ═══════════════════════════════════════════ */}
                    {activeTab === 'operations' && (
                        <div className="container py-0 max-w-7xl mx-auto space-y-8 px-4">

                            {/* Top Metrics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard title="Ingresos Hoy" value={`$${fmt(kpis?.todayRevenue || 0)}`} icon={<DollarSign className="w-6 h-6 text-green-500" />} trend={`$${fmt(kpis?.totalRevenue || 0)} total`} color="bg-white border-b-4 border-green-500" />
                                <MetricCard title="Órdenes Activas" value={kpis?.activeOrderCount || 0} icon={<Package className="w-6 h-6 text-blue-500" />} trend={`${kpis?.totalOrders || 0} total`} color="bg-white border-b-4 border-blue-500" />
                                <MetricCard title="Tickets Abiertos" value={initialTickets?.filter((t: any) => t.status !== 'RESOLVED').length || '0'} icon={<AlertTriangle className="w-6 h-6 text-red-500" />} trend="Soporte" color="bg-white border-b-4 border-red-500" />
                                <MetricCard title="Usuarios Totales" value={fmt(kpis?.userCounts?.total || 0)} icon={<Users className="w-6 h-6 text-yellow-500" />} trend={`${kpis?.userCounts?.drivers || 0} drivers`} color="bg-white border-b-4 border-[var(--secondary)]" />
                            </div>

                            {/* Graphics Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Area Chart */}
                                <Card className="lg:col-span-2 shadow-lg border-t-0 rounded-xl overflow-hidden">
                                    <CardHeader className="bg-[var(--muted)] border-b pb-4">
                                        <CardTitle className="text-lg font-bold text-gray-800 uppercase flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
                                            Crecimiento Semanal (Ingresos)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                                <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Bar Chart Tiempos */}
                                <Card className="shadow-lg border-t-0 rounded-xl overflow-hidden">
                                    <CardHeader className="bg-[var(--muted)] border-b pb-4">
                                        <CardTitle className="text-lg font-bold text-gray-800 uppercase flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                            Tiempos Entrega (Mins)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={deliveryTimes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="min" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Left Column: Tracking & Map */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-[var(--secondary)] border-2 shadow-lg rounded-xl overflow-hidden">
                                        <CardHeader className="bg-gray-900 text-white pb-4 border-b border-gray-800">
                                            <CardTitle className="flex items-center gap-2 text-xl font-bold uppercase text-white">
                                                <MapPin className="h-5 w-5 text-[var(--secondary)]" /> Monitoreo Geoflota Dinámica (Santiago)
                                            </CardTitle>
                                            <CardDescription className="text-gray-400">Rastreo en vivo de flotas por sectores de alta demanda</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="w-full aspect-[21/9] bg-gray-100 relative">
                                                <iframe
                                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d106437.16109968841!2d-70.72911226068222!3d-33.47278278065039!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662c5410425af2f%3A0x8475d53c400f0931!2sSantiago%2C%20Regi%C3%B3n%20Metropolitana%2C%20Chile!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0, filter: 'contrast(1.1) saturate(1.2)' }}
                                                    allowFullScreen={false}
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    title="Backoffice Fleet Tracking"
                                                ></iframe>
                                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                    <Badge className="bg-gray-900/90 text-white shadow-xl border border-gray-700 py-1.5 px-3">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 animate-pulse inline-block"></span>{kpis?.userCounts?.drivers || 0} Drivers
                                                    </Badge>
                                                    <Badge className="bg-[var(--primary)]/90 text-white shadow-xl py-1.5 px-3">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--secondary)] mr-2 animate-pulse inline-block"></span>{kpis?.activeOrderCount || 0} Pedidos Curso
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* CRM Section */}
                                    <Card className="shadow-lg rounded-xl border-t-0 overflow-hidden">
                                        <CardHeader className="bg-white border-b pb-4">
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                <CardTitle className="text-xl font-extrabold uppercase text-gray-800">CRM & Inteligencia de Clientes</CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <Input placeholder="ID, nombre o teléfono..." className="h-9 w-64 shadow-sm border-gray-300" />
                                                    <Button size="icon" className="h-9 w-9 bg-[var(--primary)] hover:bg-red-800"><Search className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50 text-gray-600 border-b">
                                                        <tr>
                                                            <th className="px-6 py-4 font-bold uppercase text-xs">Cliente</th>
                                                            <th className="px-6 py-4 font-bold uppercase text-xs">Contacto</th>
                                                            <th className="px-6 py-4 font-bold uppercase text-xs">Órdenes / LTV</th>
                                                            <th className="px-6 py-4 font-bold uppercase text-xs">Segmento</th>
                                                            <th className="px-6 py-4 font-bold uppercase text-xs text-right">Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {initialUsers?.slice(0, 5).map((user: any) => (
                                                            <tr key={user.id} className="hover:bg-red-50/50 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-gray-900">{user.name}</div>
                                                                    <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-gray-600 flex items-center gap-2 mt-2">
                                                                    <Phone className="h-3.5 w-3.5" /> {user.phone || 'No registra'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-gray-900">{user.orders?.length || 0} compras</div>
                                                                    <div className="text-xs font-bold text-green-600 mt-0.5">${user.ltv} retenido</div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <Badge variant="outline" className={`font-bold border-2 ${user.status === 'VIP' ? 'border-[var(--secondary)] bg-yellow-50 text-yellow-800' : 'border-gray-300 text-gray-600'}`}>
                                                                        {user.status}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <Button variant="outline" size="sm" className="font-semibold text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all">Ver Perfil</Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column: Ticketing System */}
                                <div className="space-y-6">
                                    <Card className="h-full shadow-lg rounded-xl border-t-0 overflow-hidden bg-gray-50 border-gray-200">
                                        <CardHeader className="bg-white border-b sticky top-0 z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <CardTitle className="text-xl font-extrabold text-gray-800">Resolución de Tickets</CardTitle>
                                                <Badge className="bg-red-600 animate-pulse shadow-sm shadow-red-200">{initialTickets?.filter((t: any) => t.status !== 'RESOLVED').length} Urgentes</Badge>
                                            </div>
                                            <CardDescription className="text-gray-500 font-medium">Asistencia operativa para usuarios VIP y órdenes en curso.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[800px]">
                                            {initialTickets?.map((ticket: any) => (
                                                <div key={ticket.id} className={`p-4 rounded-lg bg-white shadow-sm border ${ticket.status === 'RESOLVED' ? 'opacity-60 border-gray-200' : 'border-gray-200 hover:border-[var(--secondary)] hover:shadow-md'} transition-all relative overflow-hidden`}>
                                                    {ticket.status !== 'RESOLVED' && <div className={`absolute left-0 top-0 bottom-0 w-1 ${ticket.priority === 'HIGH' ? 'bg-red-500' :
                                                        ticket.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`} />}

                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="font-bold text-xs bg-gray-100 text-gray-600 rounded px-2 py-1 uppercase tracking-wider">{ticket.id.split('-')[0] || 'T'}-{ticket.id.substring(ticket.id.length - 4)}</div>
                                                        <Badge variant="outline" className={`text-xs font-bold uppercase tracking-wider border-0 ${ticket.priority === 'HIGH' ? 'bg-red-50 text-red-700' :
                                                            ticket.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
                                                            }`}>
                                                            {ticket.priority}
                                                        </Badge>
                                                    </div>
                                                    <div className="font-bold text-gray-900 text-[15px] mb-2 leading-tight">{ticket.issue}</div>

                                                    <div className="flex items-center justify-between text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100 mt-3">
                                                        <span className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5 text-gray-400" /> <span className="text-gray-700">{ticket.user?.name || 'Usuario'}</span></span>
                                                        <span className={`font-bold ${ticket.status === 'RESOLVED' ? 'text-green-600' : 'text-blue-600'}`}>{ticket.status}</span>
                                                    </div>

                                                    {ticket.status !== 'RESOLVED' && (
                                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                                                            <Button size="sm" variant="ghost" className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold h-9">
                                                                <MessageSquare className="h-4 w-4 mr-1.5" /> Chat
                                                            </Button>
                                                            <Button size="sm" onClick={() => handleResolve(ticket.id)} disabled={resolving === ticket.id} className="flex-1 bg-green-600 shadow-sm shadow-green-200 hover:bg-green-700 text-white font-bold h-9">
                                                                <CheckCircle className="h-4 w-4 mr-1.5" /> {resolving === ticket.id ? '...' : 'Cerrar'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        TAB: PEDIDOS EN VIVO
                    ═══════════════════════════════════════════ */}
                    {activeTab === 'orders' && (
                        <div className="container max-w-7xl mx-auto space-y-6 px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Activos', count: kpis?.activeOrderCount || 0, color: 'border-blue-500', bg: 'bg-blue-50' },
                                    { label: 'Hoy', count: kpis?.todayOrderCount || 0, color: 'border-green-500', bg: 'bg-green-50' },
                                    { label: 'Entregados', count: kpis?.deliveredOrders || 0, color: 'border-gray-500', bg: 'bg-gray-50' },
                                    { label: 'Ingresos Hoy', count: `$${fmt(kpis?.todayRevenue || 0)}`, color: 'border-yellow-500', bg: 'bg-yellow-50' },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} border-b-4 ${s.color} rounded-xl p-4 shadow-sm`}>
                                        <div className="text-2xl font-black text-gray-900">{s.count}</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <CardHeader className="bg-white border-b pb-4">
                                    <CardTitle className="text-xl font-extrabold uppercase text-gray-800 flex items-center gap-2">
                                        <Package className="h-5 w-5 text-[var(--primary)]" /> Todos los Pedidos
                                    </CardTitle>
                                    <CardDescription>Monitoreo en tiempo real de todos los pedidos en la plataforma</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">ID</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Cliente</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Restaurante</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Driver</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Items</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Total</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Estado</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Hora</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(allOrders || []).slice(0, 30).map((order: any) => (
                                                    <tr key={order.id} className="hover:bg-red-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-gray-900">#{order.id.split('-')[0]}</td>
                                                        <td className="px-4 py-3">{order.customer?.name || '—'}</td>
                                                        <td className="px-4 py-3">{order.restaurant?.name || '—'}</td>
                                                        <td className="px-4 py-3">{order.driver?.name || <span className="text-gray-400">Sin asignar</span>}</td>
                                                        <td className="px-4 py-3">{order.items?.length || 0}</td>
                                                        <td className="px-4 py-3 font-bold">${fmt(order.total)}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className={`font-bold text-xs border-2 ${order.status === 'PENDING' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                                                                order.status === 'READY' ? 'border-green-300 bg-green-50 text-green-700' :
                                                                    order.status === 'PICKED_UP' ? 'border-blue-300 bg-blue-50 text-blue-700' :
                                                                        order.status === 'DELIVERED' ? 'border-gray-300 bg-gray-50 text-gray-500' :
                                                                            'border-red-300 bg-red-50 text-red-700'
                                                                }`}>
                                                                {order.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500">{fmtDate(order.createdAt)}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                                                <div className="flex items-center gap-1 justify-end">
                                                                    {order.status === 'PENDING' && (
                                                                        <Button size="sm" variant="outline" className="h-7 text-xs font-bold border-green-300 text-green-700 hover:bg-green-50"
                                                                            onClick={async () => { setActionLoading(order.id); await adminUpdateOrderStatus(order.id, 'CONFIRMED'); setActionLoading(null); router.refresh() }}
                                                                            disabled={actionLoading === order.id}>Confirmar</Button>
                                                                    )}
                                                                    <Button size="sm" variant="outline" className="h-7 text-xs font-bold border-red-300 text-red-700 hover:bg-red-50"
                                                                        onClick={async () => { setActionLoading(order.id); await adminCancelOrder(order.id); setActionLoading(null); router.refresh() }}
                                                                        disabled={actionLoading === order.id}>
                                                                        <XCircle className="h-3 w-3 mr-1" />Cancelar
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        TAB: ADMINISTRACIÓN DE USUARIOS
                    ═══════════════════════════════════════════ */}
                    {activeTab === 'users' && (
                        <div className="container max-w-7xl mx-auto space-y-6 px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Total', count: kpis?.userCounts?.total || 0, color: 'border-gray-500', bg: 'bg-gray-50' },
                                    { label: 'Clientes', count: kpis?.userCounts?.customers || 0, color: 'border-blue-500', bg: 'bg-blue-50' },
                                    { label: 'Drivers', count: kpis?.userCounts?.drivers || 0, color: 'border-green-500', bg: 'bg-green-50' },
                                    { label: 'Restaurantes', count: kpis?.userCounts?.restaurants || 0, color: 'border-purple-500', bg: 'bg-purple-50' },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} border-b-4 ${s.color} rounded-xl p-4 shadow-sm`}>
                                        <div className="text-2xl font-black text-gray-900">{s.count}</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <CardHeader className="bg-white border-b pb-4">
                                    <CardTitle className="text-xl font-extrabold uppercase text-gray-800 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-[var(--primary)]" /> Directorio de Usuarios
                                    </CardTitle>
                                    <CardDescription>Clientes, Drivers y Restaurantes registrados</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Nombre</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Email</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Teléfono</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Rol</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">LTV</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Estado</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(initialUsers || []).map((user: any) => (
                                                    <tr key={user.id} className="hover:bg-red-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-gray-900">{user.name}</td>
                                                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                                        <td className="px-4 py-3 text-gray-600">{user.phone || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className={`font-bold text-xs border-2 ${user.role === 'ADMIN' ? 'border-red-300 bg-red-50 text-red-700' :
                                                                user.role === 'DRIVER' ? 'border-green-300 bg-green-50 text-green-700' :
                                                                    user.role === 'RESTAURANT' ? 'border-purple-300 bg-purple-50 text-purple-700' :
                                                                        'border-blue-300 bg-blue-50 text-blue-700'
                                                                }`}>
                                                                {user.role}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-green-600">${user.ltv || 0}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge className={`font-bold border-none text-xs ${user.status === 'VIP' ? 'bg-yellow-100 text-yellow-700' :
                                                                user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-500'
                                                                }`}>{user.status}</Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center gap-1 justify-end">
                                                                <select title="Cambiar rol" className="text-xs border rounded px-1 py-0.5 bg-white" defaultValue={user.role}
                                                                    onChange={async (e) => { setActionLoading(user.id); await updateUserRole(user.id, e.target.value); setActionLoading(null); router.refresh() }}>
                                                                    <option value="CUSTOMER">Customer</option>
                                                                    <option value="DRIVER">Driver</option>
                                                                    <option value="RESTAURANT">Restaurant</option>
                                                                    <option value="ADMIN">Admin</option>
                                                                </select>
                                                                <select title="Cambiar estado" className="text-xs border rounded px-1 py-0.5 bg-white" defaultValue={user.status}
                                                                    onChange={async (e) => { setActionLoading(user.id); await updateUserStatus(user.id, e.target.value); setActionLoading(null); router.refresh() }}>
                                                                    <option value="REGULAR">Regular</option>
                                                                    <option value="VIP">VIP</option>
                                                                    <option value="NEW">Nuevo</option>
                                                                    <option value="ACTIVE">Activo</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        TAB: ZONAS DE ENTREGA
                    ═══════════════════════════════════════════ */}
                    {activeTab === 'zones' && (
                        <div className="container max-w-7xl mx-auto space-y-6 px-4">
                            {/* Create New Zone */}
                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <CardHeader className="bg-white border-b pb-4">
                                    <CardTitle className="text-xl font-extrabold uppercase text-gray-800 flex items-center gap-2">
                                        <Plus className="h-5 w-5 text-[var(--primary)]" /> Crear Nueva Zona
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <form onSubmit={async (e) => {
                                        e.preventDefault()
                                        const fd = new FormData(e.currentTarget)
                                        await createDeliveryZone({
                                            name: fd.get('name') as string,
                                            deliveryFee: Number(fd.get('deliveryFee')),
                                            minOrder: Number(fd.get('minOrder')),
                                            radiusKm: Number(fd.get('radiusKm')),
                                        })
                                        router.refresh()
                                    }} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                                            <Input name="name" placeholder="Ej: Providencia" required className="mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Tarifa ($)</label>
                                            <Input name="deliveryFee" type="number" defaultValue="1500" required className="mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Pedido Mín ($)</label>
                                            <Input name="minOrder" type="number" defaultValue="5000" required className="mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Radio (km)</label>
                                            <Input name="radiusKm" type="number" defaultValue="5" required className="mt-1" />
                                        </div>
                                        <Button type="submit" className="bg-[var(--primary)] hover:bg-red-700 text-white font-bold">
                                            <Plus className="h-4 w-4 mr-1" /> Agregar
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Zones List */}
                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <CardHeader className="bg-white border-b pb-4">
                                    <CardTitle className="text-xl font-extrabold uppercase text-gray-800 flex items-center gap-2">
                                        <Map className="h-5 w-5 text-[var(--primary)]" /> Zonas Configuradas ({(deliveryZones || []).length})
                                    </CardTitle>
                                    <CardDescription>Define las zonas de cobertura, tarifas de despacho y montos mínimos</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Zona</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Tarifa</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Pedido Mín</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Radio</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Estado</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(deliveryZones || []).length === 0 && (
                                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay zonas configuradas. Crea la primera arriba.</td></tr>
                                                )}
                                                {(deliveryZones || []).map((zone: any) => (
                                                    <tr key={zone.id} className="hover:bg-red-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-gray-900">{zone.name}</td>
                                                        <td className="px-4 py-3">${fmt(zone.deliveryFee)}</td>
                                                        <td className="px-4 py-3">${fmt(zone.minOrder)}</td>
                                                        <td className="px-4 py-3">{zone.radiusKm} km</td>
                                                        <td className="px-4 py-3">
                                                            <Badge className={`font-bold border-none text-xs ${zone.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                                {zone.active ? 'Activa' : 'Inactiva'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center gap-1 justify-end">
                                                                <Button size="sm" variant="outline" className="h-7 text-xs font-bold"
                                                                    onClick={async () => { await updateDeliveryZone(zone.id, { active: !zone.active }); router.refresh() }}>
                                                                    {zone.active ? 'Desactivar' : 'Activar'}
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="h-7 text-xs font-bold border-red-300 text-red-700 hover:bg-red-50"
                                                                    onClick={async () => { if (confirm('¿Eliminar esta zona?')) { await deleteDeliveryZone(zone.id); router.refresh() } }}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        TAB: REPORTERÍA
                    ═══════════════════════════════════════════ */}
                    {activeTab === 'reports' && (
                        <div className="container max-w-7xl mx-auto space-y-6 px-4">
                            <ReportsModule allOrders={allOrders} initialUsers={initialUsers} allRestaurants={allRestaurants} kpis={kpis} />
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        TAB: CUPONES Y PROMOCIONES
                    ═══════════════════════════════════════════ */}
                    {activeTab === 'coupons' && (
                        <div className="container max-w-7xl mx-auto space-y-6 px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Total Cupones', count: (allCoupons || []).length, color: 'border-gray-500', bg: 'bg-gray-50' },
                                    { label: 'Activos', count: (allCoupons || []).filter((c: any) => c.status === 'ACTIVE').length, color: 'border-green-500', bg: 'bg-green-50' },
                                    { label: 'Usados', count: (allCoupons || []).reduce((acc: number, c: any) => acc + (c.usages?.length || 0), 0), color: 'border-blue-500', bg: 'bg-blue-50' },
                                    { label: 'Desc. Total', count: `$${fmt((allCoupons || []).reduce((acc: number, c: any) => acc + (c.usages?.reduce((u: number, usage: any) => u + usage.discountApplied, 0) || 0), 0))}`, color: 'border-purple-500', bg: 'bg-purple-50' },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} border-b-4 ${s.color} rounded-xl p-4 shadow-sm`}>
                                        <div className="text-2xl font-black text-gray-900">{s.count}</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <CardHeader className="bg-white border-b pb-4">
                                    <CardTitle className="text-xl font-extrabold uppercase text-gray-800 flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-[var(--primary)]" /> Todos los Cupones
                                    </CardTitle>
                                    <CardDescription>Monitoreo global de cupones de todos los aliados y PídeloYA</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Código</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Restaurante</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Tipo</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Valor</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Usos / Límite</th>
                                                    <th className="px-4 py-3 font-bold uppercase text-xs">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(allCoupons || []).length === 0 && (
                                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 font-medium">Aún no hay cupones creados en la plataforma.</td></tr>
                                                )}
                                                {(allCoupons || []).map((coupon: any) => (
                                                    <tr key={coupon.id} className="hover:bg-red-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-gray-900 font-mono tracking-wide">{coupon.code}</td>
                                                        <td className="px-4 py-3 text-gray-700">{coupon.restaurant?.name || 'PídeloYA General'}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className="bg-gray-50 text-gray-600 font-bold border-gray-200">
                                                                {coupon.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-green-700">
                                                            {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `$${fmt(coupon.value)}`}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {coupon.usages?.length || 0} / {coupon.maxUsages || '∞'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge className={`font-bold border-none text-xs ${coupon.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                                {coupon.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                TAB: GESTIÓN DE DRIVERS
                ═══════════════════════════════════════════ */}
                    {activeTab === 'drivers' && (
                        <div className="container max-w-7xl mx-auto space-y-6 px-4">

                            {/* Driver Stats Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {[
                                    { label: 'Total', count: appCounts?.total || 0, color: 'border-gray-400', bg: 'bg-gray-50' },
                                    { label: 'Pendientes', count: appCounts?.submitted || 0, color: 'border-blue-500', bg: 'bg-blue-50' },
                                    { label: 'En Revisión', count: appCounts?.inReview || 0, color: 'border-amber-500', bg: 'bg-amber-50' },
                                    { label: 'Aprobados', count: appCounts?.approved || 0, color: 'border-green-500', bg: 'bg-green-50' },
                                    { label: 'Rechazados', count: appCounts?.rejected || 0, color: 'border-red-500', bg: 'bg-red-50' },
                                    { label: 'Docs Faltan', count: appCounts?.docsIncomplete || 0, color: 'border-orange-500', bg: 'bg-orange-50' },
                                ].map((stat) => (
                                    <div key={stat.label} className={`${stat.bg} border-b-4 ${stat.color} rounded-xl p-4 shadow-sm`}>
                                        <div className="text-2xl font-black text-gray-900">{stat.count}</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Filters & Search */}
                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <CardHeader className="bg-white border-b pb-4">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-xl font-extrabold uppercase text-gray-800 flex items-center gap-2">
                                                <User2 className="h-5 w-5 text-[var(--primary)]" />
                                                Solicitudes de Repartidores
                                            </CardTitle>
                                            <CardDescription className="text-gray-500 mt-1">Revisa, aprueba o rechaza solicitudes de nuevos drivers.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={async () => {
                                                    if(confirm("¿Estás seguro de que deseas eliminar TODOS los borradores (drafts)? Esta acción es irreversible.")) {
                                                        setActionLoading('clear-drafts');
                                                        const res = await clearDraftDriverApplications();
                                                        if(res?.error) alert(res.error);
                                                        else {
                                                            alert(`Se eliminaron ${res?.count} drafts exitosamente.`);
                                                            router.refresh();
                                                        }
                                                        setActionLoading(null);
                                                    }
                                                }}
                                                disabled={actionLoading === 'clear-drafts'}
                                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
                                                title="Eliminar todos los Drafts"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" />
                                                Limpiar Drafts
                                            </Button>
                                            <Input
                                                placeholder="Buscar por nombre, RUT o email..."
                                                className="h-9 w-72 shadow-sm border-gray-300"
                                                value={driverSearch}
                                                onChange={(e) => setDriverSearch(e.target.value)}
                                            />
                                            <Button size="icon" className="h-9 w-9 bg-[var(--primary)] hover:bg-red-800">
                                                <Search className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Status Filter Tabs */}
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {[
                                            { key: 'ALL', label: 'Todos' },
                                            { key: 'SUBMITTED', label: '📋 Pendientes' },
                                            { key: 'IN_REVIEW', label: '🔍 En Revisión' },
                                            { key: 'APPROVED', label: '✅ Aprobados' },
                                            { key: 'REJECTED', label: '❌ Rechazados' },
                                            { key: 'DOCS_INCOMPLETE', label: '📄 Docs Incompletos' },
                                        ].map((tab) => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setDriverFilter(tab.key)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${driverFilter === tab.key
                                                    ? 'bg-[var(--primary)] text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    {filteredApps.length === 0 ? (
                                        <div className="text-center py-16 text-gray-400">
                                            <User2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="font-bold text-lg">No hay solicitudes</p>
                                            <p className="text-sm">No se encontraron solicitudes con los filtros seleccionados.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {filteredApps.map((app: any) => {
                                                const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG['DRAFT']
                                                const isExpanded = expandedApp === app.id
                                                const vehicleLabel = VEHICLE_LABELS[app.vehicleType] || app.vehicleType
                                                const vehicleIcon = VEHICLE_ICONS[app.vehicleType] || <Bike className="h-4 w-4" />

                                                return (
                                                    <div key={app.id} className="hover:bg-gray-50/50 transition-all">
                                                        {/* Main Row */}
                                                        <div className="flex items-center px-6 py-4 gap-4 cursor-pointer" onClick={() => setExpandedApp(isExpanded ? null : app.id)}>
                                                            {/* Avatar */}
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-[var(--secondary)] flex items-center justify-center text-white font-black text-sm shrink-0">
                                                                {(app.firstName?.[0] || '?')}{(app.lastNameP?.[0] || '')}
                                                            </div>

                                                            {/* Name & RUT */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-gray-900 truncate">
                                                                    {app.firstName} {app.lastNameP} {app.lastNameM || ''}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-0.5">{app.rut} · {app.email}</div>
                                                            </div>

                                                            {/* Vehicle */}
                                                            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                                                {vehicleIcon} {vehicleLabel}
                                                            </div>

                                                            {/* Comuna */}
                                                            <div className="hidden lg:block text-xs text-gray-500 font-medium">
                                                                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {app.comuna}</div>
                                                            </div>

                                                            {/* Status */}
                                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                                                                <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`}></span>
                                                                {statusCfg.label}
                                                            </div>

                                                            {/* Expand Arrow */}
                                                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>

                                                        {/* Expanded Detail Panel */}
                                                        {isExpanded && (
                                                            <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                                                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                        {/* Column 1: Personal Info */}
                                                                        <div>
                                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Datos Personales</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <DetailRow label="Nombre" value={`${app.firstName} ${app.lastNameP} ${app.lastNameM || ''}`} />
                                                                                <DetailRow label="RUT" value={app.rut} />
                                                                                <DetailRow label="Nacimiento" value={app.birthDate} />
                                                                                <DetailRow label="Género" value={app.gender === 'M' ? 'Masculino' : app.gender === 'F' ? 'Femenino' : app.gender || '—'} />
                                                                                <DetailRow label="Nacionalidad" value={app.nationality === 'CL' ? '🇨🇱 Chile' : app.nationality} />
                                                                                {app.foreignDocNumber && <DetailRow label="Doc. Extranjero" value={`${app.foreignDocType}: ${app.foreignDocNumber}`} />}
                                                                            </div>
                                                                        </div>

                                                                        {/* Column 2: Contact & Address */}
                                                                        <div>
                                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Contacto & Dirección</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <DetailRow label="Email" value={app.email} />
                                                                                <DetailRow label="Teléfono" value={app.phone} />
                                                                                <DetailRow label="Dirección" value={`${app.street} ${app.streetNumber}${app.apartment ? `, ${app.apartment}` : ''}`} />
                                                                                <DetailRow label="Comuna" value={app.comuna} />
                                                                                <DetailRow label="Región" value={app.region} />
                                                                            </div>
                                                                        </div>

                                                                        {/* Column 3: Vehicle & Bank */}
                                                                        <div>
                                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Vehículo & Banco</h4>
                                                                            <div className="space-y-2 text-sm">
                                                                                <DetailRow label="Vehículo" value={vehicleLabel} />
                                                                                {app.ebikePower && <DetailRow label="Potencia" value={app.ebikePower === 'OVER_50CC' ? '50cc+' : '<50cc'} />}
                                                                                <DetailRow label="Banco" value={app.bankName} />
                                                                                <DetailRow label="Tipo Cuenta" value={app.accountType} />
                                                                                <DetailRow label="N° Cuenta" value={app.accountNumber} />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Documentación Adjunta section */}
                                                                    <div className="mt-8">
                                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                                                                            <FileText className="h-4 w-4" /> Documentación Adjunta para Verificación
                                                                        </h4>
                                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                                            <DocCard label="Cédula Frontal" url={app.idFrontUrl} icon="🪪" />
                                                                            <DocCard label="Cédula Reverso" url={app.idBackUrl} icon="🪪" />
                                                                            <DocCard label="Selfie Control" url={app.selfieUrl} icon="🤳" />
                                                                            <DocCard label="Licencia Frontal" url={app.licenseUrl} icon="🏎️" />
                                                                            <DocCard label="Licencia Reverso" url={app.licenseBackUrl} icon="🏎️" />
                                                                            <DocCard label="Permiso Circulación" url={app.circulationUrl} icon="📑" />
                                                                            <DocCard label="Hoja de Vida Driver" url={app.driverRecordUrl} icon="📜" />
                                                                            <DocCard label="Seguro SOAP" url={app.soapUrl} icon="🛡️" />
                                                                            <DocCard label="Revisión Técnica" url={app.techReviewUrl} icon="🛠️" />
                                                                            <DocCard label="Cert. Antecedentes" url={app.backgroundUrl} icon="⚖️" />
                                                                        </div>
                                                                    </div>

                                                                    {/* Contrato Info */}
                                                                    {app.contractSignatureHash && (
                                                                        <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-800 text-white">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <div className="text-xs font-bold uppercase text-[var(--secondary)]">Contrato de Prestación de Servicios</div>
                                                                                <div className="text-[10px] bg-green-500 font-bold px-2 py-0.5 rounded text-black">FIRMADO ✓</div>
                                                                            </div>
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                                                                                <div>
                                                                                    <div className="text-gray-500 text-[10px] uppercase font-bold">Hash Firma Electrónica (SHA-256)</div>
                                                                                    <div className="font-mono text-[11px] text-gray-300 break-all">{app.contractSignatureHash}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-gray-500 text-[10px] uppercase font-bold">Código Validación Civil</div>
                                                                                    <div className="font-mono text-lg text-[var(--secondary)]">{app.contractValidationCode}</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Rejection Reason (if any) */}
                                                                    {app.rejectionReason && (
                                                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                                            <div className="text-xs font-bold text-red-700 uppercase mb-1">Motivo:</div>
                                                                            <div className="text-sm text-red-600">{app.rejectionReason}</div>
                                                                        </div>
                                                                    )}

                                                                    {/* Review Info */}
                                                                    {app.reviewedAt && (
                                                                        <div className="mt-3 text-xs text-gray-400">
                                                                            Revisado por <strong>{app.reviewedBy}</strong> el {new Date(app.reviewedAt).toLocaleDateString('es-CL')}
                                                                        </div>
                                                                    )}

                                                                    {/* Actions */}
                                                                    {(app.status === 'SUBMITTED' || app.status === 'IN_REVIEW' || app.status === 'DOCS_INCOMPLETE') && (
                                                                        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleApprove(app.id)}
                                                                                disabled={actionLoading === app.id}
                                                                                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm shadow-green-200"
                                                                            >
                                                                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                                                                {actionLoading === app.id ? 'Procesando...' : 'Aprobar'}
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => setRejectModal({ id: app.id, type: 'docs', category: 'driver' })}
                                                                                className="border-orange-400 text-orange-600 hover:bg-orange-50 font-bold"
                                                                            >
                                                                                <FileText className="h-4 w-4 mr-1.5" />
                                                                                Pedir Documentos
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => setRejectModal({ id: app.id, type: 'reject', category: 'driver' })}
                                                                                className="border-red-400 text-red-600 hover:bg-red-50 font-bold"
                                                                            >
                                                                                <XCircle className="h-4 w-4 mr-1.5" />
                                                                                Rechazar
                                                                            </Button>

                                                                            <div className="flex-1" />

                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => setDeleteConfirm(app.id)}
                                                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                                                title="Eliminar registro"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                TAB: GESTIÓN DE RESTAURANTES
                ═══════════════════════════════════════════ */}
                    {activeTab === 'restaurants' && (
                        <div className="container max-w-7xl mx-auto space-y-6 px-4">
                            {/* Inner Tab Toggle */}
                            <div className="flex items-center gap-1 p-1 bg-gray-200/50 rounded-2xl w-fit border border-gray-100 mb-2">
                                <button
                                    onClick={() => setResTab('applications')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${resTab === 'applications' ? 'bg-white text-red-600 shadow-md shadow-gray-200/50 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Solicitudes Pendientes
                                </button>
                                <button
                                    onClick={() => setResTab('active')}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${resTab === 'active' ? 'bg-white text-red-600 shadow-md shadow-gray-200/50 border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Todos los Restaurantes
                                </button>
                            </div>

                            {resTab === 'applications' ? (
                                <Card className="shadow-lg rounded-xl overflow-hidden">
                                    <CardHeader className="bg-white border-b pb-4">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-xl font-extrabold uppercase text-gray-800 flex items-center gap-2">
                                                    <Store className="h-5 w-5 text-red-600" />
                                                    Solicitudes de Restaurantes
                                                </CardTitle>
                                                <CardDescription className="text-gray-500 mt-1">Revisa documentos y establece las comisiones por servicio.</CardDescription>
                                            </div>
                                            <Input
                                                placeholder="Buscar local..."
                                                className="h-9 w-64 shadow-sm border-gray-300"
                                                value={resSearch}
                                                onChange={(e) => setResSearch(e.target.value)}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-gray-100">
                                            {(restaurantApplications || []).map((app: any) => (
                                                <div key={app.id} className="p-4 hover:bg-gray-50/50">
                                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedRes(expandedRes === app.id ? null : app.id)}>
                                                        <div className="h-10 w-10 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold">
                                                            {app.fantasyName?.[0] || 'R'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold">{app.fantasyName}</div>
                                                            <div className="text-xs text-gray-500">{app.businessName} · {app.rut}</div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Badge className={app.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100 font-bold'}>{app.status}</Badge>
                                                            <div className="text-[10px] text-gray-400 font-mono italic">COMISIÓN ACTUAL: {app.restaurant?.commissionRate || 15}%</div>
                                                        </div>
                                                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedRes === app.id ? 'rotate-180' : ''}`} />
                                                    </div>

                                                    {expandedRes === app.id && (
                                                        <div className="mt-4 border-t pt-4 animate-in slide-in-from-top-2">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div>
                                                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Documentos Legales</h4>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <DocCard label="Registro Comercio" url={app.commerceRegisterUrl} icon="📄" />
                                                                        <DocCard label="Cédula Repr." url={app.identityDocUrl} icon="🪪" />
                                                                        <DocCard label="Carpeta Trib." url={app.tributaryFolderUrl} icon="📁" />
                                                                        <DocCard label="Fachada Local" url={app.storefrontPhotoUrl} icon="🏪" />
                                                                        <DocCard label="Carta/Menú" url={app.menuPhotoUrl} icon="🍽️" />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                                                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Información de Local</h4>
                                                                        <div className="space-y-2">
                                                                            <DetailRow label="Dirección" value={app.address} />
                                                                            <DetailRow label="Comuna" value={app.comuna} />
                                                                            <DetailRow label="Email" value={app.email} />
                                                                            <DetailRow label="Teléfono" value={app.phone} />
                                                                            <DetailRow label="Categoría" value={app.category} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                                                        <h4 className="text-sm font-black uppercase text-gray-800 mb-4 flex items-center gap-2">
                                                                            <DollarSign className="h-4 w-4 text-green-600" /> Control de Comisión
                                                                        </h4>
                                                                        <p className="text-xs text-gray-500 mb-6">Define el porcentaje que PideloYA cobrará por cada pedido realizado en este local.</p>

                                                                        <div className="flex items-center gap-4">
                                                                            <div className="flex-1">
                                                                                <label className="text-[10px] font-bold text-gray-400 uppercase">Comisión %</label>
                                                                                <Input
                                                                                    type="number"
                                                                                    className="font-bold text-lg"
                                                                                    placeholder="15"
                                                                                    value={commissionDraft[app.id] ?? app.restaurant?.commissionRate ?? 15}
                                                                                    onChange={(e) => setCommissionDraft(prev => ({ ...prev, [app.id]: Number(e.target.value) }))}
                                                                                />
                                                                            </div>
                                                                            <Button
                                                                                className="mt-4 bg-green-600 hover:bg-green-700 h-10 px-6 font-bold text-white shadow-sm shadow-green-200"
                                                                                disabled={actionLoading === app.id || !app.restaurantId}
                                                                                onClick={() => handleUpdateCommission(app.id, app.restaurantId)}
                                                                            >
                                                                                {actionLoading === app.id ? '...' : 'Actualizar'}
                                                                            </Button>
                                                                        </div>
                                                                        {!app.restaurantId && (
                                                                            <div className="mt-4 p-2 bg-amber-50 text-amber-700 text-[10px] font-bold rounded flex items-center gap-2">
                                                                                <AlertTriangle className="h-3 w-3" /> Debe aprobar primero para vincular restaurante
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Restaurant Application Actions */}
                                                                {(app.status === 'SUBMITTED' || app.status === 'IN_REVIEW' || app.status === 'DOCS_INCOMPLETE') && (
                                                                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={async () => {
                                                                                setActionLoading(app.id)
                                                                                await approveRestaurantApplication(app.id)
                                                                                setActionLoading(null)
                                                                                router.refresh()
                                                                            }}
                                                                            disabled={actionLoading === app.id}
                                                                            className="bg-red-600 hover:bg-red-700 text-white font-black shadow-md shadow-red-200 uppercase tracking-widest text-xs py-5 px-6"
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            {actionLoading === app.id ? 'Procesando...' : 'Aprobar Restaurante'}
                                                                        </Button>

                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => setRejectModal({ id: app.id, type: 'docs', category: 'res' })}
                                                                            className="border-orange-400 text-orange-600 hover:bg-orange-50 font-bold h-10"
                                                                        >
                                                                            <FileText className="h-4 w-4 mr-1.5" />
                                                                            Pedir Documentos
                                                                        </Button>

                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => setRejectModal({ id: app.id, type: 'reject', category: 'res' })}
                                                                            className="border-red-400 text-red-600 hover:bg-red-50 font-bold h-10"
                                                                        >
                                                                            <XCircle className="h-4 w-4 mr-1.5" />
                                                                            Rechazar
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Rejection Reason (if any) */}
                                                            {app.rejectionReason && (
                                                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                                    <div className="text-xs font-bold text-red-700 uppercase mb-1">Motivo / Requerimiento:</div>
                                                                    <div className="text-sm text-red-600">{app.rejectionReason}</div>
                                                                    <div className="text-[10px] text-gray-400 mt-2 font-medium italic">
                                                                        * Se ha notificado al restaurante vía email sobre este estado.
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="shadow-xl rounded-2xl overflow-hidden border-0 bg-white">
                                    <CardHeader className="bg-white border-b border-gray-100 pb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl font-black uppercase text-gray-900 tracking-tight italic">Directorio de Aliados en Red</CardTitle>
                                                <CardDescription className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Monitoreo de Locales Activos y Comisiones</CardDescription>
                                            </div>
                                            <Badge className="bg-green-100 text-green-700 border-green-200 font-black px-4 py-1.5 rounded-full">{(allRestaurants || []).length} Locales</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-gray-400 border-b border-gray-100 uppercase font-black text-[9px] tracking-[0.2em]">
                                                    <tr>
                                                        <th className="px-8 py-5">Identificación Aliado</th>
                                                        <th className="px-6 py-5">Logística / Categoría</th>
                                                        <th className="px-6 py-5">Tasa Monetización</th>
                                                        <th className="px-6 py-5">Estado Operacional</th>
                                                        <th className="px-8 py-5 text-right">Controles</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 bg-white">
                                                    {(!allRestaurants || allRestaurants.length === 0) ? (
                                                        <tr>
                                                            <td colSpan={5} className="py-20 text-center">
                                                                <p className="text-gray-300 font-black uppercase text-xs tracking-widest underline decoration-red-600/30 underline-offset-8">Fin de la Red de Aliados</p>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        (allRestaurants || []).map((res: any) => (
                                                            <tr key={res.id} className="hover:bg-red-50/20 transition-all group border-b border-gray-50">
                                                                <td className="px-8 py-5">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-10 w-10 bg-gray-900 text-white rounded-lg flex items-center justify-center font-black text-sm shadow-sm group-hover:bg-red-600 transition-colors">
                                                                            {res.name?.[0] || 'R'}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-black text-gray-900 group-hover:text-red-700 transition-colors">{res.name}</div>
                                                                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">UID: {res.id.substring(0, 8)}...</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <Badge variant="outline" className="text-[9px] font-black uppercase text-gray-500 border-gray-200 bg-gray-50 px-2 py-0.5">
                                                                        {res.category || 'GENÉRICOS'}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="font-black text-gray-900 text-xl tracking-tighter">{res.commissionRate || 15}%</div>
                                                                        <div className="h-6 w-px bg-gray-100"></div>
                                                                        <span className="text-[9px] text-gray-400 font-bold leading-none">RECAUDACIÓN<br />ESTÁNDAR</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                                                        <span className="text-[10px] font-black uppercase text-green-700 tracking-tight">Activo & Visible</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-5 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-300 hover:text-red-600 transition-colors">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-300 hover:text-gray-900 transition-colors">
                                                                            <Settings className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                REJECTION/DOCS MODAL
                ═══════════════════════════════════════════ */}
                    {rejectModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className={`p-6 ${rejectModal.type === 'reject' ? 'bg-red-50 border-b border-red-100' : 'bg-orange-50 border-b border-orange-100'}`}>
                                    <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                                        {rejectModal.type === 'reject' ? (
                                            <><XCircle className="h-5 w-5 text-red-500" /> Rechazar Solicitud</>
                                        ) : (
                                            <><FileText className="h-5 w-5 text-orange-500" /> Solicitar Documentos</>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {rejectModal.type === 'reject'
                                            ? 'Indica el motivo del rechazo. El postulante recibirá esta información.'
                                            : 'Indica qué documentos faltan o necesitan corrección.'}
                                    </p>
                                </div>
                                <div className="p-6">
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none resize-none"
                                        placeholder={rejectModal.type === 'reject'
                                            ? 'Ej: No cumple con requisitos de edad mínima...'
                                            : 'Ej: Falta foto del reverso de la licencia de conducir...'}
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-3 mt-4">
                                        <Button variant="outline" onClick={() => { setRejectModal(null); setRejectReason('') }}>
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleReject}
                                            disabled={!rejectReason.trim() || actionLoading !== null}
                                            className={rejectModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}
                                        >
                                            {actionLoading ? 'Procesando...' : rejectModal.type === 'reject' ? 'Confirmar Rechazo' : 'Enviar Solicitud'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deletion Confirmation Modal */}
                    {deleteConfirm && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in duration-200">
                                <div className="h-20 w-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100">
                                    <AlertTriangle className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase italic">¿Eliminar Registro?</h3>
                                <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                                    Esta acción es <strong className="text-red-600">irreversible</strong>. Se borrarán todos los datos del postulante y sus documentos permanentemente.
                                </p>
                                <div className="flex flex-col gap-3 mt-8">
                                    <Button
                                        onClick={() => deleteConfirm && handleDeleteArr(deleteConfirm)}
                                        disabled={actionLoading === deleteConfirm}
                                        className="bg-red-600 hover:bg-red-700 text-white font-black py-6 rounded-xl uppercase tracking-widest text-xs"
                                    >
                                        {actionLoading === deleteConfirm ? 'Eliminando...' : 'Sí, Eliminar Definitivamente'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setDeleteConfirm(null)}
                                        className="text-gray-400 font-bold"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function SidebarItem({ icon, label, active, badge, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${active
                ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <div className="flex items-center gap-3">
                <div className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-red-600'} transition-colors`}>
                    {icon}
                </div>
                <span className="text-sm font-black uppercase tracking-tight">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {badge > 0 && (
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${active ? 'bg-white text-red-600' : 'bg-red-500 text-white'
                        }`}>
                        {badge}
                    </span>
                )}
                {active && <ChevronRight className="h-4 w-4 opacity-50" />}
            </div>
        </button>
    )
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="flex justify-between items-baseline py-1 border-b border-gray-50 last:border-0">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</span>
            <span className="font-bold text-gray-800 text-sm text-right">{value || '—'}</span>
        </div>
    )
}

function DocCard({ label, url, icon }: { label: string; url: string | null | undefined; icon: string }) {
    if (!url) return (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 opacity-40">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
            <div className="text-[9px] text-gray-400 italic mt-1 font-medium underline decoration-dotted">Documento no cargado</div>
        </div>
    )

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-red-600 hover:shadow-md hover:shadow-red-50 transition-all group block relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">{icon}</div>
            <div className="text-[10px] font-black text-gray-800 uppercase tracking-tight line-clamp-1">{label}</div>
            <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold mt-3">
                EXPLORAR ARCHIVO
            </div>
        </a>
    )
}

function MetricCard({ title, value, icon, trend, color }: any) {
    const isPositive = trend?.startsWith('+')
    const isNegative = trend?.startsWith('-')

    return (
        <Card className={`shadow-sm rounded-2xl border-0 overflow-hidden group hover:shadow-md transition-all duration-300 ${color}`}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{title}</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{value}</h3>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all text-gray-600 group-hover:text-red-600">
                        {icon}
                    </div>
                </div>
                <div className="mt-6 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${isPositive ? 'bg-green-100 text-green-700' :
                        isNegative ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {trend}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">vs periodo anterior</span>
                </div>
            </CardContent>
        </Card>
    )
}

function UserIcon({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}
