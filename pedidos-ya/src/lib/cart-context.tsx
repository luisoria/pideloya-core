"use client"

import React, { createContext, useContext, useState } from "react"

export interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    restaurantId: string
    restaurantName?: string
    image?: string
    notes?: string
}

interface CartContextType {
    items: CartItem[]
    addToCart: (item: Omit<CartItem, "quantity" | "notes">) => boolean
    addManyToCart: (items: CartItem[]) => void
    removeFromCart: (itemId: string) => void
    removeFromRestaurant: (restaurantId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    updateNotes: (itemId: string, notes: string) => void
    clearCart: () => void
    clearAndAdd: (item: Omit<CartItem, "quantity" | "notes">) => void
    total: number
    itemCount: number
    couponCode: string | null
    discountAmount: number
    setCouponData: (code: string | null, discount: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [couponCode, setCouponCode] = useState<string | null>(null)
    const [discountAmount, setDiscountAmount] = useState<number>(0)

    const setCouponData = (code: string | null, discount: number) => {
        setCouponCode(code)
        setDiscountAmount(discount)
    }

    const resetCouponIfInvalid = () => {
        // Simple heuristic: if cart changes, just wipe the coupon to force re-validation
        if (couponCode) {
            setCouponCode(null)
            setDiscountAmount(0)
        }
    }

    const addToCart = (newItem: Omit<CartItem, "quantity" | "notes">) => {
        resetCouponIfInvalid()
        
        // CHECK: If cart has items from another restaurant, we don't allow adding mixed items
        const currentRestaurantId = items.length > 0 ? items[0].restaurantId : null
        if (currentRestaurantId && currentRestaurantId !== newItem.restaurantId) {
            // We return early and don't add. The UI should handle the notification/modal.
            return false
        }

        setItems((prev) => {
            const existing = prev.find((item) => item.id === newItem.id)
            if (existing) {
                return prev.map((item) =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { ...newItem, quantity: 1, notes: "" }]
        })
        return true
    }

    const clearAndAdd = (newItem: Omit<CartItem, "quantity" | "notes">) => {
        clearCart()
        setItems([{ ...newItem, quantity: 1, notes: "" }])
    }

    const removeFromCart = (itemId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== itemId))
    }

    const removeFromRestaurant = (restaurantId: string) => {
        setItems((prev) => prev.filter((item) => item.restaurantId !== restaurantId))
        // Reset coupon if it was for this restaurant
        setCouponCode(null)
        setDiscountAmount(0)
    }

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId)
            return
        }
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
            )
        )
    }

    const updateNotes = (itemId: string, notes: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === itemId ? { ...item, notes } : item
            )
        )
    }

    const clearCart = () => {
        setItems([])
        setCouponCode(null)
        setDiscountAmount(0)
    }

    const addManyToCart = (newItems: CartItem[]) => {
        setItems(newItems)
    }

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <CartContext.Provider value={{
            items, addToCart, addManyToCart, removeFromCart, removeFromRestaurant, updateQuantity, updateNotes, clearCart,
            total, itemCount, couponCode, discountAmount, setCouponData, clearAndAdd
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
