"use client"

import { useState } from "react"
import Link from "next/link"
import { login } from "./actions"
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from "lucide-react"

export default function LoginPage() {
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const fd = new FormData(e.currentTarget)
            await login(fd)
        } catch (err: any) {
            // Next.js redirect() throws an error that should not be caught as a UI error
            if (err.message === "NEXT_REDIRECT") return;
            setError(err.message || "Error al iniciar sesión")
            setLoading(false)
        }
    }

    async function quickLogin(email: string) {
        setError(null)
        setLoading(true)
        try {
            const fd = new FormData()
            fd.set("email", email)
            await login(fd)
        } catch (err: any) {
            // Next.js redirect() throws an error that should not be caught as a UI error
            if (err.message === "NEXT_REDIRECT") return;
            setError(err.message || "Error")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center p-4">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="w-full flex flex-col items-center justify-center mx-auto text-center mb-8">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30 mb-4 mx-auto">
                            <ShoppingBag className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight text-center w-full">
                            Pídelo<span style={{ color: "#FFC107" }}>Ya</span>
                        </h1>
                        <p className="text-white/80 text-base mt-2 text-center w-full">Inicia sesión en tu cuenta</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                required
                                className="w-full border border-white/20 rounded-xl pr-4 py-4 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                                style={{ paddingLeft: "3.5rem", background: "rgba(255,255,255,0.08)", minHeight: "56px" }}
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="password"
                                type={showPass ? "text" : "password"}
                                placeholder="Contraseña"
                                className="w-full border border-white/20 rounded-xl pr-12 py-4 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                                style={{ paddingLeft: "3.5rem", background: "rgba(255,255,255,0.08)", minHeight: "56px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors"
                            >
                                {showPass ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-2 rounded-xl font-black text-white text-base uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            style={{
                                background: "linear-gradient(135deg, #CC0000, #ff2020)",
                                boxShadow: "0 8px 32px rgba(204,0,0,0.4)",
                                minHeight: "56px"
                            }}
                        >
                            {loading ? "Entrando..." : "Iniciar sesión"}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-white/20" />
                        <span className="text-white/60 text-sm uppercase tracking-widest font-bold">Acceso rápido</span>
                        <div className="flex-1 h-px bg-white/20" />
                    </div>

                    {/* Quick Login Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {[
                            { label: "👤 Cliente", email: "customer@test.com" },
                            { label: "🍔 Burger King", email: "owner@test.com" },
                            { label: "🍕 Pizza Hut", email: "owner2@test.com" },
                            { label: "🚴 Driver", email: "driver@test.com" },
                            { label: "⚙️ Admin", email: "admin@test.com" },
                        ].map(({ label, email }) => (
                            <button
                                key={email}
                                onClick={() => quickLogin(email)}
                                disabled={loading}
                                className="py-3 px-4 rounded-xl border border-white/10 text-white/90 text-sm font-semibold hover:bg-white/10 hover:text-white hover:border-white/30 transition-all disabled:opacity-40"
                                style={{ background: "rgba(255,255,255,0.06)", minHeight: "48px" }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Register link */}
                    <div className="text-center mt-6">
                        <span className="text-white/90 text-base font-medium drop-shadow-sm">¿No tienes cuenta?</span>
                        <Link
                            href="/registro"
                            className="text-base font-black hover:opacity-80 transition-all underline decoration-2 underline-offset-4 ml-2"
                            style={{ color: "#ffffff", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                        >
                            Regístrate gratis
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
