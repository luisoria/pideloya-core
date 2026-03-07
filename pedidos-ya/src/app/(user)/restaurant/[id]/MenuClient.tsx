'use client'

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Plus, Clock, AlertCircle } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"
import { Modal } from "@/components/ui/Modal"

export function MenuClient({ products, restaurantId, isOpen, openTime, closeTime }: { 
    products: any[], 
    restaurantId: string,
    isOpen: boolean,
    openTime: string,
    closeTime: string
}) {
    const { addToCart, items } = useCart()
    const [showClosedModal, setShowClosedModal] = React.useState(false)

    const handleAddToCart = (product: any) => {
        if (!isOpen) {
            setShowClosedModal(true)
            return
        }
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            restaurantId: restaurantId
        })
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-row overflow-hidden hover:border-[var(--primary)] transition-colors relative group">
                        {!isOpen && (
                            <div className="absolute inset-0 bg-white/40 backdrop-grayscale-[0.5] z-10 pointer-events-none" />
                        )}
                        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>🍔</span>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between p-0">
                            <CardHeader className="p-3 pb-0">
                                <CardTitle className="text-base">{product.name}</CardTitle>
                                <CardDescription className="text-xs line-clamp-2">{product.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-2 flex items-center justify-between">
                                <span className="font-bold text-red-600">${product.price.toLocaleString("es-CL")}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 relative z-20"
                                    onClick={() => handleAddToCart(product)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Premium Closed Modal */}
            <Modal
                isOpen={showClosedModal}
                onClose={() => setShowClosedModal(false)}
                title="Local Cerrado"
                footer={
                    <Button 
                        className="w-full bg-[var(--primary)] text-white font-bold" 
                        onClick={() => setShowClosedModal(false)}
                    >
                        Entendido, volveré más tarde
                    </Button>
                }
            >
                <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Clock className="h-8 w-8 text-red-600 animate-pulse" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-2">¡Lo sentimos!</h4>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Este restaurante se encuentra fuera de su horario de atención o ha cerrado temporalmente la recepción de pedidos.
                    </p>
                    <div className="bg-gray-50 w-full p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Horario de Hoy</span>
                        </div>
                        <span className="text-sm font-black text-[var(--primary)]">{openTime} - {closeTime}</span>
                    </div>
                </div>
            </Modal>

            {/* Floating Cart Button if items exist */}
            {items.length > 0 && (
                <div className="fixed bottom-6 left-0 right-0 p-4 flex justify-center z-50">
                    <Link href="/cart" className="inline-flex h-12 items-center justify-center text-sm font-black bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-all shadow-[0_10px_30px_rgba(204,0,0,0.3)] hover:scale-105 active:scale-95 rounded-full px-10 animate-in slide-in-from-bottom-5 gap-3">
                        <Plus className="h-5 w-5 bg-white text-[var(--primary)] rounded-full p-1" />
                        Ver Mi Pedido ({items.length}) - ${items.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString("es-CL")}
                    </Link>
                </div>
            )}
        </>
    )
}
