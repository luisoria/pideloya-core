"use client"

import { useEffect, useState, use } from "react"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"

export default function RestoreCartPage({ params }: { params: Promise<{ orderId: string }> | { orderId: string } }) {
    const { addManyToCart, clearCart } = useCart()
    const router = useRouter()
    const [error, setError] = useState("")

    // In modern Next.js, params can be a Promise
    const unwrappedParams = params instanceof Promise ? use(params) : params
    const orderId = unwrappedParams?.orderId

    useEffect(() => {
        if (!orderId) return

        const restore = async () => {
            try {
                const { getDraftOrder } = await import('@/app/actions/draft-orders')
                const draft = await getDraftOrder(orderId)
                
                if (draft.error) {
                    setError(draft.error)
                    return
                }

                if (draft.order) {
                    clearCart()
                    const itemsToRestore = draft.order.items.map((i: any) => ({
                        id: i.productId,
                        name: i.product.name,
                        price: i.price,
                        quantity: i.quantity,
                        restaurantId: draft.order.restaurantId,
                        image: i.product.image
                    }))
                    
                    addManyToCart(itemsToRestore)

                    // Optional: delete draft after moving to local cart
                    const { deleteDraftOrder } = await import('@/app/actions/orders')
                    await deleteDraftOrder(orderId)

                    router.push('/cart')
                }
            } catch (err: any) {
                setError(err.message || "Error al restaurar carrito")
            }
        }
        restore()
    }, [orderId, clearCart, router, addManyToCart])

    if (error) {
        return (
            <div className="container py-20 text-center px-4">
                <div className="max-w-md mx-auto p-8 rounded-3xl bg-red-50 border border-red-100 shadow-xl">
                    <h1 className="text-2xl font-black text-red-600 mb-4 uppercase tracking-tight">No se pudo restaurar</h1>
                    <p className="text-gray-600 font-medium mb-8 leading-relaxed">{error}</p>
                    <button 
                        onClick={() => router.push('/orders')} 
                        className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 hover:-translate-y-0.5 transition-all active:translate-y-0"
                    >
                        Volver a mis pedidos
                    </button>
                </div>
            </div>
        )
    }

    if (!orderId) {
        return (
            <div className="container py-32 text-center">
                <div className="animate-spin h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-lg font-bold text-gray-700">Preparando restauración...</p>
            </div>
        )
    }

    return (
        <div className="container py-32 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-bold text-gray-700">Restaurando carrito...</p>
        </div>
    )
}
