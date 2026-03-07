"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"

export default function RestoreCartPage({ params }: { params: { orderId: string } }) {
    const { addManyToCart, clearCart } = useCart()
    const router = useRouter()
    const [error, setError] = useState("")

    useEffect(() => {
        const restore = async () => {
            try {
                // Fetch context specific details via standard React Client behavior
                // But wait, we can't fetch order.items easily securely from client without an endpoint
                // It's better to fetch via Server Action
                const { getDraftOrder } = await import('@/app/actions/draft-orders')
                const draft = await getDraftOrder(params.orderId)
                
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
                    await deleteDraftOrder(params.orderId)

                    router.push('/cart')
                }
            } catch (err: any) {
                setError(err.message || "Error al restaurar carrito")
            }
        }
        restore()
    }, [params.orderId, clearCart, router, addManyToCart])

    if (error) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">No se pudo restaurar el carrito</h1>
                <p className="text-gray-500">{error}</p>
                <button onClick={() => router.push('/orders')} className="mt-6 text-blue-600 underline">Volver a mis pedidos</button>
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
