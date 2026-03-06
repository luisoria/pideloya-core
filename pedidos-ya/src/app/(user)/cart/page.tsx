
"use client"

import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Trash2, ArrowLeft, Plus, Minus, CreditCard, MapPin, Clock, ShieldCheck, ChevronRight, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Modal } from "@/components/ui/Modal"

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, updateNotes, clearCart, total, itemCount, couponCode, discountAmount, setCouponData } = useCart()
    const [isSuccessOpen, setSuccessOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart')

    // Coupon state
    const [couponInput, setCouponInput] = useState("")
    const [couponLoading, setCouponLoading] = useState(false)
    const [couponError, setCouponError] = useState("")

    // Payment form state
    const [paymentForm, setPaymentForm] = useState({
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: '',
        address: '',
        phone: '',
        paymentMethod: 'card' as 'card' | 'cash'
    })

    const deliveryFee = total > 15000 ? 0 : 1990
    const serviceFee = Math.round(total * 0.05)
    const grandTotal = Math.max(0, total + deliveryFee + serviceFee - discountAmount)

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return
        setCouponLoading(true)
        setCouponError("")

        try {
            const { validateCoupon } = await import('@/app/actions/coupons')
            const result = await validateCoupon(
                couponInput.trim(),
                items[0].restaurantId,
                total
            )

            if (result.error) {
                setCouponError(result.error)
                setCouponData(null, 0)
            } else {
                setCouponData(result.coupon!.code, result.discountAmount!)
                setCouponInput("")
            }
        } catch (_error) {
            setCouponError("Ocurrió un error al validar el cupón")
        } finally {
            setCouponLoading(false)
        }
    }

    const handleRemoveCoupon = () => {
        setCouponData(null, 0)
    }

    const handleCheckout = async () => {
        if (items.length === 0) return
        setIsLoading(true)
        try {
            const { createOrder } = await import('@/app/actions/orders')
            const restaurantId = items[0].restaurantId
            const orderItems = items.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            }))
            await createOrder(restaurantId, grandTotal, orderItems, paymentForm.paymentMethod === 'card' ? 'CARD' : 'CASH', couponCode || undefined)
            setSuccessOpen(true)
        } catch (error) {
            console.error(error)
            alert("Error al procesar el pedido. (Asegúrate de estar logueado como cliente)")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCloseSuccess = () => {
        setSuccessOpen(false)
        clearCart()
        window.location.href = "/orders"
    }

    if (items.length === 0 && !isSuccessOpen) {
        return (
            <div className="container py-20 flex flex-col items-center justify-center gap-6 text-center min-h-[60vh]">
                <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center text-5xl">🛒</div>
                <h1 className="text-2xl font-black text-gray-900 uppercase">Tu carrito está vacío</h1>
                <p className="text-gray-500 max-w-sm">Agrega productos deliciosos desde nuestros restaurantes aliados para comenzar tu pedido.</p>
                <Link href="/" className="inline-flex h-12 px-8 items-center justify-center rounded-xl text-sm font-bold bg-[var(--primary)] text-white hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                    Explorar Restaurantes
                </Link>
            </div>
        )
    }

    // ── PAYMENT STEP ──
    if (checkoutStep === 'payment') {
        return (
            <div className="container py-8 max-w-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <button aria-label="Volver al carrito" onClick={() => setCheckoutStep('cart')} className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Pago Seguro</h1>
                        <p className="text-xs text-gray-500 font-medium">Tus datos están protegidos con encriptación SSL</p>
                    </div>
                </div>

                {/* Payment Method Toggle */}
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'card' })}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${paymentForm.paymentMethod === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    >
                        <CreditCard className="h-4 w-4 inline mr-2" /> Tarjeta
                    </button>
                    <button
                        onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'cash' })}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${paymentForm.paymentMethod === 'cash' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    >
                        💵 Efectivo
                    </button>
                </div>

                {/* Card Form */}
                {paymentForm.paymentMethod === 'card' && (
                    <Card className="mb-6 rounded-2xl border-gray-200 overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Número de tarjeta</label>
                                <input
                                    type="text"
                                    placeholder="4242 4242 4242 4242"
                                    maxLength={19}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-lg font-mono tracking-widest focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                    value={paymentForm.cardNumber}
                                    onChange={e => {
                                        const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                                        setPaymentForm({ ...paymentForm, cardNumber: v.replace(/(\d{4})/g, '$1 ').trim() })
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Nombre en la tarjeta</label>
                                <input
                                    type="text"
                                    placeholder="JUAN PEREZ"
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-bold uppercase focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                    value={paymentForm.cardName}
                                    onChange={e => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Expiración</label>
                                    <input
                                        type="text"
                                        placeholder="MM/AA"
                                        maxLength={5}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-center font-mono text-lg focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                        value={paymentForm.expiry}
                                        onChange={e => {
                                            let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                                            if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
                                            setPaymentForm({ ...paymentForm, expiry: v })
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">CVV</label>
                                    <input
                                        type="password"
                                        placeholder="•••"
                                        maxLength={4}
                                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-center font-mono text-lg focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                        value={paymentForm.cvv}
                                        onChange={e => setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Delivery Address */}
                <Card className="mb-6 rounded-2xl border-gray-200 overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" /> Dirección de entrega
                            </label>
                            <input
                                type="text"
                                placeholder="Av. Apoquindo 4500, Dpto 1201, Las Condes"
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                value={paymentForm.address}
                                onChange={e => setPaymentForm({ ...paymentForm, address: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Teléfono de contacto</label>
                            <input
                                type="tel"
                                placeholder="+56 9 1234 5678"
                                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-medium focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                value={paymentForm.phone}
                                onChange={e => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="mb-6 rounded-2xl border-gray-200 bg-gray-50 overflow-hidden">
                    <CardContent className="p-6 space-y-3">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Resumen del pedido</h3>
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm text-gray-700">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-bold">${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 pt-3 space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>${total.toLocaleString('es-CL')}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Envío {total > 15000 && <span className="text-green-600 font-bold ml-1">GRATIS</span>}</span>
                                <span>{deliveryFee === 0 ? '$0' : `$${deliveryFee.toLocaleString('es-CL')}`}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Servicio</span>
                                <span>${serviceFee.toLocaleString('es-CL')}</span>
                            </div>
                            {couponCode && (
                                <div className="flex justify-between text-sm font-bold text-red-600">
                                    <span>Cupón ({couponCode})</span>
                                    <span>-${discountAmount.toLocaleString('es-CL')}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-300">
                                <span>Total a Pagar</span>
                                <span className="text-[var(--primary)]">${grandTotal.toLocaleString('es-CL')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security badge */}
                <div className="flex items-center gap-3 justify-center mb-6 text-xs text-gray-400 font-medium">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span>Pago 100% seguro · Encriptación SSL 256-bit</span>
                </div>

                {/* Pay button */}
                <Button
                    size="lg"
                    className="w-full h-14 text-base font-black uppercase tracking-widest bg-[var(--primary)] hover:bg-red-700 shadow-xl shadow-red-200 rounded-xl"
                    onClick={handleCheckout}
                    disabled={isLoading || (!paymentForm.address)}
                >
                    {isLoading ? "Procesando pago..." : `Pagar $${grandTotal.toLocaleString()}`}
                </Button>

                <Modal isOpen={isSuccessOpen} onClose={handleCloseSuccess} title="¡Pedido Confirmado!">
                    <div className="text-center py-6">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-lg font-bold text-gray-900">¡Tu pedido ha sido confirmado!</p>
                        <p className="text-gray-500 text-sm mt-2">Puedes seguir el estado de tu pedido en tiempo real desde &quot;Mis Pedidos&quot;.</p>
                        <Button className="mt-6 w-full h-12 font-bold" onClick={handleCloseSuccess}>Ver mi pedido</Button>
                    </div>
                </Modal>
            </div>
        )
    }

    // ── CART STEP ──
    return (
        <div className="container py-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Tu Pedido</h1>
                    <p className="text-xs text-gray-500 font-medium">{itemCount} producto{itemCount !== 1 ? 's' : ''} en tu carrito</p>
                </div>
            </div>

            <div className="space-y-4">
                {items.map((item) => (
                    <Card key={item.id} className="rounded-2xl border-gray-200 overflow-hidden hover:shadow-md transition-all">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">${item.price.toLocaleString()} c/u</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-gray-900 text-lg">${(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Quantity Controls + Notes */}
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                    <button
                                        aria-label="Disminuir cantidad"
                                        className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-10 text-center font-black text-gray-900">{item.quantity}</span>
                                    <button
                                        aria-label="Aumentar cantidad"
                                        className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 transition-all"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>

                                <button
                                    aria-label="Eliminar producto"
                                    className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Per-item notes */}
                            <div className="mt-3">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
                                    <MessageSquare className="h-3 w-3" /> Nota para la cocina
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ej: Sin cebolla, extra queso..."
                                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                                    value={item.notes || ''}
                                    onChange={e => updateNotes(item.id, e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Coupon Section */}
            <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="text-red-500 text-lg">🏷️</span> ¿Tienes un cupón?
                </h3>

                {couponCode ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                        <div>
                            <p className="text-sm font-bold text-green-800 flex items-center gap-1.5 uppercase tracking-wide">
                                Cupón Aplicado
                                <span className="bg-white px-2 py-0.5 rounded font-mono border border-green-200 text-xs">
                                    {couponCode}
                                </span>
                            </p>
                            <p className="text-xs text-green-700 font-medium mt-0.5">
                                Ahorraste ${discountAmount.toLocaleString('es-CL')} en este pedido.
                            </p>
                        </div>
                        <button
                            onClick={handleRemoveCoupon}
                            className="bg-white text-gray-400 hover:text-red-600 p-2 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                            title="Remover cupón"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ingresa tu código"
                                className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all placeholder:normal-case placeholder:font-medium placeholder:tracking-normal"
                                value={couponInput}
                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                            />
                            <Button
                                onClick={handleApplyCoupon}
                                disabled={couponLoading || !couponInput.trim()}
                                className="h-12 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-bold uppercase tracking-wide"
                            >
                                {couponLoading ? "Validando..." : "Aplicar"}
                            </Button>
                        </div>
                        {couponError && (
                            <p className="text-red-600 text-xs font-bold mt-2 ml-1 flex items-center gap-1">
                                ❌ {couponError}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Totals */}
            <div className="mt-8 bg-gray-50 rounded-2xl p-6 space-y-3 border border-gray-100">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="font-bold text-gray-700">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Envío estimado 20-35 min</span>
                    <span className={`font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                        {deliveryFee === 0 ? 'GRATIS' : `$${deliveryFee.toLocaleString()}`}
                    </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Cargo por servicio</span>
                    <span className="font-bold text-gray-700">${serviceFee.toLocaleString()}</span>
                </div>
                {total < 15000 && (
                    <div className="bg-yellow-50 text-yellow-700 text-xs font-bold px-3 py-2 rounded-lg border border-yellow-200">
                        💡 Agrega ${(15000 - total).toLocaleString()} más para envío GRATIS
                    </div>
                )}
                <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>${grandTotal.toLocaleString()}</span>
                </div>
            </div>

            <Button
                size="lg"
                className="w-full mt-6 h-14 text-base font-black uppercase tracking-widest bg-[var(--primary)] hover:bg-red-700 shadow-xl shadow-red-200 rounded-xl flex items-center justify-center gap-2"
                onClick={() => setCheckoutStep('payment')}
            >
                Proceder al pago <ChevronRight className="h-5 w-5" />
            </Button>

            <Modal isOpen={isSuccessOpen} onClose={handleCloseSuccess} title="¡Pedido Confirmado!">
                <div className="text-center py-6">
                    <div className="text-6xl mb-4">🎉</div>
                    <p className="text-lg font-bold text-gray-900">¡Tu pedido ha sido confirmado!</p>
                    <p className="text-gray-500 text-sm mt-2">Puedes seguir el estado desde &quot;Mis Pedidos&quot;.</p>
                    <Button className="mt-6 w-full h-12 font-bold" onClick={handleCloseSuccess}>Ver mi pedido</Button>
                </div>
            </Modal>
        </div>
    )
}
