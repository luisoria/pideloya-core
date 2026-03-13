"use client"

import { useState } from "react"
import { ShoppingBag, Mail, Hash, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { sendRecoveryCode, verifyCode, resetPassword } from "../recovery-actions"

export default function RecoveryPage() {
    const [step, setStep] = useState(1) // 1: email, 2: code, 3: password
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSendEmail(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await sendRecoveryCode(email)
            setStep(2)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyCode(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await verifyCode(email, code)
            setStep(3)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirm) {
            setError("Las contraseñas no coinciden")
            return
        }
        if (password.length < 6) {
            setError("Mínimo 6 caracteres")
            return
        }
        setError(null)
        setLoading(true)
        try {
            await resetPassword(email, code, password)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
             <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
             <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600/10 rounded-full blur-3xl animate-pulse" />

            <div className="relative w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-600 shadow-lg mb-6 mx-auto">
                            <ShoppingBag className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Recuperar Acceso</h1>
                        <p className="text-white/60 text-base mt-2">
                            {step === 1 && "Ingresa tu correo para recibir un código"}
                            {step === 2 && "Ingresa el código que enviamos a tu mail"}
                            {step === 3 && "Crea tu nueva contraseña segura"}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-500/50 text-red-200 text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center">
                            <div className="mb-6 p-4 rounded-xl bg-green-900/30 border border-green-500/50 text-green-200 text-sm">
                                ✓ Contraseña actualizada correctamente
                            </div>
                            <Link href="/login" className="block w-full py-4 bg-white text-black rounded-xl font-black uppercase text-sm tracking-widest hover:scale-[1.02] transition-transform">
                                Ir al Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            {step === 1 && (
                                <form onSubmit={handleSendEmail} className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                        <input
                                            type="email"
                                            placeholder="Tu email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pr-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-red-500 transition-all font-medium"
                                            style={{ paddingLeft: "3.5rem" }}
                                        />
                                    </div>
                                    <button disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-red-500 transition-colors disabled:opacity-50">
                                        {loading ? "Enviando..." : "Enviar Código"}
                                    </button>
                                </form>
                            )}

                            {step === 2 && (
                                <form onSubmit={handleVerifyCode} className="space-y-4">
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                        <input
                                            type="text"
                                            placeholder="Código de 4 dígitos"
                                            required
                                            maxLength={4}
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pr-4 py-4 text-white text-center text-xl tracking-[10px] placeholder-white/30 focus:outline-none focus:border-red-500 transition-all font-black"
                                            style={{ paddingLeft: "3.5rem" }}
                                        />
                                    </div>
                                    <button disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-red-500 transition-colors disabled:opacity-50">
                                        Continuar
                                    </button>
                                </form>
                            )}

                            {step === 3 && (
                                <form onSubmit={handleReset} className="space-y-4">
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                        <input
                                            type={showPass ? "text" : "password"}
                                            placeholder="Nueva contraseña"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pr-12 py-4 text-white focus:outline-none focus:border-red-500 transition-all"
                                            style={{ paddingLeft: "3.5rem" }}
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                        <input
                                            type="password"
                                            placeholder="Repetir contraseña"
                                            required
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pr-4 py-4 text-white focus:outline-none focus:border-red-500 transition-all"
                                            style={{ paddingLeft: "3.5rem" }}
                                        />
                                    </div>
                                    <button disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-red-500 transition-colors disabled:opacity-50">
                                        {loading ? "Cambiando..." : "Cambiar Contraseña"}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <Link href="/login" className="text-white/40 text-sm hover:text-white transition-colors flex items-center justify-center gap-2 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
