"use client"

import { useState } from "react"
import Link from "next/link"
import { register } from "./actions"
import { User, Mail, Lock, Phone, Eye, EyeOff, ShoppingBag, MapPin, Hash, Home, Globe, Flag, FileText, Navigation } from "lucide-react"

export default function RegisterPage() {
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Verification state
    const [email, setEmail] = useState("")
    const [emailVerified, setEmailVerified] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [verificationSent, setVerificationSent] = useState(false)
    const [verificationCode, setVerificationCode] = useState("")

    async function handleSendCode() {
        if (!email || !email.includes("@")) {
            setError("Ingresa un correo válido")
            return
        }
        setError(null)
        setVerifying(true)
        try {
            const res = await fetch("/api/registro/verify", {
                method: "POST",
                body: JSON.stringify({ action: "send", email }),
                headers: { "Content-Type": "application/json" }
            })
            const data = await res.json()
            if (res.ok) {
                setVerificationSent(true)
                // In dev mode, we might log the code or handle it
                console.log("Código enviado:", data._code)
            } else {
                setError(data.error || "Error al enviar el código")
            }
        } catch (_err) {
            setError("Error de conexión")
        } finally {
            setVerifying(false)
        }
    }

    async function handleCheckCode() {
        if (!verificationCode) return
        setError(null)
        setVerifying(true)
        try {
            const res = await fetch("/api/registro/verify", {
                method: "POST",
                body: JSON.stringify({ action: "check", email, code: verificationCode }),
                headers: { "Content-Type": "application/json" }
            })
            const data = await res.json()
            if (res.ok) {
                setEmailVerified(true)
            } else {
                setError(data.error || "Código incorrecto")
            }
        } catch (_err) {
            setError("Error de conexión")
        } finally {
            setVerifying(false)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!emailVerified) {
            setError("Debes verificar tu correo electrónico primero")
            return
        }
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center p-8">
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative w-full max-w-xl">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 shadow-2xl">
                    {/* Logo */}
                    <div className="w-full flex flex-col items-center justify-center text-center mb-10">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-xl shadow-red-500/40 mb-6 mx-auto">
                            <ShoppingBag className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Crea tu cuenta</h1>
                        <p className="text-white/80 text-base mt-2">Pide en tus restaurantes favoritos</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-10 px-6 py-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        {/* Email Verification Step or Name */}
                        <div className="flex flex-col gap-6">
                            <div className="relative">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={emailVerified || verificationSent}
                                    className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                    style={{ paddingLeft: "4rem" }}
                                />
                                {!emailVerified && !verificationSent && (
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={verifying || !email}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                                    >
                                        Validar
                                    </button>
                                )}
                                {emailVerified && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-green-400 font-bold text-sm">
                                        ✓ Verificado
                                    </div>
                                )}
                            </div>

                            {verificationSent && !emailVerified && (
                                <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="relative flex-1">
                                        <Hash className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                        <input
                                            type="text"
                                            placeholder="Ingresa el código de 4 dígitos"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-4 text-white placeholder-white/50 text-sm focus:outline-none focus:border-red-400 focus:bg-white/10 transition-all font-medium min-h-[56px]"
                                            style={{ paddingLeft: "4rem" }}
                                            maxLength={4}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCheckCode}
                                        disabled={verifying || verificationCode.length < 4}
                                        className="px-6 bg-red-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest disabled:opacity-50"
                                    >
                                        Verificar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Hidden part until verified or partially shown */}
                        <div className={`flex flex-col gap-8 transition-all duration-500 ${emailVerified ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
                            {/* Name */}
                            <div className="relative">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="Tu nombre completo"
                                    required={emailVerified}
                                    className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                    style={{ paddingLeft: "4rem" }}
                                />
                            </div>

                        {/* Phone (mandatory) */}
                        <div className="relative">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="phone"
                                type="tel"
                                placeholder="Móvil (ej: +56 9 1234 5678)"
                                required
                                className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                style={{ paddingLeft: "4rem" }}
                            />
                        </div>

                        <div className="pt-6 border-t border-white/10 mt-2 pb-2">
                            <p className="text-white/60 text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                <MapPin className="h-4 w-4" /> Dirección de Domicilio
                            </p>
                        </div>

                        {/* Street & Number */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 relative">
                                <Navigation className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                                <input
                                    name="street"
                                    type="text"
                                    placeholder="Avenida o Calle"
                                    required
                                    className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                    style={{ paddingLeft: "4rem" }}
                                />
                            </div>
                            <div className="relative">
                                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                                <input
                                    name="number"
                                    type="text"
                                    placeholder="Nº"
                                    required
                                    className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                    style={{ paddingLeft: "3.5rem" }}
                                />
                            </div>
                        </div>

                        {/* Apartment & Comuna */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="relative">
                                <Home className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                                <input
                                    name="apartment"
                                    type="text"
                                    placeholder="Casa o Depto"
                                    required
                                    className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                    style={{ paddingLeft: "4rem" }}
                                />
                            </div>
                            <div className="relative">
                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                                <input
                                    name="comuna"
                                    type="text"
                                    placeholder="Comuna"
                                    required
                                    className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                    style={{ paddingLeft: "4rem" }}
                                />
                            </div>
                        </div>

                        {/* Reference & Notes */}
                        <div className="flex flex-col gap-6">
                            <div className="relative">
                                <Flag className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                                <input
                                    name="reference"
                                    type="text"
                                    placeholder="Punto de referencia (opcional)"
                                    className="w-full bg-white/5 border border-white/20 rounded-2xl pr-4 py-5 text-white placeholder-white/50 text-sm focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[58px]"
                                    style={{ paddingLeft: "4rem" }}
                                />
                            </div>
                            <div className="relative">
                                <FileText className="absolute left-6 top-6 h-6 w-6 text-white/40" />
                                <textarea
                                    name="notes"
                                    placeholder="Observaciones adicionales (opcional)"
                                    className="w-full bg-white/5 border border-white/20 rounded-2xl pr-5 py-5 text-white placeholder-white/50 text-sm focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium resize-none min-h-[120px]"
                                    style={{ paddingLeft: "4rem" }}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 mt-2 pb-2">
                            <p className="text-white/60 text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                <Lock className="h-4 w-4" /> Seguridad
                            </p>
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="password"
                                type={showPass ? "text" : "password"}
                                placeholder="Contraseña (mín. 6 caracteres)"
                                required
                                minLength={6}
                                className="w-full bg-white/5 border border-white/20 rounded-2xl pr-12 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                style={{ paddingLeft: "4rem" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors"
                            >
                                {showPass ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
                            <input
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                placeholder="Confirma tu contraseña"
                                required
                                className="w-full bg-white/5 border border-white/20 rounded-2xl pr-12 py-5 text-white placeholder-white/50 text-base focus:outline-none focus:border-red-400 focus:bg-white/10 focus:ring-1 focus:ring-red-400 transition-all font-medium min-h-[64px]"
                                style={{ paddingLeft: "4rem" }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors"
                            >
                                {showConfirm ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                            </button>
                        </div>

                        {/* Terms */}
                        <label className="flex items-start gap-4 cursor-pointer mt-2 px-1">
                            <input
                                type="checkbox"
                                required
                                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 accent-red-500 cursor-pointer"
                            />
                            <span className="text-sm text-white/60 leading-relaxed">
                                Acepto los{" "}
                                <Link href="/terminos" target="_blank" className="text-white hover:text-red-400 font-bold transition-colors">Términos y Condiciones</Link>
                                {" "}y la{" "}
                                <Link href="/privacidad" target="_blank" className="text-white hover:text-red-400 font-bold transition-colors">Política de Privacidad</Link>
                            </span>
                        </label>

                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !emailVerified}
                            className={`w-full py-4 rounded-xl font-black text-white text-base uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 mt-4 min-h-[60px] shadow-lg ${
                                loading ? "bg-red-900/50" : "bg-gradient-to-r from-red-600 to-red-500 shadow-red-600/20"
                            }`}
                        >
                            {loading ? "Creando cuenta..." : "Crear mi cuenta"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-10">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/40 text-sm font-medium">¿Ya tienes cuenta?</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <Link href="/login" className="block w-full">
                        <button className="w-full py-4 rounded-xl border border-white/10 text-white text-base font-black hover:bg-white/5 hover:border-white/20 transition-all min-h-[56px]">
                            Iniciar sesión
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
