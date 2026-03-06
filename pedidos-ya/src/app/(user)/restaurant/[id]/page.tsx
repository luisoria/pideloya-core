import { Star, Clock, MapPin, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { MenuClient } from "./MenuClient"
import { getSession } from "@/lib/auth"
import { ReviewSection } from "./ReviewSection"
import { ClientImage } from "@/components/ui/ClientImage"
import { CouponBanner } from "./CouponBanner"

export default async function RestaurantPage({ params }: { params: { id: string } }) {
    const { id } = await params

    const restaurant: any = await (prisma as any).restaurant.findUnique({
        where: { id },
        include: {
            products: true,
            reviews: {
                include: { customer: true },
                orderBy: { createdAt: "desc" },
            }
        }
    })

    // Fetch coupons via raw query to bypass Prisma client sync issues for now
    let activeCoupons: any[] = []
    try {
        activeCoupons = await prisma.$queryRaw`SELECT * FROM "Coupon" WHERE status = 'ACTIVE' AND "restaurantId" = ${id}`
    } catch (e) {
        console.warn("Could not fetch coupons:", e)
    }
    restaurant.coupons = activeCoupons || []

    if (!restaurant) {
        return <div className="container py-20 text-center font-bold text-xl">Restaurante no encontrado.</div>
    }

    const session = await getSession()

    // Calculate avg rating
    const avgRating = restaurant.reviews.length > 0
        ? restaurant.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / restaurant.reviews.length
        : null

    // Check if user already reviewed
    const userReview = session
        ? restaurant.reviews.find((r: any) => r.customerId === session.id)
        : null

    // Check if user has a delivered order here (can review)
    const canReview = session?.role === "CUSTOMER" && !userReview
        ? !!(await (prisma as any).order.findFirst({
            where: {
                customerId: session.id,
                restaurantId: id,
                status: "DELIVERED"
            }
        }))
        : false

    return (
        <div className="pb-20">
            {/* Header Image */}
            <div className="h-56 md:h-72 w-full bg-gray-200 relative overflow-hidden">
                <ClientImage
                    src={restaurant.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"}
                    fallbackSrc="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80"
                    alt={restaurant.name}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 container">
                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{restaurant.name}</h1>
                            <div className="flex items-center gap-4 text-sm font-medium text-white/80 flex-wrap">
                                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <Star className="h-3.5 w-3.5 fill-current text-yellow-400" />
                                    {avgRating ? avgRating.toFixed(1) : "Nuevo"}
                                    {restaurant.reviews.length > 0 && (
                                        <span className="text-white/60 ml-0.5">
                                            ({restaurant.reviews.length} reseñas)
                                        </span>
                                    )}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> 20-35 min
                                </span>
                                <span className="flex items-center gap-1 text-green-300 font-semibold">
                                    Delivery Gratis
                                </span>
                            </div>
                        </div>
                        {/* Category pill */}
                        <span className="hidden md:flex items-center gap-1.5 bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full">
                            {restaurant.category}
                        </span>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1.5 mt-3 text-white/50 text-xs">
                        <MapPin className="h-3 w-3" />
                        {restaurant.address}
                    </div>
                </div>
            </div>

            <div className="container py-8">
                {/* Coupon Banner */}
                {restaurant.coupons.length > 0 && (
                    <div className="mb-8">
                        <CouponBanner coupon={restaurant.coupons[0]} />
                    </div>
                )}

                {/* Menu */}
                <h2 className="text-2xl font-black mb-6 border-l-4 border-[var(--primary)] pl-3 text-gray-900">
                    Nuestro Menú
                </h2>
                <MenuClient products={restaurant.products} restaurantId={restaurant.id} />

                {/* Reviews Section */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black border-l-4 border-yellow-400 pl-3 text-gray-900 flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Reseñas
                        </h2>
                        {avgRating && (
                            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star
                                                key={s}
                                                className={`h-3 w-3 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {restaurant.reviews.length} opiniones
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Review form */}
                    {canReview && (
                        <ReviewSection restaurantId={restaurant.id} />
                    )}

                    {/* Review list */}
                    {restaurant.reviews.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                            <Star className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Aún no hay reseñas</p>
                            <p className="text-gray-400 text-sm mt-1">Sé el primero en opinar</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {restaurant.reviews.map((review: any) => (
                                <div
                                    key={review.id}
                                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-black text-sm">
                                                {review.customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{review.customer.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(review.createdAt).toLocaleDateString("es-CL", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    className={`h-4 w-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
