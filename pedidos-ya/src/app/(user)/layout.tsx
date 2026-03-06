import { AppShell } from "@/components/layout/AppShell"
import { CartProvider } from "@/lib/cart-context"

export default function UserLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <CartProvider>
            <AppShell>
                {children}
            </AppShell>
        </CartProvider>
    )
}
