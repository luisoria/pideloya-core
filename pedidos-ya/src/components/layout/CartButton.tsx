"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { useEffect, useState } from "react"

export function CartButton() {
    const { itemCount } = useCart()
    const [mounted, setMounted] = useState(false)

    // Hydration fix
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="relative p-2 text-gray-600">
                <ShoppingCart className="h-6 w-6" />
            </div>
        )
    }

    return (
        <Link 
            href="/cart" 
            className="relative p-2 text-gray-700 hover:text-[var(--primary)] transition-colors group"
            title="Ver mi carrito"
        >
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-[var(--primary)] text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm transform group-hover:scale-110 transition-transform">
                    {itemCount}
                </span>
            )}
        </Link>
    )
}
