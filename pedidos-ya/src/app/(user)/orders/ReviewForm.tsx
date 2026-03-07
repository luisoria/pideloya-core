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
    const [restaurantRating, setRestaurantRating] = useState(5)
    const [restaurantComment, setRestaurantComment] = useState("")
    const [productRatings, setProductRatings] = useState<Record<string, { rating: number, comment: string }>>(
        items.reduce((acc, item) => ({ ...acc, [item.productId]: { rating: 5, comment: "" } }), {})
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

    const handleProductCommentChange = (productId: string, comment: string) => {
        setProductRatings(prev => ({
            ...prev,
            [productId]: { ...prev[productId], comment }
        }))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError("")

        const formattedProductReviews = Object.entries(productRatings).map(([productId, data]) => ({
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
                    <h3 className="text-xl font-black text-gray-900 mb-2">¡Gracias por tu opinión!</h3>
                    <p className="text-sm text-gray-600">Tus comentarios ayudan a mejorar la experiencia para todos.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="rounded-2xl border-gray-200 overflow-hidden mb-6">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Califica tu experiencia</h3>
                </div>

                {/* Restaurant Section */}
                <div className="mb-8 pb-8 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 mb-1">¿Qué tal estuvo {restaurantName}?</p>
                    <p className="text-xs text-gray-400 mb-4">Califica el servicio y la calidad general del local</p>
                    
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRestaurantRating(star)}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                                    restaurantRating >= star 
                                    ? 'bg-amber-100 text-amber-600 shadow-sm' 
                                    : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                <Star className={`h-6 w-6 ${restaurantRating >= star ? 'fill-amber-600' : ''}`} />
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <MessageSquare className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                        <textarea
                            value={restaurantComment}
                            onChange={(e) => setRestaurantComment(e.target.value)}
                            placeholder="Cuéntanos más sobre el restaurante... (opcional)"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Products Section */}
                <div className="space-y-8 mb-8">
                    <p className="text-sm font-bold text-gray-900 mb-4">Califica los productos</p>
                    {items.map((item) => (
                        <div key={item.productId} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                {item.image && (
                                    <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            </div>
                            
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleProductRatingChange(item.productId, star)}
                                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                                            productRatings[item.productId]?.rating >= star 
                                            ? 'bg-amber-50 text-amber-500' 
                                            : 'bg-gray-50 text-gray-300'
                                        }`}
                                    >
                                        <Star className={`h-4 w-4 ${productRatings[item.productId]?.rating >= star ? 'fill-amber-500' : ''}`} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={productRatings[item.productId]?.comment}
                                onChange={(e) => handleProductCommentChange(item.productId, e.target.value)}
                                placeholder={`¿Qué te pareció el ${item.name}?`}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 min-h-[60px]"
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
