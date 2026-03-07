
"use client"

import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Trash2, ArrowLeft, Plus, Minus, CreditCard, MapPin, Clock, ShieldCheck, ChevronRight, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { ClientImage } from "@/components/ui/ClientImage"

const isImageUrl = (url: string | null | undefined) => {
    if (!url) return false
    return url.startsWith("http") || url.startsWith("/") || url.startsWith("data:image") || /\.(jpeg|jpg|gif|png|webp|svg)/i.test(url)
}

export default function CartPage() {
    const { items, removeFromCart, removeFromRestaurant, updateQuantity, updateNotes, clearCart, total, itemCount, couponCode, discountAmount, setCouponData } = useCart()
    const [isSuccessOpen, setSuccessOpen] = useState(false)
    const [isSavedOpen, setSavedOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart')
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)

    // Group items by restaurant
    const groupedCarts = items.reduce((acc, item) => {
        const rid = item.restaurantId;
        if (!acc[rid]) {
            acc[rid] = {
                id: rid,
                name: item.restaurantName || "Restaurante",
                items: []
            };
        }
        acc[rid].items.push(item);
        return acc;
    }, {} as Record<string, { id: string, name: string, items: any[] }>);

    const cartList = Object.values(groupedCarts);

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

    // Validation State
    const [isRestaurantOpen, setIsRestaurantOpen] = useState(true)
    const [unavailableItems, setUnavailableItems] = useState<string[]>([])
    const [isValidating, setIsValidating] = useState(false)

    useEffect(() => {
        if (items.length === 0 || !selectedRestaurantId) return
        const validate = async () => {
            setIsValidating(true)
            try {
                const { validateCart } = await import('@/app/actions/cart-validation')
                const restaurantItems = items.filter(i => i.restaurantId === selectedRestaurantId)
                const itemsToValidate = restaurantItems.map(i => ({ productId: i.id, quantity: i.quantity }))
                const res = await validateCart(selectedRestaurantId, itemsToValidate)
                if (res && res.isOpen !== undefined) {
                    setIsRestaurantOpen(res.isOpen)
                    setUnavailableItems(res.unavailableProductIds || [])
                }
            } catch (error) {
                console.error("Error validando carrito", error)
            } finally {
                setIsValidating(false)
            }
        }
        validate()
    }, [items, selectedRestaurantId])

    // Items for active checkout or general view
    const checkoutItems = selectedRestaurantId 
        ? items.filter(i => i.restaurantId === selectedRestaurantId)
        : items;

    // Recalculate based on available items only for active order
    const validItems = checkoutItems.filter(i => !unavailableItems.includes(i.id))
    const validTotal = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const validItemCount = items.reduce((acc, item) => acc + item.quantity, 0) // Header count stays global
    
    // Fees for the ACTIVE cart being checked out
    const deliveryFee = validTotal > 0 && validTotal > 15000 ? 0 : 1990
    const serviceFee = Math.round(validTotal * 0.05)
    let grandTotal = Math.max(0, validTotal + deliveryFee + serviceFee - discountAmount)
    if (validTotal === 0) grandTotal = 0;


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
        if (validItems.length === 0 || !isRestaurantOpen || !selectedRestaurantId) return
        setIsLoading(true)
        try {
            const { createOrder } = await import('@/app/actions/orders')
            const orderItems = validItems.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            }))
            await createOrder(selectedRestaurantId, grandTotal, orderItems, paymentForm.paymentMethod === 'card' ? 'CARD' : 'CASH', couponCode || undefined)
            setSuccessOpen(true)
        } catch (error) {
            console.error(error)
            alert("Error al procesar el pedido. (Asegúrate de estar logueado como cliente)")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCloseSuccess = () => {
        const currentCartsCount = cartList.length;
        setSuccessOpen(false)
        if (selectedRestaurantId) {
            removeFromRestaurant(selectedRestaurantId)
        }
        setCheckoutStep('cart')
        setSelectedRestaurantId(null)
        // If it was the last restaurant, go to orders, else stay in cart for others
        if (currentCartsCount <= 1) {
            window.location.href = "/orders"
        }
    }

    const handleSaveDraft = async () => {
        if (validItems.length === 0) return
        setIsSaving(true)
        try {
            const { saveOrderAsDraft } = await import('@/app/actions/orders')
            const restaurantId = validItems[0].restaurantId
            const orderItems = validItems.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            }))
            
            const res = await saveOrderAsDraft(restaurantId, grandTotal, orderItems, couponCode || undefined)
            if (res.error) {
                alert(res.error)
            } else {
                setSavedOpen(true)
            }
        } catch (error) {
            console.error(error)
            alert("Error al guardar el carrito.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCloseSaved = () => {
        setSavedOpen(false)
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
                        <p className="text-xs text-gray-500 font-medium">Tus datos están protegidos con encriptación SSL en <span className="text-[var(--primary)] font-bold">{groupedCarts[selectedRestaurantId!]?.name || 'Restaurante'}</span></p>
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

                {/* Coupon Section */}
                <Card className="mb-6 rounded-2xl border-gray-200 overflow-hidden shadow-sm">
                    <CardContent className="p-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">🏷️ Beneficios y Descuentos</label>
                        {couponCode ? (
                             <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl p-4">
                                 <div className="flex items-center gap-3">
                                     <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">🎉</div>
                                     <div>
                                         <p className="text-xs font-black text-green-900 uppercase tracking-tight">Cupón Activo</p>
                                         <p className="text-sm font-mono font-bold text-green-700">{couponCode}</p>
                                     </div>
                                 </div>
                                 <button
                                     onClick={handleRemoveCoupon}
                                     className="h-10 w-10 flex items-center justify-center bg-white text-gray-400 hover:text-red-600 rounded-xl border border-transparent hover:border-red-100 transition-all shadow-sm"
                                 >
                                     <Trash2 className="h-4 w-4" />
                                 </button>
                             </div>
                         ) : (
                             <div className="flex gap-2">
                                 <input
                                     type="text"
                                     placeholder="Código de cupón"
                                     className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-gray-900 transition-all placeholder:normal-case placeholder:font-medium placeholder:tracking-normal"
                                     value={couponInput}
                                     onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                 />
                                 <Button
                                     onClick={handleApplyCoupon}
                                     disabled={couponLoading || !couponInput.trim()}
                                     className="h-12 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-bold uppercase text-xs tracking-widest"
                                 >
                                     {couponLoading ? "..." : "Aplicar"}
                                 </Button>
                             </div>
                         )}
                         {couponError && <p className="text-red-600 text-[10px] font-black mt-2 ml-1 uppercase tracking-tight">❌ {couponError}</p>}
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="mb-6 rounded-2xl border-gray-200 bg-gray-50 overflow-hidden">
                    <CardContent className="p-6 space-y-3">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Resumen del pedido</h3>
                        {validItems.map(item => (
                            <div key={item.id} className="flex justify-between text-sm text-gray-700">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-bold">${(item.price * item.quantity).toLocaleString('es-CL')}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-200 pt-3 space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>${validTotal.toLocaleString('es-CL')}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Envío {validTotal > 15000 && <span className="text-green-600 font-bold ml-1">GRATIS</span>}</span>
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

            <div className="space-y-12">
                {cartList.map((cart) => {
                    const cartTotal = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
                    const cartItemCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);
                    
                    return (
                        <div key={cart.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-lg shadow-inner">🍔</div>
                                    <h2 className="text-lg font-black uppercase tracking-tight">{cart.name}</h2>
                                </div>
                                <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">{cartItemCount} items</span>
                            </div>

                            <div className="p-6 space-y-4">
                                {cart.items.map((item) => {
                                    return (
                                        <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-gray-50 hover:border-gray-100 transition-all hover:shadow-sm">
                                            <div className="h-20 w-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 shadow-sm">
                                                {isImageUrl(item.image) ? (
                                                    <ClientImage 
                                                        src={item.image} 
                                                        alt={item.name} 
                                                        className="h-full w-full object-cover" 
                                                        fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-3xl bg-gray-100">
                                                        {item.image && item.image.length < 5 ? item.image : "🍕"}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                                                        <p className="text-sm text-gray-500 mt-0.5">${item.price.toLocaleString()} c/u</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-black text-lg text-gray-900">
                                                            ${(item.price * item.quantity).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                                        <button 
                                                            className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="w-8 text-center font-black text-gray-900 text-sm">{item.quantity}</span>
                                                        <button 
                                                            className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 transition-all"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <button 
                                                        className="text-gray-300 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="bg-gray-50 px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-100">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subtotal de la orden</p>
                                        <p className="text-2xl font-black text-gray-900">${cartTotal.toLocaleString()}</p>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200 hidden md:block" />
                                    <div className="hidden sm:flex -space-x-2">
                                        {cart.items.slice(0, 3).map((it, idx) => (
                                            <div key={idx} className="h-8 w-8 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-xs overflow-hidden">
                                                {isImageUrl(it.image) ? <img src={it.image} className="w-full h-full object-cover" /> : "🍔"}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedRestaurantId(cart.id);
                                        setCheckoutStep('payment');
                                    }}
                                    className="w-full md:w-auto px-10 h-14 bg-[var(--primary)] hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Pagar {cart.name} <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {cartList.length > 1 && (
                <div className="mt-12 bg-blue-50 rounded-3xl p-8 border border-blue-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0 font-bold">🛒</div>
                    <div>
                        <h3 className="text-lg font-black text-blue-900 mb-1 uppercase tracking-tight">Varios restaurantes en tu carrito</h3>
                        <p className="text-blue-700 text-sm leading-relaxed font-medium">
                            Debes completar el pago de cada restaurante por separado para que cada uno reciba su pedido correctamente.
                        </p>
                    </div>
                </div>
            )}

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
