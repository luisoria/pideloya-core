'use client'

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Star, Clock, Zap, Bike, UtensilsCrossed } from "lucide-react"
import { ClientImage } from "@/components/ui/ClientImage"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { ToggleFavorite } from "@/components/ToggleFavorite"

interface RestaurantCardProps {
    restaurant: any;
    session: any;
}

export function RestaurantCard({ restaurant, session }: RestaurantCardProps) {
    const router = useRouter()
    const [showClosedModal, setShowClosedModal] = React.useState(false)

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't intercept if clicking the favorite button
        if ((e.target as HTMLElement).closest('.favorite-btn')) {
            return
        }

        if (!restaurant.isOpen) {
            e.preventDefault()
            setShowClosedModal(true)
        } else {
            router.push(`/restaurant/${restaurant.id}`)
        }
    }

    return (
        <>
            <div 
                onClick={handleCardClick}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-red-100 transition-all duration-300 h-full flex flex-col relative cursor-pointer"
            >
                {/* Favorite button */}
                {session && (
                    <div className="absolute top-3 right-3 z-20 favorite-btn">
                        <ToggleFavorite
                            restaurantId={restaurant.id}
                            isFavorite={restaurant.isFavorite}
                        />
                    </div>
                )}

                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <ClientImage
                        src={restaurant.image}
                        fallbackSrc="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"
                        alt={restaurant.name}
                        className={cn(
                            "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
                            !restaurant.isOpen && "grayscale brightness-75 transition-all"
                        )}
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Badges container */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                        {!restaurant.isOpen && (
                            <span className="bg-red-600/90 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 animate-pulse">
                                <Clock className="h-3 w-3" /> Cerrado
                            </span>
                        )}
                        <span className="bg-white/95 text-gray-800 text-xs font-bold shadow-sm px-2.5 py-1 rounded-full">
                            {restaurant.category}
                        </span>
                        {restaurant.coupons?.length > 0 && (
                            <span
                                className="bg-red-600 text-white text-xs font-bold shadow-lg px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide"
                                title={restaurant.coupons[0].description || "Aprovecha este descuento"}
                            >
                                <span>🏷️</span> Cupón Disponible
                            </span>
                        )}
                    </div>

                    {/* Rating badge */}
                    <div className="absolute bottom-3 left-3">
                        <div className="flex items-center gap-1 text-xs font-bold bg-green-500 text-white px-2.5 py-1 rounded-full shadow-md">
                            <Star className="h-3 w-3 fill-current" />
                            {restaurant.avgRating ? restaurant.avgRating.toFixed(1) : "Nuevo"}
                            {restaurant.reviewCount > 0 && (
                                <span className="text-white/70 font-medium ml-0.5">
                                    ({restaurant.reviewCount})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Delivery time on hover */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1.5 text-xs text-white font-semibold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Zap className="h-3 w-3" />
                            20-35 min
                        </div>
                    </div>
                </div>

                {/* Info Content */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-black text-gray-900 text-base leading-tight group-hover:text-red-600 transition-colors uppercase italic tracking-tighter">
                            {restaurant.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> 20–35 min
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="flex items-center gap-1 text-green-600">
                            <Bike className="h-3 w-3" /> Envío gratis
                        </span>
                    </div>

                    {/* Mini product preview */}
                    {restaurant.products?.length > 0 && (
                        <div className="mt-auto pt-3 border-t border-gray-50">
                            <p className="text-[10px] text-gray-400 font-bold mb-1.5 flex items-center gap-1 uppercase tracking-widest">
                                <UtensilsCrossed className="h-2.5 w-2.5" />
                                Más pedido
                            </p>
                            <p className="text-xs text-gray-600 font-bold truncate">
                                {restaurant.products[0].name}
                                <span className="text-green-600 ml-2">
                                    ${restaurant.products[0].price.toLocaleString("es-CL")}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Closed Notification Modal */}
            <Modal
                isOpen={showClosedModal}
                onClose={() => setShowClosedModal(false)}
                title="Restaurante Cerrado"
                footer={
                    <Button 
                        className="w-full bg-red-600 text-white font-bold" 
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
                    <h4 className="text-lg font-black text-gray-900 mb-2 italic">¡VUELVE PRONTO!</h4>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        <strong>{restaurant.name}</strong> se encuentra fuera de su horario de atención. 
                        Digitalizamos tu apetito, pero respestamos los tiempos de cocción de nuestros aliados.
                    </p>
                    <div className="bg-gray-50 w-full p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Horario de Hoy</span>
                        </div>
                        <span className="text-sm font-black text-red-600">{restaurant.openTime} - {restaurant.closeTime}</span>
                    </div>
                </div>
            </Modal>
        </>
    )
}
