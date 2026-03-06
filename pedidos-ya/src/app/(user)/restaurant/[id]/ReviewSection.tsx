"use client"

import { Star, Send } from "lucide-react"
import { useState, useTransition } from "react"
import { submitReview } from "@/app/actions/reviews"

export function ReviewSection({ restaurantId }: { restaurantId: string }) {
    const [rating, setRating] = useState(0)
    const [hover, setHover] = useState(0)
    const [comment, setComment] = useState("")
    const [isPending, startTransition] = useTransition()
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = () => {
        if (rating === 0) {
            setError("Selecciona una calificación")
            return
        }
        setError(null)
        startTransition(async () => {
            try {
                await submitReview(restaurantId, rating, comment)
                setSubmitted(true)
            } catch (err: any) {
                setError(err.message || "Error al enviar reseña")
            }
        })
    }

    if (submitted) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <p className="font-bold text-green-700">¡Gracias por tu reseña!</p>
                <p className="text-sm text-green-600 mt-1">Tu opinión ayuda a otros usuarios</p>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                ¿Qué te pareció tu pedido?
            </h3>

            {error && (
                <div className="mb-4 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                    ⚠️ {error}
                </div>
            )}

            {/* Star rating picker */}
            <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                    <button
                        key={s}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(s)}
                        className="p-1 transition-transform hover:scale-110"
                    >
                        <Star
                            className={`h-8 w-8 transition-colors ${s <= (hover || rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                        />
                    </button>
                ))}
                {rating > 0 && (
                    <span className="ml-2 text-sm font-semibold text-gray-600">
                        {["", "Malo 😞", "Regular 😐", "Bueno 🙂", "Muy bueno 😊", "Excelente 🤩"][rating]}
                    </span>
                )}
            </div>

            {/* Comment */}
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos tu experiencia (opcional)..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none transition-all"
            />

            <button
                onClick={handleSubmit}
                disabled={isPending || rating === 0}
                className="mt-3 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                    background: rating > 0 ? "linear-gradient(135deg, #CC0000, #ff2020)" : "#ccc",
                    boxShadow: rating > 0 ? "0 4px 14px rgba(204,0,0,0.3)" : "none",
                }}
            >
                <Send className="h-4 w-4" />
                {isPending ? "Enviando..." : "Enviar Reseña"}
            </button>
        </div>
    )
}
