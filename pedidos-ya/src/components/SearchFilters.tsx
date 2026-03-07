"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, useCallback } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"

const CATEGORIES = [
    { name: "Burgers", emoji: "🍔", db: "Burgers" },
    { name: "Pizza", emoji: "🍕", db: "Pizza" },
    { name: "Sushi", emoji: "🍣", db: "Sushi" },
    { name: "Pollo", emoji: "🍗", db: "Pollo" },
    { name: "Chilena", emoji: "🫔", db: "Chilena" },
    { name: "Saludable", emoji: "🥗", db: "Saludable" },
    { name: "Postres", emoji: "🍩", db: "Postres" },
]

export function SearchFilters({ initialSearch = "", initialCategory = "" }: {
    initialSearch?: string
    initialCategory?: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState(initialSearch)
    const [activeCategory, setActiveCategory] = useState(initialCategory)

    const updateParams = useCallback((newSearch: string, newCategory: string) => {
        const params = new URLSearchParams()
        if (newSearch) params.set("q", newSearch)
        if (newCategory) params.set("cat", newCategory)
        startTransition(() => {
            router.replace(`/?${params.toString()}`, { scroll: false })
        })
    }, [router])

    const handleSearch = (value: string) => {
        setSearch(value)
        updateParams(value, activeCategory)
    }

    const handleCategory = (cat: string) => {
        const next = activeCategory === cat ? "" : cat
        setActiveCategory(next)
        updateParams(search, next)
    }

    const handleClear = () => {
        setSearch("")
        setActiveCategory("")
        startTransition(() => {
            router.replace("/", { scroll: false })
        })
    }

    const hasFilters = search || activeCategory

    return (
        <div className="w-full">
            {/* Search bar */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-xl px-4 py-3 flex items-center gap-3 mb-5 hover:border-red-200 transition-colors group">
                <Search className={`h-5 w-5 shrink-0 transition-colors ${isPending ? "text-red-500 animate-pulse" : "text-gray-400 group-hover:text-red-500"}`} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Busca restaurantes, platos, categorías..."
                    className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent font-medium"
                />
                <div className="flex items-center gap-2">
                    {hasFilters && (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-1 py-1.5 px-3 rounded-full bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                            <X className="h-3 w-3" /> Limpiar
                        </button>
                    )}
                    <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                        <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Category pills */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.db
                    return (
                        <button
                            key={cat.db}
                            onClick={() => handleCategory(cat.db)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap shrink-0 transition-all duration-200 border-2 active:scale-95 shadow-sm
                                ${isActive ? "bg-[#CC0000] text-white border-[#CC0000] shadow-[#CC0000]/30 scale-105" : "bg-white text-gray-700 border-gray-200 hover:border-red-100 hover:bg-red-50/30"}
                            `}
                        >
                            <span className="text-base">{cat.emoji}</span>
                            {cat.name}
                        </button>
                    )
                })}
            </div>

            {/* Active filter badge */}
            {(search || activeCategory) && (
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 flex-wrap">
                    <span className="font-medium">Filtrando por:</span>
                    {search && (
                        <span className="bg-gray-100 px-3 py-1 rounded-full font-semibold text-gray-700">
                            &quot;{search}&quot;
                        </span>
                    )}
                    {activeCategory && (
                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-semibold">
                            {CATEGORIES.find(c => c.db === activeCategory)?.emoji} {activeCategory}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
