'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Lock, FileCheck, Download, AlertCircle, QrCode } from 'lucide-react'

export default function ContratoPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [app, setApp] = useState<any>(null)
    const [password, setPassword] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        if (!id) return
        // Cargar datos básicos (sin contenido sensible)
        fetch(`/api/driver-applications?id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.id) setApp(data)
                else setError('Contrato no encontrado')
            })
            .catch(() => setError('Error al cargar información'))
    }, [id])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // En una app real usaríamos una ruta de login dedicada
            // Aquí compararemos contra el hash o el campo password si lo tuviéramos
            // Por simplicidad para el demo, validaremos vía API
            const res = await fetch('/api/driver/contract/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, password })
            })
            const data = await res.json()

            if (res.ok) {
                setIsAuthenticated(true)
            } else {
                setError(data.error || 'Contraseña incorrecta')
            }
        } catch (e) {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-900">{error}</h1>
                <button onClick={() => router.push('/registro-driver')} className="mt-6 text-[var(--primary)] font-bold">Volver al inicio</button>
            </div>
        </div>
    )

    if (!isAuthenticated) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="h-16 w-16 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
                        <Lock className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase italic">Acceso Seguro</h1>
                    <p className="text-gray-500 text-sm mt-2">Para ver y descargar tu contrato, ingresa la contraseña que creaste al momento de registrarte.</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contraseña de Registro</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--primary)] text-white font-black py-4 rounded-xl shadow-lg shadow-red-200 hover:bg-red-800 transition-all uppercase tracking-widest text-sm"
                    >
                        {loading ? 'Verificando...' : 'Acceder al Contrato'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-8">
                    ¿Olvidaste tu contraseña? <button onClick={() => router.push('/registro-driver/recuperar')} className="text-[var(--primary)] font-bold">Recupérala aquí</button>
                </p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Contrato Content */}
                    <div className="flex-1 bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-200">
                        <div className="flex justify-between items-start mb-8 border-b pb-6">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">CONTRATO DE SERVICIOS</h1>
                                <p className="text-gray-400 text-xs mt-1 uppercase font-bold tracking-widest">Documento Firmado Electrónicamente</p>
                            </div>
                            <FileCheck className="h-10 w-10 text-green-500" />
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-700 italic font-serif leading-relaxed mb-12" style={{ whiteSpace: 'pre-wrap' }}>
                            {/* Aquí iría el CONTRACT_BODY dinámico */}
                            En Santiago de Chile, se celebra el presente contrato entre PIDELOYA SPA y el Driver {app?.firstName} {app?.lastNameP}.

                            ... (Contenido legal simplificado para el demo) ...

                            1. OBJETO: Servicios de reparto independiente.
                            2. VIGENCIA: Indefinida.
                        </div>

                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 relative">
                            <div className="absolute -top-3 left-6 bg-white px-3 text-[10px] font-black text-gray-400 uppercase tracking-tighter">Validación de Firma</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Firmante</p>
                                    <p className="font-bold text-gray-900 leading-tight">{app?.firstName} {app?.lastNameP} {app?.lastNameM}</p>
                                    <p className="text-xs text-gray-500 mt-1">RUT: {app?.rut}</p>
                                    <p className="text-xs text-gray-500">Fecha: {new Date(app?.contractSignedAt).toLocaleString('es-CL')}</p>
                                </div>
                                <div className="md:border-l md:pl-6">
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Hash de Seguridad (VES)</p>
                                    <p className="font-mono text-[10px] break-all text-gray-600 mb-2">{app?.contractSignatureHash}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-400">CÓDIGO:</span>
                                        <span className="text-xl font-mono font-black text-[var(--primary)] bg-red-50 px-2 rounded">{app?.contractValidationCode}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="w-full md:w-80 space-y-4">
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-200 text-center">
                            <div className="bg-gray-100 rounded-2xl p-4 mb-4">
                                <QrCode className="h-32 w-32 mx-auto text-gray-900" />
                            </div>
                            <h3 className="font-bold text-gray-900 leading-tight">Validador QR</h3>
                            <p className="text-xs text-gray-500 mt-2">Escanea este código para validar la autenticidad de este contrato en cualquier momento.</p>
                        </div>

                        <button className="w-full bg-[var(--primary)] text-white font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                            <Download className="h-4 w-4" /> Descargar PDF
                        </button>

                        <button
                            onClick={() => router.push('/registro-driver')}
                            className="w-full bg-white text-gray-600 font-bold py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all text-xs"
                        >
                            Volver al Portal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
