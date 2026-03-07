'use client'

import * as React from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Plus, Minus, Trash2, Clock, ShoppingBag, AlertCircle } from "lucide-react"
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
    const { addToCart, items, updateQuantity, removeFromCart } = useCart()
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
            restaurantId: restaurantId,
            image: product.image
        })
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
            {/* Left Sidebar Cart */}
            <div className="hidden lg:flex w-full lg:w-[340px] flex-col gap-4 sticky top-24 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col max-h-[calc(100vh-8rem)]">
                    <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-md relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] opacity-80"></div>
                            <ShoppingBag className="h-5 w-5 relative z-10 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-[var(--foreground)] uppercase">
                            Pídelo<span className="text-[var(--secondary)]">Ya</span>
                        </span>
                    </div>
                    <h3 className="font-extrabold text-gray-900 mb-4 text-lg">Tu Pedido</h3>
                    
                    {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                            <ShoppingBag className="h-14 w-14 mb-3 opacity-20" />
                            <p className="text-sm font-medium">Tu carrito está vacío</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                            {items.map(item => {
                                const product = products.find(p => p.id === item.id)
                                return (
                                    <div key={item.id} className="flex gap-4 relative group items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                            {product?.image ? (
                                                <img src={product.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">🍔</div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">{item.name}</h4>
                                                {product?.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{product.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-sm font-black text-[var(--primary)]">${(item.price * item.quantity).toLocaleString("es-CL")}</span>
                                                <div className="flex items-center gap-2 bg-gray-50 rounded-full border border-gray-200 p-1">
                                                    <button 
                                                        onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                                                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-600 hover:text-[var(--primary)] transition-colors"
                                                    >
                                                        {item.quantity > 1 ? <Minus className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center select-none">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm text-white hover:bg-[var(--primary)]/90 transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    
                    {items.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-gray-100 pb-2">
                            <div className="flex justify-between items-end mb-5">
                                <span className="font-bold text-gray-600">Total a pagar</span>
                                <span className="text-2xl font-black text-gray-900">
                                    ${items.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString("es-CL")}
                                </span>
                            </div>
                            <Link href="/cart" className="w-full flex items-center justify-center py-3.5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-all shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 active:translate-y-0">
                                Ir a pagar pedido
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                                <CardContent className="p-3 pt-2 flex items-center justify-between shrink-0">
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

                {/* Floating Cart Button for Mobile (hidden on desktop where sidebar is visible) */}
                {items.length > 0 && (
                    <div className="fixed bottom-6 left-0 right-0 p-4 flex justify-center z-50 lg:hidden">
                        <Link href="/cart" className="inline-flex h-12 items-center justify-center text-sm font-black bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-all shadow-[0_10px_30px_rgba(204,0,0,0.3)] hover:scale-105 active:scale-95 rounded-full px-10 animate-in slide-in-from-bottom-5 gap-3">
                            <ShoppingBag className="h-5 w-5 bg-white text-[var(--primary)] rounded-full p-1" />
                            Ver Mi Pedido ({items.length}) - ${items.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString("es-CL")}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

