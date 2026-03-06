"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { MapPin, Navigation, Package, CheckCircle } from "lucide-react"
import { acceptOrderAsDriver, deliverOrder } from "@/app/actions/orders"
import { useRouter } from "next/navigation"

export function DriverClient({ availableOrders, activeOrders }: { availableOrders: any[], activeOrders: any[] }) {
    const router = useRouter()
    const [isUpdating, setIsUpdating] = useState<string | null>(null)

    // Auto-select the first active order if exists
    const currentOrder = activeOrders.length > 0 ? activeOrders[0] : null

    const handleAccept = async (orderId: string) => {
        setIsUpdating(orderId)
        try {
            await acceptOrderAsDriver(orderId)
            router.refresh()
        } catch (e: any) {
            console.error(e)
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
            console.error(e)
            alert(e.message || "Error al procesar la entrega.")
        } finally {
            setIsUpdating(null)
        }
    }

    return (
        <div className="container py-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Panel del Repartidor</h1>

            {currentOrder ? (
                <div className="flex flex-col gap-6">
                    <Card className="border-[var(--primary)] border-2">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <Badge className="bg-yellow-500 text-black font-bold">En Camino</Badge>
                                <span className="font-bold text-lg">${(currentOrder.total * 0.15).toFixed(2)}</span>
                            </div>
                            <CardTitle className="mt-2 text-xl">{currentOrder.restaurant.name}</CardTitle>
                            <CardDescription>Pedido #{currentOrder.id.slice(0, 8)}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Package className="h-5 w-5 text-[var(--muted-foreground)]" />
                                <div>
                                    <p className="font-medium text-black">Retirar en:</p>
                                    <p className="text-sm text-gray-500">{currentOrder.restaurant.address}</p>
                                    <div className="text-xs mt-1 text-gray-400 font-semibold line-clamp-2">
                                        {currentOrder.items.map((it: any) => `${it.quantity}x ${it.product.name}`).join(", ")}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 mt-4">
                                <MapPin className="h-5 w-5 text-[var(--primary)]" />
                                <div>
                                    <p className="font-medium text-black">Entregar a:</p>
                                    <p className="text-sm text-gray-500">{currentOrder.customer.name}</p>
                                    <p className="text-xs text-gray-400">Dir: Centro Cívico, Oficina {currentOrder.customer.id.slice(-3)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-6">
                                <Button
                                    variant="outline"
                                    className="w-full font-bold border-gray-300 hover:bg-gray-100"
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Centro Civico Santiago')}`, '_blank')}
                                >
                                    <Navigation className="mr-2 h-4 w-4" /> Ruta
                                </Button>
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 font-bold"
                                    onClick={() => handleComplete(currentOrder.id)}
                                    disabled={isUpdating === currentOrder.id}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Entregado
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold border-b pb-2">Pedidos Listos para Retiro</h2>
                    {availableOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">No hay pedidos disponibles.</p>
                    ) : (
                        availableOrders.map((order) => (
                            <Card key={order.id} className="hover:border-[var(--secondary)] transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <CardTitle className="text-lg">{order.restaurant.name}</CardTitle>
                                        <span className="font-bold text-green-600 text-lg">${(order.total * 0.15).toFixed(2)}</span>
                                    </div>
                                    <CardDescription>{order.items.length} productos • Cobro por despacho</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 text-gray-400" /> {order.restaurant.address}
                                    </div>
                                    <Button
                                        className="w-full text-white hover:bg-red-800 font-bold"
                                        style={{ backgroundColor: '#CC0000' }}
                                        onClick={() => handleAccept(order.id)}
                                        disabled={isUpdating === order.id}
                                    >
                                        Aceptar Viaje
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
