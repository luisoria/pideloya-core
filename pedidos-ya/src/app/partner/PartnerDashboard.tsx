/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
    Package, Plus, Trash2, Edit, Store, DollarSign, Clock,
    CheckCircle, XCircle, LayoutDashboard, Utensils, Search,
    ChevronRight, ArrowUpRight, Settings, MapPin, Star,
    Bell, Timer, Truck, Tag, FileText, Printer, Mail, Download, Loader2
} from "lucide-react"
import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { addProduct, updateProduct, deleteProduct, updateOrderStatus, updateRestaurantSettings } from "./actions"
import jsPDF from "jspdf"
import { toPng } from "html-to-image"

// Deterministic formatters – avoids SSR/client hydration mismatch
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

export function PartnerDashboard({
    restaurant, totalSales, pendingOrders,
    inPreparationOrders, deliveredOrders,
    todaySales, todayCount, avgRating, reviewCount
}: any) {
    const router = useRouter()
    const [view, setView] = useState<'dashboard' | 'products' | 'orders' | 'settings' | 'settlements'>('dashboard')
    const [loading, setLoading] = useState<string | null>(null)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)
    const [prodForm, setProdForm] = useState({ name: "", description: "", price: 0, image: "" })

    const [settings, setSettings] = useState({
        openTime: restaurant.openTime || "09:00",
        closeTime: restaurant.closeTime || "23:00",
        preparation: restaurant.preparation ?? 25,
        deliveryRadiusKm: restaurant.deliveryRadiusKm ?? 5.0,
        minOrder: restaurant.minOrder ?? 5000,
        acceptingOrders: restaurant.acceptingOrders ?? true,
        deliveryZones: restaurant.deliveryZones || "Santiago Centro, Providencia, Ñuñoa, Las Condes",
        contactPhone: restaurant.phone || "",
        address: restaurant.address || "",
    })

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading("save")
        if (editingProduct) { await updateProduct(editingProduct.id, prodForm) }
        else { await addProduct(prodForm) }
        setIsProductModalOpen(false); setEditingProduct(null)
        setProdForm({ name: "", description: "", price: 0, image: "" })
        setLoading(null); router.refresh()
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este producto?")) return
        setLoading(id); await deleteProduct(id); setLoading(null); router.refresh()
    }

    const handleStatusUpdate = async (orderId: string, status: string) => {
        setLoading(orderId); await updateOrderStatus(orderId, status); setLoading(null); router.refresh()
    }

    const handleSaveSettings = async () => {
        setLoading("settings")
        const res = await updateRestaurantSettings({
            openTime: settings.openTime,
            closeTime: settings.closeTime,
            acceptingOrders: settings.acceptingOrders,
            preparation: settings.preparation,
            deliveryRadiusKm: settings.deliveryRadiusKm,
            minOrder: settings.minOrder,
            deliveryZones: settings.deliveryZones,
            address: settings.address,
            phone: settings.contactPhone
        })
        setLoading(null)
        if (res.success) {
            alert("✅ Configuración guardada correctamente")
            router.refresh()
        } else {
            alert("❌ Error al guardar: " + res.error)
        }
    }

    const tabs = [
        { key: 'dashboard', label: 'Resumen', icon: <LayoutDashboard className="h-4 w-4" /> },
        { key: 'products', label: 'Productos', icon: <Utensils className="h-4 w-4" /> },
        { key: 'orders', label: 'Pedidos', icon: <Package className="h-4 w-4" />, badge: pendingOrders },
        { key: 'promotions', label: 'Mis Promociones', icon: <Tag className="h-4 w-4" /> },
        { key: 'settlements', label: 'Liquidaciones', icon: <FileText className="h-4 w-4" /> },
        { key: 'settings', label: 'Configuración', icon: <Settings className="h-4 w-4" /> },
    ]

    // Calculate weekly settlements from delivered orders
    const { weeks, latestWeek } = useMemo(() => {
        const delivered = restaurant.orders?.filter((o: any) => o.status === "DELIVERED") || [];
        const map: Record<string, any> = {};

        delivered.forEach((order: any) => {
            const d = new Date(order.createdAt);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.getTime());
            monday.setDate(diff);
            monday.setHours(0, 0, 0, 0);

            const weekKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
            const weekLabel = `Semana del ${fmtDate(monday).split(' ')[0]}`;

            if (!map[weekKey]) {
                map[weekKey] = { id: weekKey, label: weekLabel, start: monday, orders: [], grossSales: 0, commission: 0, couponDiscounts: 0, netPayout: 0 };
            }

            const gross = order.total;
            const comm = gross * ((restaurant.commissionRate || 15) / 100);
            const couponDiscount = order.couponUsage ? (order.couponUsage.discountAmount || 0) : 0;

            map[weekKey].orders.push(order);
            map[weekKey].grossSales += gross;
            map[weekKey].commission += comm;
            map[weekKey].couponDiscounts += couponDiscount;
            map[weekKey].netPayout += (gross - comm - couponDiscount);
        });

        const arr = Object.values(map).sort((a: any, b: any) => b.id.localeCompare(a.id));
        return { weeks: arr, latestWeek: arr.length > 0 ? arr[0] : null };
    }, [restaurant.orders, restaurant.commissionRate]);

    const [selectedWeekId, setSelectedWeekId] = useState<string | null>(latestWeek ? latestWeek.id : null);
    const selectedWeek = weeks.find((w: any) => w.id === selectedWeekId);

    // PDF & Email Handling
    const reportRef = useRef<HTMLDivElement>(null);
    const [sendingEmail, setSendingEmail] = useState(false);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setLoading("pdf");
        try {
            const element = reportRef.current;
            // Use html-to-image which handles modern CSS (lab, oklch) much better than html2canvas
            const dataUrl = await toPng(element, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                pixelRatio: 2
            });

            const pdf = new jsPDF("p", "mm", "a4");
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Liquidacion_${restaurant.name.replace(/ /g, '_')}_${selectedWeek.id}.pdf`);
        } catch (e) {
            console.error("PDF Export Error:", e);
            alert("Error al generar PDF. Intenta usando la opción de Imprimir.");
        } finally {
            setLoading(null);
        }
    };

    const handleSendEmail = async () => {
        setSendingEmail(true);
        try {
            const res = await fetch("/api/settlements/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipeintName: restaurant.name,
                    recipientEmail: restaurant.email || "partner@test.com",
                    settlement: selectedWeek,
                    restaurantName: restaurant.name
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ Reporte enviado exitosamente a ${restaurant.email || "tu correo registrado"}`);
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            alert("Error al enviar email. Verifica la configuración.");
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center font-black text-white text-sm italic">PY</div>
                        <h1 className="text-xl font-black text-gray-900 uppercase">Partner Hub</h1>
                    </div>
                    <p className="text-sm text-gray-500">{restaurant.name} · Comisión {restaurant.commissionRate}%</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={`${restaurant.acceptingOrders ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-none font-bold text-sm py-1.5 px-4`}>
                        {restaurant.acceptingOrders ? '● ABIERTO' : '● CERRADO'}
                    </Badge>
                </div>
            </div>

            {/* Tab Nav */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            if (tab.key === 'promotions') router.push('/partner/coupons')
                            else setView(tab.key as any)
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-all ${view === tab.key
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {!!tab.badge && tab.badge > 0 && (
                            <span className="bg-red-500 text-white text-sm font-black h-5 w-5 rounded-full flex items-center justify-center">{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ DASHBOARD ═══ */}
            {view === 'dashboard' && (
                <div className="space-y-6">
                    {pendingOrders > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-amber-600 shrink-0" />
                                <div>
                                    <p className="font-bold text-amber-800 text-sm">{pendingOrders} pedido{pendingOrders !== 1 ? 's' : ''} pendiente{pendingOrders !== 1 ? 's' : ''}</p>
                                    <p className="text-sm text-amber-600">Requieren confirmación</p>
                                </div>
                            </div>
                            <Button onClick={() => setView('orders')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm px-4 h-9">
                                Ver <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MiniStat icon={<DollarSign className="h-5 w-5 text-green-500" />} label="Ventas Totales" value={`$${fmt(totalSales)}`} sub={`$${fmt(todaySales)} hoy`} />
                        <MiniStat icon={<Package className="h-5 w-5 text-blue-500" />} label="Pedidos Hoy" value={String(todayCount)} sub={`${deliveredOrders} entregados`} />
                        <MiniStat icon={<Star className="h-5 w-5 text-yellow-500" />} label="Calificación" value={avgRating > 0 ? avgRating.toFixed(1) : '—'} sub={`${reviewCount} reseñas`} />
                        <MiniStat icon={<Utensils className="h-5 w-5 text-purple-500" />} label="Productos" value={String(restaurant.products.length)} sub="En catálogo" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Recent Orders — 3 cols */}
                        <Card className="lg:col-span-3 rounded-xl border shadow-sm">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold">Últimos Pedidos</CardTitle>
                                    <div className="flex gap-1">
                                        {pendingOrders > 0 && <Badge className="bg-amber-100 text-amber-700 border-none text-sm">{pendingOrders} nuevos</Badge>}
                                        {inPreparationOrders > 0 && <Badge className="bg-blue-100 text-blue-700 border-none text-sm">{inPreparationOrders} prep.</Badge>}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {restaurant.orders.slice(0, 5).map((order: any) => (
                                        <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-7 w-7 rounded-md flex items-center justify-center text-white text-sm font-bold shrink-0 ${order.status === 'PENDING' ? 'bg-amber-500' :
                                                    order.status === 'READY' ? 'bg-green-500' :
                                                        order.status === 'DELIVERED' ? 'bg-gray-400' : 'bg-blue-500'
                                                    }`}>
                                                    {order.status === 'PENDING' ? '!' : order.status === 'READY' ? '✓' : '✓'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">#{order.id.split('-')[0]}</div>
                                                    <div className="text-sm text-gray-400">{order.customer?.name} · {fmtTime(order.createdAt)}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900">${fmt(order.total)}</div>
                                                <span className={`text-sm font-bold uppercase ${order.status === 'PENDING' ? 'text-amber-600' :
                                                    order.status === 'READY' ? 'text-green-600' : 'text-gray-400'
                                                    }`}>{order.status === 'PENDING' ? '⚡ NUEVO' : order.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-gray-50 text-center border-t">
                                    <button onClick={() => setView('orders')} className="text-sm font-bold text-red-600 uppercase tracking-wide flex items-center justify-center gap-1 mx-auto">
                                        Ver todos <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Info — 2 cols */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card className="rounded-xl border-none bg-gray-900 text-white shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Horario</p>
                                        <button onClick={() => setView('settings')} className="text-sm font-bold text-red-400 hover:text-red-300">Editar</button>
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Timer className="h-5 w-5 text-green-400 shrink-0" />
                                        <div>
                                            <p className="text-lg font-black">{settings.openTime} — {settings.closeTime}</p>
                                            <p className="text-[13px] text-gray-400">~{settings.preparation} min preparación</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-3 border-t border-gray-700">
                                        <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                                        <p className="text-sm text-gray-300">{settings.deliveryRadiusKm} km · {settings.deliveryZones.split(',').length} comunas</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Últimas Reseñas</p>
                                    {restaurant.reviews && restaurant.reviews.length > 0 ? (
                                        <div className="space-y-2">
                                            {restaurant.reviews.slice(0, 3).map((review: any) => (
                                                <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-sm font-bold text-gray-900">{review.customer?.name}</span>
                                                        <span className="text-yellow-500 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                                    </div>
                                                    {review.comment && <p className="text-[13px] text-gray-500 line-clamp-1">{review.comment}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">Sin reseñas aún</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PRODUCTS ═══ */}
            {view === 'products' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Buscar producto..." className="pl-10 h-10 rounded-lg bg-gray-50 border" />
                        </div>
                        <Button
                            onClick={() => { setEditingProduct(null); setProdForm({ name: "", description: "", price: 0, image: "" }); setIsProductModalOpen(true) }}
                            className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold px-6 rounded-lg text-sm uppercase"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Agregar
                        </Button>
                    </div>

                    {restaurant.products.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-bold text-gray-700">Tu carta está vacía</p>
                            <p className="text-gray-400 text-sm mt-1">Agrega productos para que los clientes puedan pedirlos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {restaurant.products.map((product: any) => (
                                <Card key={product.id} className="group rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="h-40 relative overflow-hidden bg-gray-100">
                                        <img
                                            src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e: any) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" }}
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-sm font-bold text-gray-900 shadow">
                                            ${fmt(product.price)}
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-bold text-gray-900 truncate mb-1">{product.name}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-3 min-h-[32px]">{product.description}</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm"
                                                onClick={() => { setEditingProduct(product); setProdForm({ name: product.name, description: product.description, price: product.price, image: product.image || "" }); setIsProductModalOpen(true) }}
                                                className="flex-1 rounded-lg text-sm font-bold h-8"
                                            >
                                                <Edit className="h-3 w-3 mr-1" /> Editar
                                            </Button>
                                            <Button variant="ghost" size="sm"
                                                onClick={() => handleDelete(product.id)}
                                                disabled={loading === product.id}
                                                className="rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                                aria-label="Eliminar"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ ORDERS ═══ */}
            {view === 'orders' && (
                <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-amber-100 text-amber-700 py-1.5 px-4 rounded-lg font-bold text-sm border-none">⚡ {pendingOrders} Nuevos</Badge>
                        <Badge className="bg-blue-100 text-blue-700 py-1.5 px-4 rounded-lg font-bold text-sm border-none">🍳 {inPreparationOrders} En Prep.</Badge>
                        <Badge className="bg-green-100 text-green-700 py-1.5 px-4 rounded-lg font-bold text-sm border-none">✅ {deliveredOrders} Entregados</Badge>
                    </div>

                    <div className="space-y-4">
                        {restaurant.orders.map((order: any) => (
                            <Card key={order.id} className="rounded-xl border shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col lg:flex-row">
                                        {/* Left */}
                                        <div className="p-5 lg:w-72 lg:border-r border-b lg:border-b-0 flex flex-col justify-between shrink-0">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className={`h-7 w-7 rounded-md text-white flex items-center justify-center font-bold text-sm ${order.status === 'PENDING' ? 'bg-amber-500' : order.status === 'READY' ? 'bg-green-600' : 'bg-gray-500'
                                                        }`}>
                                                        {order.status === 'PENDING' ? '!' : '✓'}
                                                    </div>
                                                    <span className="font-bold text-gray-900">Orden #{order.id.split('-')[0]}</span>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <Clock className="h-3 w-3 shrink-0" />
                                                        <span>{fmtDate(order.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                                                        <DollarSign className="h-3 w-3 shrink-0 text-green-500" />
                                                        <span>${fmt(order.total)}</span>
                                                    </div>
                                                    {order.driver && (
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <Truck className="h-3 w-3 shrink-0" />
                                                            <span>{order.driver.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`mt-4 py-2 px-3 rounded-lg text-center font-bold uppercase text-sm tracking-wide border ${order.status === 'PENDING' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                                order.status === 'READY' ? 'border-green-200 bg-green-50 text-green-700' :
                                                    order.status === 'PICKED_UP' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                        order.status === 'DELIVERED' ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-200 text-gray-500'
                                                }`}>
                                                {order.status === 'PENDING' ? '⚡ PENDIENTE' :
                                                    order.status === 'READY' ? '✅ LISTO' :
                                                        order.status === 'PICKED_UP' ? '🚛 EN CAMINO' :
                                                            order.status === 'DELIVERED' ? '📦 ENTREGADO' : order.status}
                                            </div>
                                        </div>

                                        {/* Right */}
                                        <div className="flex-1 p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-sm">👤</div>
                                                    <div>
                                                        <span className="text-sm font-bold text-gray-900">{order.customer?.name}</span>
                                                        <span className="text-sm text-gray-400 ml-2">{order.items?.length || 0} items</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {order.status === 'PENDING' && (
                                                        <>
                                                            <Button onClick={() => handleStatusUpdate(order.id, 'READY')} disabled={loading === order.id}
                                                                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm h-8 px-4">
                                                                <CheckCircle className="h-3 w-3 mr-1" /> Confirmar
                                                            </Button>
                                                            <Button variant="outline" onClick={() => handleStatusUpdate(order.id, 'REJECTED')} disabled={loading === order.id}
                                                                className="border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-lg text-sm h-8 px-4">
                                                                <XCircle className="h-3 w-3 mr-1" /> Rechazar
                                                            </Button>
                                                        </>
                                                    )}
                                                    {order.status === 'READY' && (
                                                        <span className="flex items-center text-green-600 font-bold text-sm gap-1 bg-green-50 py-2 px-3 rounded-lg border border-green-100">
                                                            <CheckCircle className="h-3 w-3" /> Esperando repartidor
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3 border">
                                                <div className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Productos</div>
                                                <div className="space-y-1.5">
                                                    {order.items && order.items.length > 0 ? (
                                                        order.items.map((item: any) => (
                                                            <div key={item.id} className="flex justify-between items-center bg-white p-2.5 rounded-md border text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="h-5 w-5 bg-gray-900 text-white rounded text-[13px] font-bold flex items-center justify-center">{item.quantity}x</span>
                                                                    <span className="font-medium text-gray-800 text-sm">{item.product?.name || 'Producto'}</span>
                                                                </div>
                                                                <span className="font-bold text-gray-900 text-sm">${fmt(item.price * item.quantity)}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-gray-400 text-center py-2">Sin detalle</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ SETTINGS ═══ */}
            {view === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center"><Timer className="h-4 w-4 text-green-600" /></div>
                                <div>
                                    <CardTitle className="text-base font-bold">Horarios de Operación</CardTitle>
                                    <CardDescription className="text-sm">Cuándo tu local recibe pedidos</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-3 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Apertura</label>
                                    <Input type="time" className="h-10 rounded-lg" value={settings.openTime} onChange={e => setSettings({ ...settings, openTime: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Cierre</label>
                                    <Input type="time" className="h-10 rounded-lg" value={settings.closeTime} onChange={e => setSettings({ ...settings, closeTime: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Preparación (min)</label>
                                <Input type="number" className="h-10 rounded-lg" value={settings.preparation} onChange={e => setSettings({ ...settings, preparation: Number(e.target.value) })} />
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Aceptar pedidos</p>
                                    <p className="text-sm text-gray-400">Desactiva para pausar</p>
                                </div>
                                <button onClick={() => setSettings({ ...settings, acceptingOrders: !settings.acceptingOrders })}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${settings.acceptingOrders ? 'bg-green-500' : 'bg-gray-300'}`}
                                    aria-label="Toggle aceptar pedidos">
                                    <div className={`h-5 w-5 bg-white rounded-full absolute top-1 transition-all shadow ${settings.acceptingOrders ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin className="h-4 w-4 text-blue-600" /></div>
                                <div>
                                    <CardTitle className="text-base font-bold">Área de Entrega</CardTitle>
                                    <CardDescription className="text-sm">Zona de cobertura y pedido mínimo</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-3 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Dirección</label>
                                <Input className="h-10 rounded-lg" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Radio (km)</label>
                                    <Input type="number" className="h-10 rounded-lg" value={settings.deliveryRadiusKm} onChange={e => setSettings({ ...settings, deliveryRadiusKm: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Pedido mínimo ($)</label>
                                    <Input type="number" className="h-10 rounded-lg" value={settings.minOrder} onChange={e => setSettings({ ...settings, minOrder: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Comunas</label>
                                <textarea className="w-full bg-gray-50 border rounded-lg p-3 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-red-500/20"
                                    value={settings.deliveryZones} onChange={e => setSettings({ ...settings, deliveryZones: e.target.value })}
                                    placeholder="Santiago Centro, Providencia..." />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center"><Store className="h-4 w-4 text-purple-600" /></div>
                                <div>
                                    <CardTitle className="text-base font-bold">Datos del Local</CardTitle>
                                    <CardDescription className="text-sm">Info visible para clientes</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-3">
                            <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Teléfono</label>
                            <Input className="h-10 rounded-lg" value={settings.contactPhone}
                                onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} placeholder="+56 9 1234 5678" />
                        </CardContent>
                    </Card>

                    <Button onClick={handleSaveSettings}
                        disabled={loading === "settings"}
                        className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold px-8 rounded-lg text-sm uppercase w-full sm:w-auto">
                        {loading === "settings" ? "Guardando..." : "Guardar Configuración"}
                    </Button>
                </div>
            )}

            {/* ═══ SETTLEMENTS / LIQUIDACIONES ═══ */}
            {view === 'settlements' && (
                <div className="space-y-6">
                    {weeks.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-bold text-gray-700">Aún no hay liquidaciones</p>
                            <p className="text-gray-400 text-sm mt-1">Completa órdenes para que aparezcan aquí tus conciliaciones</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Selector de Semanas */}
                            <div className="lg:col-span-1 space-y-2">
                                <h3 className="font-bold text-gray-900 mb-3 px-2">Historial de Pagos</h3>
                                {weeks.map((w: any) => (
                                    <button
                                        key={w.id}
                                        onClick={() => setSelectedWeekId(w.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedWeekId === w.id ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-gray-100 hover:border-red-100 hover:bg-red-50/50'}`}
                                    >
                                        <p className={`font-bold text-sm ${selectedWeekId === w.id ? 'text-red-700' : 'text-gray-800'}`}>{w.label}</p>
                                        <p className="text-xs text-gray-500 mt-1">{w.orders.length} pedidos · ${fmt(w.netPayout)}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Reporte Principal (Imprimible) */}
                            {selectedWeek && (
                                <div className="lg:col-span-3">
                                    <div className="flex justify-between items-center mb-4 print:hidden">
                                        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Vista Previa del Reporte</h3>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={handleExportPDF} disabled={loading === "pdf"} className="font-bold h-9 bg-white">
                                                {loading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                                                Exportar PDF
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleSendEmail}
                                                disabled={sendingEmail}
                                                className="font-bold h-9 bg-gray-900 border-none text-white hover:bg-black"
                                            >
                                                {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                                                Enviar por Email
                                            </Button>
                                            <Button variant="ghost" onClick={() => window.print()} className="font-bold h-9">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div ref={reportRef}>
                                        <Card className="rounded-xl border shadow-sm print:shadow-none print:border-none p-2 sm:p-8 bg-white min-h-[800px]">
                                            {/* Cabecera del Reporte */}
                                            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-14 w-14 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-2xl italic tracking-tighter">
                                                        PY
                                                    </div>
                                                    <div>
                                                        <h1 className="text-2xl font-black text-gray-900 tracking-tighter italic">PIDELO YA</h1>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Liquidación a Partners</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <h2 className="text-xl font-black text-gray-900">{restaurant.name}</h2>
                                                    <p className="text-sm text-gray-500 mt-1">{restaurant.address}</p>
                                                    <p className="text-sm font-bold text-gray-500 mt-1">Periodo: {selectedWeek.label}</p>
                                                </div>
                                            </div>

                                            {/* Resumen Financiero */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Ventas Brutas</p>
                                                    <p className="text-xl font-black text-gray-900 mt-1">${fmt(selectedWeek.grossSales)}</p>
                                                </div>
                                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                    <p className="text-xs font-bold text-red-500 uppercase">Comisión ({(restaurant.commissionRate || 15)}%)</p>
                                                    <p className="text-xl font-black text-red-700 mt-1">-${fmt(selectedWeek.commission)}</p>
                                                </div>
                                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                                    <p className="text-xs font-bold text-orange-500 uppercase">Costos Cupones</p>
                                                    <p className="text-xl font-black text-orange-700 mt-1">-${fmt(selectedWeek.couponDiscounts)}</p>
                                                </div>
                                                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                                    <p className="text-xs font-bold text-green-700 uppercase">Total a Transferir</p>
                                                    <p className="text-xl font-black text-green-700 mt-1">${fmt(selectedWeek.netPayout)}</p>
                                                </div>
                                            </div>

                                            {/* Tabla de Detalle */}
                                            <div className="mb-4">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Detalle de Pedidos Entregados</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-xs text-gray-500 bg-gray-50 uppercase font-bold">
                                                            <tr>
                                                                <th className="px-4 py-3 rounded-l-lg">ID / Fecha</th>
                                                                <th className="px-4 py-3">Detalle</th>
                                                                <th className="px-4 py-3 text-center">Cupón</th>
                                                                <th className="px-4 py-3 text-right">Venta</th>
                                                                <th className="px-4 py-3 text-right">Comisión</th>
                                                                <th className="px-4 py-3 text-right rounded-r-lg">Neto</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedWeek.orders.map((o: any) => {
                                                                const comm = o.total * ((restaurant.commissionRate || 15) / 100);
                                                                const coup = o.couponUsage ? o.couponUsage.discountAmount : 0;
                                                                const net = o.total - comm - coup;

                                                                return (
                                                                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                                        <td className="px-4 py-3">
                                                                            <div className="font-bold text-gray-900">#{o.id.split('-')[0]}</div>
                                                                            <div className="text-xs text-gray-400">{fmtDate(o.createdAt)}</div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-xs text-gray-600">
                                                                            {o.items.map((it: any) => `${it.quantity}x ${it.product?.name || 'Prod'}`).join(', ')}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {coup > 0 ? <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">-${fmt(coup)}</span> : <span className="text-gray-300">-</span>}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-medium">${fmt(o.total)}</td>
                                                                        <td className="px-4 py-3 text-right text-red-500">-${fmt(comm)}</td>
                                                                        <td className="px-4 py-3 text-right font-bold text-green-600">${fmt(net)}</td>
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                        <tfoot className="font-black bg-gray-50">
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-3 text-right rounded-l-lg">TOTAL SEMANA</td>
                                                                <td className="px-4 py-3 text-right">${fmt(selectedWeek.grossSales)}</td>
                                                                <td className="px-4 py-3 text-right text-red-600">-${fmt(selectedWeek.commission)}</td>
                                                                <td className="px-4 py-3 text-right text-green-600 rounded-r-lg">${fmt(selectedWeek.netPayout)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Footer Legal */}
                                            <div className="mt-16 text-center text-xs text-gray-400 max-w-lg mx-auto">
                                                <p className="font-bold text-gray-500">Documento generado automáticamente el {fmtDate(new Date())}</p>
                                                <p className="mt-2">Esta liquidación es informativa y refleja las ventas entregadas y procesadas a través de la plataforma PIDELO YA. Las transferencias se ejecutan todos los martes a la cuenta bancaria registrada por el partner.</p>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-lg w-full rounded-xl border shadow-2xl bg-white">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-lg font-bold">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
                            <CardDescription className="text-sm">Completa los detalles de tu producto</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSaveProduct} className="p-5 pt-2 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Nombre</label>
                                <Input required className="h-10 rounded-lg" value={prodForm.name}
                                    onChange={e => setProdForm({ ...prodForm, name: e.target.value })} placeholder="Ej: Hamburguesa Clásica" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Precio ($)</label>
                                    <Input required type="number" className="h-10 rounded-lg" value={prodForm.price}
                                        onChange={e => setProdForm({ ...prodForm, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Imagen URL</label>
                                    <Input className="h-10 rounded-lg" value={prodForm.image}
                                        onChange={e => setProdForm({ ...prodForm, image: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-1 block">Descripción</label>
                                <textarea className="w-full bg-gray-50 border rounded-lg p-3 text-sm min-h-[80px] outline-none"
                                    value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })}
                                    placeholder="Describe tu producto..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={loading === "save"}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 rounded-lg font-bold text-sm uppercase">
                                    {loading === "save" ? "Guardando..." : editingProduct ? "Guardar" : "Publicar"}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setIsProductModalOpen(false)}
                                    className="px-6 h-10 rounded-lg font-bold text-gray-400 text-sm">
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}

function MiniStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
    return (
        <Card className="rounded-xl border shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2.5 bg-gray-50 rounded-lg">{icon}</div>
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-3xl font-black text-gray-900 tracking-tight">{value}</p>
                <p className="text-sm text-green-600 font-bold flex items-center gap-1 mt-1">{sub} <ArrowUpRight className="h-3 w-3" /></p>
            </CardContent>
        </Card>
    )
}
