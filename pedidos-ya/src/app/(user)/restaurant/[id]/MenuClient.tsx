"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Plus } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"

export function MenuClient({ products, restaurantId }: { products: any[], restaurantId: string }) {
    const { addToCart, items } = useCart()

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-row overflow-hidden hover:border-[var(--primary)] transition-colors">
                        <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            const span = document.createElement('span');
                                            span.textContent = '🍔';
                                            parent.appendChild(span);
                                        }
                                    }}
                                />
                            ) : (
                                <span>🍔</span>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between p-0">
                            <CardHeader className="p-3 pb-0">
                                <CardTitle className="text-base">{product.name}</CardTitle>
                                <CardDescription className="text-xs line-clamp-2">{product.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-2 flex items-center justify-between">
                                <span className="font-bold">${product.price}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                                    onClick={() => addToCart({
                                        id: product.id,
                                        name: product.name,
                                        price: product.price,
                                        restaurantId: restaurantId
                                    })}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Floating Cart Button if items exist */}
            {items.length > 0 && (
                <div className="fixed bottom-6 left-0 right-0 p-4 flex justify-center z-50">
                    <Link href="/cart" className="inline-flex h-10 items-center justify-center text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 transition-colors shadow-lg rounded-full px-8 animate-in slide-in-from-bottom-5">
                        Ver Carrito ({items.length}) - ${(items.reduce((acc, item) => acc + item.price * item.quantity, 0)).toFixed(2)} USD
                    </Link>
                </div>
            )}
        </>
    )
}
