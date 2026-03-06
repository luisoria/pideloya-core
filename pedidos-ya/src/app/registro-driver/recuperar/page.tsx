'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Mail, Key, CheckCircle } from 'lucide-react'

export default function RecuperarPage() {
    const router = useRouter()
    const [step, setStep] = useState(1) // 1: Email/RUT, 2: Code, 3: New Password
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({ email: '', rut: '', code: '', password: '', confirm: '' })

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        // Mock API call to send code
        setTimeout(() => {
            setStep(2)
            setLoading(false)
        }, 1500)
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Mock validation
        setTimeout(() => {
            setStep(3)
            setLoading(false)
        }, 1000)
    }

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (form.password !== form.confirm) {
            setError('Las contraseñas no coinciden')
            return
        }
        setLoading(true)
        // Mock reset
        setTimeout(() => {
            setStep(4)
            setLoading(false)
        }, 1500)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                {step === 1 && (
                    <>
                        <div className="text-center mb-8">
                            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-100">
                                <ShieldAlert className="h-8 w-8" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase">Recuperar Acceso</h1>
                            <p className="text-gray-500 text-sm mt-2">Ingresa tus datos para recibir un código de validación en tu correo.</p>
                        </div>
                        <form onSubmit={handleRequest} className="space-y-4">
                            <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Email Registrado" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                            <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="RUT (sin puntos ni guión)" value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} required />
                            <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all uppercase text-sm">
                                {loading ? 'Enviando...' : 'Enviar Código de Reseteo'}
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="text-center mb-8">
                            <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-amber-100">
                                <Mail className="h-8 w-8" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase">Validar Código</h1>
                            <p className="text-gray-500 text-sm mt-2">Hemos enviado un código a {form.email}</p>
                        </div>
                        <form onSubmit={handleVerify} className="space-y-4">
                            <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-amber-500 outline-none" placeholder="0000" maxLength={4} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                            <button className="w-full bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-amber-700 transition-all uppercase text-sm">
                                {loading ? 'Validando...' : 'Verificar Código'}
                            </button>
                        </form>
                    </>
                )}

                {step === 3 && (
                    <>
                        <div className="text-center mb-8">
                            <div className="h-16 w-16 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
                                <Key className="h-8 w-8" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase">Nueva Contraseña</h1>
                        </div>
                        <form onSubmit={handleReset} className="space-y-4">
                            <input type="password" name="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--primary)] outline-none" placeholder="Nueva Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                            <input type="password" name="confirm" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--primary)] outline-none" placeholder="Confirmar Contraseña" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
                            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                            <button className="w-full bg-[var(--primary)] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-800 transition-all uppercase text-sm">
                                {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                            </button>
                        </form>
                    </>
                )}

                {step === 4 && (
                    <div className="text-center py-6">
                        <div className="h-20 w-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
                            <CheckCircle className="h-10 w-10" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase mb-2">¡Listo!</h1>
                        <p className="text-gray-500 text-sm mb-8">Tu contraseña ha sido actualizada exitosamente. Ya puedes volver al portal.</p>
                        <button onClick={() => router.push('/registro-driver')} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-xl">
                            Volver al Portal
                        </button>
                    </div>
                )}

                <button onClick={() => router.back()} className="mt-8 text-center w-full text-gray-400 text-sm hover:text-gray-600">Cancelar y volver</button>
            </div>
        </div>
    )
}
