/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { MapPin, Package, Clock, Utensils, CheckCircle, ArrowRight, Eye } from "lucide-react"
import Link from "next/link"

export default async function CustomerOrdersPage() {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") {
        redirect("/login")
    }

    const orders = await prisma.order.findMany({
        where: { customerId: session.id },
        include: {
            restaurant: true,
            driver: true,
            items: { include: { product: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "PENDING": return { label: "Esperando al Local", color: "bg-red-100 text-red-700", icon: Clock, progress: 10 }
            case "COOKING": return { label: "Preparando", color: "bg-yellow-100 text-yellow-800", icon: Utensils, progress: 50 }
            case "READY": return { label: "Buscando Repartidor", color: "bg-blue-100 text-blue-700", icon: Package, progress: 70 }
            case "PICKED_UP": return { label: "En Camino", color: "bg-orange-100 text-orange-700", icon: MapPin, progress: 90 }
            case "DELIVERED": return { label: "Entregado", color: "bg-green-100 text-green-700", icon: CheckCircle, progress: 100 }
            default: return { label: status, color: "bg-gray-100 text-gray-700", icon: Clock, progress: 0 }
        }
    }

    const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'DRAFT')
    const pastOrders = orders.filter(o => o.status === 'DELIVERED')
    const draftOrders = orders.filter(o => o.status === 'DRAFT')

    return (
        <div className="container py-8 max-w-4xl mx-auto min-h-screen">
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tight text-gray-900">Mis Pedidos</h1>
            <p className="text-gray-500 text-sm mb-8">{orders.length} pedido{orders.length !== 1 ? 's' : ''} en total</p>

            {orders.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700">Aún no tienes pedidos</h3>
                    <p className="text-gray-500 mt-2">¡Explora nuestra red de restaurantes y anímate a pedir!</p>
                    <Link href="/" className="inline-flex h-10 px-6 items-center mt-6 rounded-lg bg-[var(--primary)] text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-200">
                        Explorar Restaurantes
                    </Link>
                </div>
            ) : (
                <>
                    {/* Draft Orders */}
                    {draftOrders.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                Carritos Guardados ({draftOrders.length})
                            </h2>
                            <div className="space-y-4">
                                {draftOrders.map((order) => (
                                    <Card key={order.id} className="overflow-hidden border border-blue-100 shadow-sm hover:shadow-md transition-all">
                                        <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200">
                                                        <img src={order.restaurant.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"} alt={order.restaurant.name} className="h-full w-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-bold">{order.restaurant.name}</CardTitle>
                                                        <CardDescription>Borrador #{order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className="bg-blue-100 text-blue-700 font-bold text-sm px-3 py-1 flex items-center gap-2" variant="outline">
                                                        <Clock className="h-4 w-4" /> Pendiente
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex-1 space-y-2">
                                                <h4 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Detalle del carrito</h4>
                                                {order.items.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm font-medium text-gray-700">
                                                        <span><span className="text-[var(--primary)] font-black mr-2">{item.quantity}x</span> {item.product.name}</span>
                                                        <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="w-full md:w-56 bg-white flex flex-col justify-center gap-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-gray-600 text-sm">Total</span>
                                                    <span className="text-xl font-black text-gray-900">${order.total.toFixed(2)}</span>
                                                </div>
                                                <Link href={`/cart/restore/${order.id}`} className="w-full inline-flex justify-center items-center h-10 rounded-lg bg-[var(--primary)] text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-sm">
                                                    Retomar Carrito
                                                </Link>
                                                <DeleteDraftForm orderId={order.id} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Orders */}
                    {activeOrders.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                Pedidos Activos ({activeOrders.length})
                            </h2>
                            <div className="space-y-4">
                                {activeOrders.map((order) => {
                                    const statusInfo = getStatusInfo(order.status)
                                    const Icon = statusInfo.icon
                                    return (
                                        <Link key={order.id} href={`/orders/${order.id}`} className="block">
                                            <Card className="overflow-hidden border-2 border-[var(--secondary)] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer">
                                                <CardHeader className="bg-gray-50 pb-4 border-b">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200">
                                                                <img src={order.restaurant.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"} alt={order.restaurant.name} className="h-full w-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-lg font-bold">{order.restaurant.name}</CardTitle>
                                                                <CardDescription>Pedido #{String(order.orderNumber).padStart(6, '0')} • {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Badge className={`${statusInfo.color} font-bold text-sm px-3 py-1 flex items-center gap-2`} variant="outline">
                                                                <Icon className="h-4 w-4" /> {statusInfo.label}
                                                            </Badge>
                                                            <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                                                                <Eye className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                        <div className="bg-[var(--primary)] h-full transition-all duration-1000 ease-in-out" style={{ width: `${statusInfo.progress}%` }} />
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-6">
                                                    <div className="flex-1 space-y-2">
                                                        <h4 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Detalle</h4>
                                                        {order.items.map((item: any) => (
                                                            <div key={item.id} className="flex justify-between items-center text-sm font-medium text-gray-700">
                                                                <span><span className="text-[var(--primary)] font-black mr-2">{item.quantity}x</span> {item.product.name}</span>
                                                                <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="w-full md:w-48 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                                                        {order.driver && (
                                                            <div className="mb-3 pb-3 border-b border-gray-200 text-sm">
                                                                <span className="text-gray-500 font-bold text-xs uppercase block">Repartidor</span>
                                                                <span className="font-semibold text-gray-900 flex items-center gap-2 mt-1"><MapPin className="h-3.5 w-3.5 text-[var(--secondary)]" /> {order.driver.name}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-gray-600 text-sm">Total</span>
                                                            <span className="text-xl font-black text-gray-900">${order.total.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Past Orders */}
                    {pastOrders.length > 0 && (
                        <div>
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                                Pedidos Anteriores ({pastOrders.length})
                            </h2>
                            <div className="space-y-3">
                                {pastOrders.map((order) => (
                                    <Link key={order.id} href={`/orders/${order.id}`} className="block">
                                        <Card className="overflow-hidden border border-gray-100 shadow-sm opacity-80 hover:opacity-100 hover:shadow-md transition-all cursor-pointer">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                                                        <img src={order.restaurant.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"} alt="" className="h-full w-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className="font-bold text-gray-900 text-sm">{order.restaurant.name}</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">#{String(order.orderNumber).padStart(6, '0')}</p>
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(order.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge className="bg-green-100 text-green-700 font-bold text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Entregado</Badge>
                                                    <span className="font-black text-gray-900">${order.total.toFixed(2)}</span>
                                                    <ArrowRight className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function DeleteDraftForm({ orderId }: { orderId: string }) {
    return (
        <form action={async () => {
            "use server"
            const { deleteDraftOrder } = await import('@/app/actions/orders')
            await deleteDraftOrder(orderId)
        }}>
            <button className="w-full inline-flex justify-center items-center h-10 rounded-lg text-red-600 font-bold text-sm hover:bg-red-50 hover:text-red-700 transition-colors">
                Eliminar Borrador
            </button>
        </form>
    )
}
