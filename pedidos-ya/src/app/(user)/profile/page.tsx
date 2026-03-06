/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { User, Mail, Phone, Star, Heart, Package, ShoppingBag, Calendar, MapPin, ChevronRight, Clock, Award } from "lucide-react"
import Link from "next/link"

export default async function ProfilePage() {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: {
            orders: {
                include: { restaurant: true, items: { include: { product: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5
            },
            reviews: {
                include: { restaurant: true },
                orderBy: { createdAt: 'desc' },
                take: 5
            },
            favorites: {
                include: { restaurant: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!user) redirect("/login")

    const totalOrders = await prisma.order.count({ where: { customerId: session.id } })
    const deliveredOrders = await prisma.order.count({ where: { customerId: session.id, status: "DELIVERED" } })
    const totalSpent = await prisma.order.aggregate({
        where: { customerId: session.id, status: "DELIVERED" },
        _sum: { total: true }
    })
    const reviewCount = await prisma.review.count({ where: { customerId: session.id } })

    const memberSince = new Date(user.createdAt).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })
    const averageOrderValue = deliveredOrders > 0 ? (totalSpent._sum.total || 0) / deliveredOrders : 0

    // Level based on orders
    const getLevelInfo = (orders: number) => {
        if (orders >= 50) return { name: "Diamante 💎", color: "bg-purple-100 text-purple-700 border-purple-200", next: null, progress: 100 }
        if (orders >= 25) return { name: "Oro 🥇", color: "bg-yellow-100 text-yellow-700 border-yellow-200", next: 50, progress: (orders / 50) * 100 }
        if (orders >= 10) return { name: "Plata 🥈", color: "bg-gray-100 text-gray-700 border-gray-200", next: 25, progress: (orders / 25) * 100 }
        return { name: "Bronce 🥉", color: "bg-orange-100 text-orange-700 border-orange-200", next: 10, progress: (orders / 10) * 100 }
    }

    const levelInfo = getLevelInfo(deliveredOrders)

    return (
        <div className="container py-8 max-w-4xl mx-auto min-h-screen">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-3xl font-black shadow-xl shadow-red-900/30">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-black uppercase tracking-tight">{user.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-sm text-gray-400 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                            {user.phone && <span className="text-sm text-gray-400 flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                            <Badge className={`${levelInfo.color} font-black text-xs px-3 py-1 border`}>
                                <Award className="h-3 w-3 mr-1" /> Nivel {levelInfo.name}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Miembro desde {memberSince}</span>
                        </div>
                    </div>
                </div>

                {/* Level Progress */}
                {levelInfo.next && (
                    <div className="mt-6 relative">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{deliveredOrders} pedidos completados</span>
                            <span>Siguiente nivel: {levelInfo.next} pedidos</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-yellow-400 rounded-full transition-all" style={{ width: `${levelInfo.progress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<ShoppingBag className="h-5 w-5 text-red-500" />} value={totalOrders} label="Pedidos Totales" />
                <StatCard icon={<Package className="h-5 w-5 text-green-500" />} value={deliveredOrders} label="Entregados" />
                <StatCard icon={<Star className="h-5 w-5 text-yellow-500" />} value={reviewCount} label="Reseñas" />
                <StatCard icon={<Heart className="h-5 w-5 text-pink-500" />} value={user.favorites.length} label="Favoritos" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Favorites */}
                <Card className="rounded-2xl border-gray-200 overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Heart className="h-4 w-4 text-pink-500" /> Mis Favoritos
                            </h3>
                        </div>
                        {user.favorites.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm font-medium">Aún no tienes favoritos</p>
                                <p className="text-xs mt-1">Marca restaurantes con ❤️ para guardarlos aquí</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {user.favorites.map((fav: any) => (
                                    <Link key={fav.id} href={`/restaurant/${fav.restaurant.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
                                            <img src={fav.restaurant.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"} alt="" className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[var(--primary)] transition-colors">{fav.restaurant.name}</p>
                                            <p className="text-xs text-gray-400">{fav.restaurant.category}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[var(--primary)] transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Reviews */}
                <Card className="rounded-2xl border-gray-200 overflow-hidden">
                    <CardContent className="p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Star className="h-4 w-4 text-yellow-500" /> Mis Reseñas
                        </h3>
                        {user.reviews.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm font-medium">No has dejado reseñas</p>
                                <p className="text-xs mt-1">Comparte tu experiencia después de tus pedidos</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {user.reviews.map((review: any) => (
                                    <div key={review.id} className="p-3 rounded-xl bg-gray-50">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-bold text-gray-900">{review.restaurant.name}</p>
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && <p className="text-xs text-gray-500 line-clamp-2">{review.comment}</p>}
                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString('es-CL')}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card className="rounded-2xl border-gray-200 overflow-hidden mt-8">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" /> Pedidos Recientes
                        </h3>
                        <Link href="/orders" className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                            Ver todos <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {user.orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-medium">Sin pedidos aún</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {user.orders.map((order: any) => (
                                <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
                                            <img src={order.restaurant.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"} alt="" className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{order.restaurant.name}</p>
                                            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('es-CL')} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={`text-[10px] font-bold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {order.status === 'DELIVERED' ? 'Entregado' : 'En Curso'}
                                        </Badge>
                                        <span className="font-black text-gray-900 text-sm">${order.total.toFixed(2)}</span>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[var(--primary)]" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats summary */}
            <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Total Gastado en PídeloYA</p>
                <p className="text-4xl font-black text-gray-900">${(totalSpent._sum.total || 0).toLocaleString()}</p>
                {averageOrderValue > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Promedio por pedido: ${Math.round(averageOrderValue).toLocaleString()}</p>
                )}
            </div>
        </div>
    )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) {
    return (
        <Card className="rounded-2xl border-gray-200 overflow-hidden hover:shadow-md transition-all">
            <CardContent className="p-5 text-center">
                <div className="flex justify-center mb-2">{icon}</div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{label}</p>
            </CardContent>
        </Card>
    )
}
