"use client"

import { useState } from "react"
import Link from "next/link"
import { register } from "./actions"
import { User, Mail, Lock, Phone, Eye, EyeOff, ShoppingBag } from "lucide-react"

export default function RegisterPage() {
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const fd = new FormData(e.currentTarget)
            await register(fd)
        } catch (err: any) {
            // Next.js redirect() throws an error that should not be caught as a UI error
            if (err.message === "NEXT_REDIRECT") return;
            setError(err.message || "Error al registrarse")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center p-4">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="w-full flex flex-col items-center justify-center mx-auto text-center mb-8">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30 mb-4 mx-auto">
                            <ShoppingBag className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight text-center w-full">Crea tu cuenta</h1>
                        <p className="text-white/80 text-base mt-2 text-center w-full">Pide en tus restaurantes favoritos</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Name */}
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="name"
                                type="text"
                                placeholder="Tu nombre completo"
                                required
                                className="w-full bg-white/8 border border-white/20 rounded-xl pr-4 py-4 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all"
                                style={{ paddingLeft: "3.5rem", background: "rgba(255,255,255,0.08)", minHeight: "56px" }}
                            />
                        </div>

                        {/* Email */}
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

                        {/* Phone (optional) */}
                        <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="phone"
                                type="tel"
                                placeholder="+56 9 ... (opcional)"
                                className="w-full border border-white/20 rounded-xl pr-4 py-4 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                                style={{ paddingLeft: "3.5rem", background: "rgba(255,255,255,0.08)", minHeight: "56px" }}
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="password"
                                type={showPass ? "text" : "password"}
                                placeholder="Contraseña (mín. 6 caracteres)"
                                required
                                minLength={6}
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

                        {/* Confirm Password */}
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirma tu contraseña"
                                required
                                className="w-full border border-white/20 rounded-xl pr-12 py-4 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                                style={{ paddingLeft: "3.5rem", background: "rgba(255,255,255,0.08)", minHeight: "56px" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors"
                            >
                                {showConfirm ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                            </button>
                        </div>

                        {/* Terms */}
                        <label className="flex items-start gap-3 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                required
                                className="mt-1 w-5 h-5 rounded accent-red-500 cursor-pointer"
                            />
                            <span className="text-sm text-white/60 leading-relaxed">
                                Acepto los{" "}
                                <Link href="/terminos" target="_blank" className="text-white hover:text-red-400 font-bold transition-colors cursor-pointer">Términos y Condiciones</Link>
                                {" "}y la{" "}
                                <Link href="/privacidad" target="_blank" className="text-white hover:text-red-400 font-bold transition-colors cursor-pointer">Política de Privacidad</Link>
                            </span>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-black text-white text-base uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 mt-2"
                            style={{
                                background: loading
                                    ? "rgba(200,0,0,0.5)"
                                    : "linear-gradient(135deg, #CC0000, #ff2020)",
                                boxShadow: loading ? "none" : "0 8px 32px rgba(204,0,0,0.4)",
                                minHeight: "56px"
                            }}
                        >
                            {loading ? "Creando cuenta..." : "Crear mi cuenta"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-white/20" />
                        <span className="text-white/80 text-sm font-medium">¿Ya tienes cuenta?</span>
                        <div className="flex-1 h-px bg-white/20" />
                    </div>

                    <Link href="/login" className="block w-full">
                        <button className="w-full py-4 rounded-xl border border-white/20 text-white text-base font-black hover:bg-white/10 hover:border-white/40 transition-all" style={{ minHeight: "56px" }}>
                            Iniciar sesión
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
