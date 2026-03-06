import Link from "next/link"
import { ShoppingBag, Menu } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getSession } from "@/lib/auth"
import { UserMenu } from "./UserMenu"

export async function Navbar() {
    const session = await getSession()

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-[var(--background)]/95 backdrop-blur">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] opacity-80"></div>
                            <ShoppingBag className="h-5 w-5 relative z-10 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-[var(--foreground)] uppercase">
                            Pídelo<span className="text-[var(--secondary)]">Ya</span>
                        </span>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-[var(--primary)]">
                        Restaurantes
                    </Link>
                    {session?.role === "CUSTOMER" && (
                        <>
                            <Link href="/orders" className="transition-colors hover:text-[var(--primary)]">
                                Mis Pedidos
                            </Link>
                            <Link href="/profile" className="transition-colors hover:text-[var(--primary)]">
                                Mi Perfil
                            </Link>
                        </>
                    )}
                    {session?.role === "RESTAURANT" && (
                        <Link href="/restaurant" className="transition-colors hover:text-[var(--primary)]">
                            Partner Hub
                        </Link>
                    )}
                    {session?.role === "DRIVER" && (
                        <Link href="/driver" className="transition-colors hover:text-[var(--primary)]">
                            Rider
                        </Link>
                    )}
                    {session?.role === "ADMIN" && (
                        <>
                            <Link href="/admin" className="transition-colors hover:text-[var(--primary)]">
                                Admin
                            </Link>
                            <Link href="/backoffice" className="transition-colors hover:text-[var(--primary)] font-bold">
                                Backoffice OPs
                            </Link>
                        </>
                    )}
                </nav>

                <div className="flex items-center gap-4">
                    {session ? (
                        <UserMenu user={session} />
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-md text-sm font-semibold hover:bg-[var(--secondary)] hover:text-[var(--secondary-foreground)] h-9 px-4 py-2 transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                            <Link
                                href="/registro"
                                className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-[var(--primary)] hover:bg-red-700 text-white shadow-md hover:shadow-red-200 transition-all h-9 px-4 py-2"
                            >
                                Registrarse
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
