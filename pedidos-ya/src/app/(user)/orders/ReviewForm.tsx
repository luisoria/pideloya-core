"use client"

import { useState } from "react"
import { Star, MessageSquare, Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { submitOrderReview } from "@/app/actions/reviews"

interface ReviewFormProps {
    orderId: string
    restaurantName: string
    items: { productId: string, name: string, image?: string }[]
}

export function ReviewForm({ orderId, restaurantName, items }: ReviewFormProps) {
    const [restaurantRating, setRestaurantRating] = useState(0)
    const [restaurantHover, setRestaurantHover] = useState(0)
    const [restaurantComment, setRestaurantComment] = useState("")
    
    const [productRatings, setProductRatings] = useState<Record<string, { rating: number, comment: string }>>(
        items.reduce((acc, item) => ({ ...acc, [item.productId]: { rating: 0, comment: "" } }), {})
    )
    const [productHovers, setProductHovers] = useState<Record<string, number>>(
        items.reduce((acc, item) => ({ ...acc, [item.productId]: 0 }), {})
    )

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState("")

    const handleProductRatingChange = (productId: string, rating: number) => {
        setProductRatings(prev => ({
            ...prev,
            [productId]: { ...prev[productId], rating }
        }))
    }

    const handleProductHoverChange = (productId: string, hover: number) => {
        setProductHovers(prev => ({ ...prev, [productId]: hover }))
    }

    const handleProductCommentChange = (productId: string, comment: string) => {
        setProductRatings(prev => ({
            ...prev,
            [productId]: { ...prev[productId], comment }
        }))
    }

    const handleSubmit = async () => {
        if (restaurantRating === 0) {
            setError("Por favor, califica el restaurante antes de enviar.")
            return
        }
        
        setIsSubmitting(true)
        setError("")

        const formattedProductReviews = Object.entries(productRatings)
            .filter(([_, data]) => data.rating > 0)
            .map(([productId, data]) => ({
                productId,
                rating: data.rating,
                comment: data.comment
            }))

        const result = await submitOrderReview(
            orderId,
            restaurantRating,
            restaurantComment,
            formattedProductReviews
        )

        setIsSubmitting(false)
        if (result.success) {
            setIsSuccess(true)
        } else {
            setError(result.error || "Algo salió mal")
        }
    }

    if (isSuccess) {
        return (
            <Card className="rounded-2xl border-green-100 bg-green-50/50 overflow-hidden mb-6">
                <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">¡Opinión Enviada Permanente!</h3>
                    <p className="text-sm text-gray-600">Tu calificación ha sido registrada. No podrá ser modificada para garantizar la transparencia.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="rounded-2xl border-gray-200 overflow-hidden mb-6 shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Centro de Calificación</h3>
                </div>

                {/* Restaurant Section */}
                <div className="mb-10 pb-10 border-b border-gray-100">
                    <p className="text-base font-black text-gray-900 mb-1">¿Qué tal estuvo {restaurantName}?</p>
                    <p className="text-xs text-gray-400 mb-6 italic">Selecciona las estrellas para calificar el servicio general</p>
                    
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => {
                            const active = star <= (restaurantHover || restaurantRating)
                            return (
                                <button
                                    key={star}
                                    onMouseEnter={() => setRestaurantHover(star)}
                                    onMouseLeave={() => setRestaurantHover(0)}
                                    onClick={() => setRestaurantRating(star)}
                                    className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                                        active 
                                        ? 'bg-amber-100 text-amber-600 scale-110 shadow-md translate-y-[-2px]' 
                                        : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    <Star className={`h-8 w-8 transition-colors ${active ? 'fill-amber-600' : 'fill-transparent'}`} />
                                </button>
                            )
                        })}
                    </div>

                    <div className="relative group">
                        <MessageSquare className="absolute top-4 left-4 h-5 w-5 text-gray-400 group-focus-within:text-[var(--primary)] transition-colors" />
                        <textarea
                            value={restaurantComment}
                            onChange={(e) => setRestaurantComment(e.target.value)}
                            placeholder="Comparte tu experiencia con el restaurante... (opcional)"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-red-200 min-h-[100px] transition-all"
                        />
                    </div>
                </div>

                {/* Products Section */}
                <div className="space-y-10 mb-10">
                    <p className="text-base font-black text-gray-900 mb-6">Detalle de Productos</p>
                    {items.map((item) => (
                        <div key={item.productId} className="flex flex-col gap-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                            <div className="flex items-center gap-4">
                                {item.image && (
                                    <div className="h-14 w-14 rounded-xl overflow-hidden shadow-sm border border-white shrink-0">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm font-black text-gray-800 tracking-tight">{item.name}</span>
                                    <p className="text-[10px] text-gray-400 uppercase font-black">Tu calificación para este producto</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => {
                                    const active = star <= (productHovers[item.productId] || productRatings[item.productId]?.rating || 0)
                                    return (
                                        <button
                                            key={star}
                                            onMouseEnter={() => handleProductHoverChange(item.productId, star)}
                                            onMouseLeave={() => handleProductHoverChange(item.productId, 0)}
                                            onClick={() => handleProductRatingChange(item.productId, star)}
                                            className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                                                active 
                                                ? 'bg-amber-100 text-amber-500 scale-105 shadow-sm' 
                                                : 'bg-white text-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Star className={`h-5 w-5 ${active ? 'fill-amber-500' : 'fill-transparent'}`} />
                                        </button>
                                    )
                                })}
                            </div>

                            <textarea
                                value={productRatings[item.productId]?.comment}
                                onChange={(e) => handleProductCommentChange(item.productId, e.target.value)}
                                placeholder={`Opinión sobre ${item.name}...`}
                                className="w-full bg-white border border-gray-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-4 focus:ring-red-50 focus:border-red-100 min-h-[70px] transition-all"
                            />
                        </div>
                    ))}
                </div>

                {error && <p className="text-red-500 text-xs font-bold mb-4">{error}</p>}

                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[var(--primary)] hover:bg-red-600 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-red-200"
                >
                    {isSubmitting ? "Enviando..." : "Publicar Reseña"}
                    {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                </Button>
            </CardContent>
        </Card>
    )
}
