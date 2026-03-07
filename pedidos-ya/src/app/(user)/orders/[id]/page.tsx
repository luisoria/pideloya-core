/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/Card"
import Link from "next/link"
import { Badge } from "@/components/ui/Badge"
import { MapPin, Package, Clock, Utensils, CheckCircle, Phone, MessageCircle, ArrowLeft, Bike } from "lucide-react"
import { ReviewForm } from "../ReviewForm"

export default async function OrderTrackingPage({ params }: { params: { id: string } }) {
    const session = await getSession()
    if (!session || session.role !== "CUSTOMER") redirect("/login")

    const { id } = await params

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            restaurant: true,
            driver: true,
            items: { include: { product: true } },
            productReviews: true
        }
    })

    // Also check for restaurant review
    const restaurantReview = await prisma.review.findUnique({
        where: { orderId: id }
    })

    if (!order || order.customerId !== session.id) notFound()

    const isDelivered = order.status === 'DELIVERED'
    const deliveredTime = new Date(order.deliveredAt || order.updatedAt).getTime()
    const hoursSinceDelivery = (new Date().getTime() - deliveredTime) / 3600000

    const steps = [
        { key: "PENDING", label: "Pedido Recibido", icon: Package, description: "Tu pedido fue recibido por el restaurante" },
        { key: "COOKING", label: "En Preparación", icon: Utensils, description: "El restaurante está preparando tu pedido" },
        { key: "READY", label: "Listo para Recoger", icon: CheckCircle, description: "Buscando repartidor cercano" },
        { key: "PICKED_UP", label: "En Camino", icon: Bike, description: "Tu repartidor va en camino a tu ubicación" },
        { key: "DELIVERED", label: "Entregado", icon: CheckCircle, description: "¡Buen provecho! Disfruta tu pedido" },
    ]

    const statusOrder = ["PENDING", "COOKING", "READY", "PICKED_UP", "DELIVERED"]
    const currentIdx = statusOrder.indexOf(order.status)

    // Build map center from restaurant coords
    const mapLat = order.restaurant.lat || -33.4489
    const mapLng = order.restaurant.lon || -70.6693

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="container flex items-center gap-4 h-16">
                    <Link href="/orders" className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-700" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight">Seguimiento del Pedido</h1>
                        <p className="text-xs text-gray-400 font-mono">#{String(order.orderNumber).padStart(6, '0')}</p>
                    </div>
                    <Badge className={`font-bold text-xs px-3 py-1 ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                        {order.status === 'DELIVERED' ? 'Entregado' : 'En Curso'}
                    </Badge>
                </div>
            </div>

            {/* Map Section */}
            {order.status !== 'DELIVERED' && (
                <div className="relative h-64 md:h-80 w-full bg-gray-200">
                    <iframe
                        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.0!2d${mapLng}!3d${mapLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1ses!2scl!4v1700000000000!5m2!1ses!2scl`}
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Order Tracking Map"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge className="bg-white/90 backdrop-blur text-gray-900 shadow-lg border-none font-bold text-xs py-1.5 px-3">
                            <span className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse inline-block" />
                            {order.restaurant.name}
                        </Badge>
                        {order.driver && (
                            <Badge className="bg-gray-900/90 text-white shadow-lg border-none font-bold text-xs py-1.5 px-3">
                                <Bike className="h-3 w-3 mr-1.5" />
                                {order.driver.name} - En movimiento
                            </Badge>
                        )}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-xl px-4 py-2 shadow-lg border border-gray-100">
                        <div className="text-xs font-bold text-gray-500 uppercase">Tiempo Estimado</div>
                        <div className="text-xl font-black text-gray-900">{order.status === 'PICKED_UP' ? '10-15' : '20-35'} min</div>
                    </div>
                </div>
            )}

            <div className="container py-8 max-w-2xl">
                {/* Progress Stepper */}
                <Card className="rounded-2xl border-gray-200 overflow-hidden mb-6">
                    <CardContent className="p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Estado del Pedido</h3>
                        <div className="space-y-1">
                            {steps.map((step, idx) => {
                                const isCompleted = idx <= currentIdx
                                const isCurrent = idx === currentIdx
                                const Icon = step.icon
                                return (
                                    <div key={step.key} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'bg-[var(--primary)] text-white shadow-lg shadow-red-200 ring-4 ring-red-100' :
                                                isCompleted ? 'bg-green-500 text-white' :
                                                    'bg-gray-100 text-gray-400'
                                                }`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            {idx < steps.length - 1 && (
                                                <div className={`w-0.5 h-10 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                                            )}
                                        </div>
                                        <div className={`pb-4 ${isCurrent ? '' : 'opacity-60'}`}>
                                            <p className={`font-bold text-sm ${isCurrent ? 'text-gray-900' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                                                {step.label}
                                                {isCurrent && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black animate-pulse">AHORA</span>}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Driver Info */}
                {order.driver && order.status !== 'DELIVERED' && (
                    <Card className="rounded-2xl border-gray-200 overflow-hidden mb-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                        <CardContent className="p-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Tu Repartidor</h3>
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center text-2xl font-black">
                                    {order.driver.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-black">{order.driver.name}</p>
                                    <p className="text-xs text-gray-400 font-medium">Repartidor PídeloYA verificado ✓</p>
                                </div>
                                <div className="flex gap-2">
                                    <button aria-label="Llamar al repartidor" className="h-12 w-12 rounded-xl bg-green-600 hover:bg-green-700 flex items-center justify-center text-white transition-colors shadow-lg">
                                        <Phone className="h-5 w-5" />
                                    </button>
                                    <button aria-label="Enviar mensaje al repartidor" className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors shadow-lg">
                                        <MessageCircle className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {/* Review Section */}
                {isDelivered && !restaurantReview && (
                    hoursSinceDelivery >= 1 ? (
                        <ReviewForm 
                            orderId={order.id}
                            restaurantName={order.restaurant.name}
                            items={order.items.map(item => ({
                                productId: item.productId,
                                name: item.product.name,
                                image: item.product.image || undefined
                            }))}
                        />
                    ) : (
                        <Card className="rounded-2xl border-amber-100 bg-amber-50/50 overflow-hidden mb-6">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Clock className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">¡Pedido Entregado!</h4>
                                    <p className="text-xs text-gray-600">Podrás dejar tu reseña en {Math.ceil(60 - (hoursSinceDelivery * 60))} minutos. Queremos que pruebes todo primero.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                )}

                {/* Show existing review indicator if already reviewed */}
                {restaurantReview && (
                    <Card className="rounded-2xl border-gray-100 bg-gray-50 overflow-hidden mb-6">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Calificación Enviada</h4>
                                <p className="text-xs text-gray-600">Ya calificaste este pedido con {restaurantReview.rating} estrellas.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Order Details */}
                <Card className="rounded-2xl border-gray-200 overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                                <img src={order.restaurant.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{order.restaurant.name}</h3>
                                <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.restaurant.address}</p>
                            </div>
                        </div>

                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Detalle del Pedido</h4>
                        <div className="space-y-3">
                            {order.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="h-7 w-7 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-black">{item.quantity}x</span>
                                        <span className="text-sm font-medium text-gray-800">{item.product.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">${(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="font-bold text-gray-600">Total pagado</span>
                            <span className="text-2xl font-black text-gray-900">${order.total.toLocaleString()}</span>
                        </div>

                        <p className="text-xs text-gray-400 mt-4 text-center">
                            Pedido realizado el {new Date(order.createdAt).toLocaleDateString('es-CL', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
