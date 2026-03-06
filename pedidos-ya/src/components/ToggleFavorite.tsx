"use client"

import { Heart } from "lucide-react"
import { useState, useTransition } from "react"
import { toggleFavorite } from "@/app/actions/favorites"

export function ToggleFavorite({ restaurantId, isFavorite }: { restaurantId: string; isFavorite: boolean }) {
    const [fav, setFav] = useState(isFavorite)
    const [isPending, startTransition] = useTransition()

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setFav(!fav)
        startTransition(async () => {
            try {
                await toggleFavorite(restaurantId)
            } catch {
                setFav(fav) // revert on error
            }
        })
    }

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-all duration-200 hover:scale-110 active:scale-95"
            title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
            <Heart
                className={`h-4 w-4 transition-colors duration-200 ${fav
                        ? "fill-red-500 text-red-500"
                        : "text-gray-400 hover:text-red-400"
                    }`}
            />
        </button>
    )
}
