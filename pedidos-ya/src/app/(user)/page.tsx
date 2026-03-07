import { Flame, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import { SearchFilters } from "@/components/SearchFilters"
import { getSession } from "@/lib/auth"
import { isRestaurantOpen } from "@/lib/utils"
import { RestaurantCard } from "@/components/RestaurantCard"

type PageProps = {
    searchParams: Promise<{ q?: string; cat?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
    const params = await searchParams
    const query = params.q?.trim().toLowerCase() || ""
    const category = params.cat?.trim() || ""

    const session = await getSession()

    // Fetch with dynamic filters
    const restaurants = await prisma.restaurant.findMany({
        where: {
            AND: [
                category ? { category: { contains: category } } : {},
                query
                    ? {
                        OR: [
                            { name: { contains: query } },
                            { category: { contains: query } },
                            { address: { contains: query } },
                        ]
                    }
                    : {},
            ]
        },
        include: {
            products: { take: 3 },
            reviews: true,
            favorites: true
        },
        orderBy: { name: "asc" }
    })

    const totalCount = await prisma.restaurant.count()

    // Get user favorites if logged in
    const userFavorites = session
        ? await prisma.favorite.findMany({ where: { userId: session.id } })
        : []
    const favIds = new Set(userFavorites.map(f => f.restaurantId))

    // Fetch coupons via raw query to bypass Prisma client sync issues for now
    let activeCoupons: any[] = []
    try {
        activeCoupons = await prisma.$queryRaw`SELECT * FROM "Coupon" WHERE status = 'ACTIVE'`
    } catch (e) {
        console.warn("Could not fetch coupons:", e)
    }

    // Calculate avg rating for each restaurant and attach coupons
    const restaurantsWithRating = restaurants.map(r => {
        const avgRating = r.reviews.length > 0
            ? r.reviews.reduce((sum: any, rev: any) => sum + rev.rating, 0) / r.reviews.length
            : null

        const rCoupons = activeCoupons.filter(c => c.restaurantId === r.id || c.restaurantId === null)
        const isOpen = isRestaurantOpen({ openTime: r.openTime, closeTime: r.closeTime, acceptingOrders: r.acceptingOrders })

        return { ...r, avgRating, reviewCount: r.reviews.length, isFavorite: favIds.has(r.id), coupons: rCoupons, isOpen }
    })

    // Promos mock data 
    const promos = [
        { emoji: "🔥", title: "2x1 en Empanadas", subtitle: "Solo hoy", gradient: "linear-gradient(135deg, #f97316, #dc2626)", restaurantName: "El Rincón de las Empanadas" },
        { emoji: "🍕", title: "Pizza Grande $9.990", subtitle: "Promo lunch", gradient: "linear-gradient(135deg, #eab308, #f97316)", restaurantName: "Pizza Hut Las Condes" },
        { emoji: "🍣", title: "Envío gratis +$15K", subtitle: "En Sushi Osaka", gradient: "linear-gradient(135deg, #14b8a6, #0891b2)", restaurantName: "Sushi Osaka Vitacura" },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* === HERO === */}
            <section
                className="relative overflow-hidden bg-gradient-to-br from-[#1a0000] via-[#3d0000] to-[#CC0000] min-h-[380px]"
            >
                {/* Decorative circles */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full" />
                <div className="absolute -bottom-32 -left-16 w-64 h-64 bg-yellow-400/10 rounded-full" />
                <div className="absolute top-12 right-1/3 w-4 h-4 bg-yellow-400 rounded-full opacity-60 animate-pulse" />
                <div className="absolute bottom-16 right-1/4 w-2 h-2 bg-white rounded-full opacity-40 animate-pulse" style={{ animationDelay: "1s" }} />

                <div className="container relative z-10 py-16 pb-20">
                    {/* Greeting */}
                    {session && (
                        <p className="text-white/60 text-sm font-medium mb-3 flex items-center gap-2">
                            <span>👋</span>
                            Hola, <span className="text-white font-bold">{session.name?.split(" ")[0]}</span>
                        </p>
                    )}

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-3">
                        ¿Qué vas a<br />
                        <span style={{ color: "#FFC107" }}>pedir hoy?</span> 🔥
                    </h1>
                    <p className="text-white/60 text-base mb-10 max-w-md">
                        +{totalCount} restaurantes · Santiago · Entrega en 20–45 min
                    </p>

                    {/* Search embedded in hero */}
                    <Suspense>
                        <SearchFilters initialSearch={query} initialCategory={category} />
                    </Suspense>
                </div>
            </section>

            {/* === PROMOS BANNER === */}
            <div className="container -mt-6 mb-8 relative z-20">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {promos.map((promo, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl p-4 text-white cursor-pointer hover:scale-[1.02] transition-transform duration-200 shadow-lg ${i === 0 ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                                i === 1 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                    'bg-gradient-to-br from-teal-500 to-cyan-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{promo.emoji}</span>
                                <div>
                                    <p className="font-black text-sm leading-tight">{promo.title}</p>
                                    <p className="text-white/70 text-xs font-medium">{promo.subtitle}</p>
                                    <p className="text-white/50 text-[10px] mt-0.5">{promo.restaurantName}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === RESULTS SECTION === */}
            <div className="container py-4 pb-16">

                {/* Stats bar */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            {query || category ? (
                                <>
                                    {restaurants.length} resultado{restaurants.length !== 1 ? "s" : ""}
                                    {query && <span className="text-gray-500 font-normal"> para &quot;{query}&quot;</span>}
                                </>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                    Restaurantes Destacados
                                </span>
                            )}
                        </h2>
                        {!query && !category && (
                            <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
                                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                Los más pedidos esta semana en Santiago
                            </p>
                        )}
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-semibold">
                        {restaurants.length} locales
                    </span>
                </div>

                {/* Empty state */}
                {restaurants.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-black text-gray-800 mb-2">Sin resultados</h3>
                        <p className="text-gray-500 max-w-sm">
                            No encontramos restaurantes que coincidan con tu búsqueda. Intenta con otro término o categoría.
                        </p>
                    </div>
                )}

                {/* Restaurant Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {restaurantsWithRating.map((restaurant) => (
                        <RestaurantCard 
                            key={restaurant.id} 
                            restaurant={restaurant} 
                            session={session} 
                        />
                    ))}
                </div>
            </div>

            {/* === FOOTER === */}
            <footer className="bg-gray-900 text-white">
                <div className="container py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Brand */}
                        <div className="md:col-span-1">
                            <h3 className="text-xl font-black mb-3">
                                Pídelo<span style={{ color: "#FFC107" }}>Ya</span>
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                La plataforma de delivery #1 de Santiago. Tus restaurantes favoritos a un click de distancia.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Descubre</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/" className="hover:text-white transition-colors">Restaurantes</Link></li>
                                <li><Link href="/?cat=Burgers" className="hover:text-white transition-colors">Hamburguesas</Link></li>
                                <li><Link href="/?cat=Pizza" className="hover:text-white transition-colors">Pizza</Link></li>
                                <li><Link href="/?cat=Sushi" className="hover:text-white transition-colors">Sushi</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Únete</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/registro-driver" className="hover:text-white transition-colors">Sé repartidor</Link></li>
                                <li><Link href="/registro" className="hover:text-white transition-colors">Registra tu restaurante</Link></li>
                                <li><Link href="/registro" className="hover:text-white transition-colors">Crear cuenta</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
                                <li><Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-xs">
                            © 2026 PídeloYa. Todos los derechos reservados. Santiago, Chile 🇨🇱
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-yellow-500" />
                                Hecho con ❤️ en Chile
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
