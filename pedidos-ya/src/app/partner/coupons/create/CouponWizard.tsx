"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { createCoupon } from "@/app/actions/coupons"
import {
    Tag, Percent, DollarSign, Truck, Gift, Star,
    ChevronRight, ChevronLeft, CalendarIcon, Clock
} from "lucide-react"

export function CouponWizard({ products }: { products: any[] }) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        type: "",
        value: 0,
        internalName: "",
        description: "",
        code: "",
        autoGenerateCode: true,
        minOrderAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalUsageLimit: "", // empty means unlimited
        userUsageLimit: "1", // 1 per user by default
        targetProductId: "",
        appliesToAll: true,
        restaurantSplit: 100
    })

    const types = [
        { id: "PERCENTAGE", title: "Porcentaje", icon: <Percent className="h-6 w-6 text-red-600" />, desc: "Descuento en % sobre el subtotal" },
        { id: "FIXED_AMOUNT", title: "Monto Fijo", icon: <DollarSign className="h-6 w-6 text-green-600" />, desc: "Descuento en $ sobre el subtotal" },
        { id: "FREE_SHIPPING", title: "Envío Gratis", icon: <Truck className="h-6 w-6 text-blue-600" />, desc: "El costo de delivery queda en $0" },
        { id: "TWO_FOR_ONE", title: "2x1", icon: <Tag className="h-6 w-6 text-purple-600" />, desc: "Paga 1, lleva 2 en producto seleccionado" },
        { id: "FREE_ITEM", title: "Producto Regalo", icon: <Gift className="h-6 w-6 text-pink-600" />, desc: "Gratis al superar un monto" },
        { id: "FIRST_ORDER", title: "Primera Orden", icon: <Star className="h-6 w-6 text-amber-500" />, desc: "Solo para clientes nuevos" }
    ]

    const handleSave = async (status: string) => {
        setLoading(true)
        setError("")

        const finalCode = formData.autoGenerateCode
            ? `PROMO${Math.floor(1000 + Math.random() * 9000)}`
            : formData.code.toUpperCase()

        const payload = {
            type: formData.type,
            value: Number(formData.value) || 0,
            internalName: formData.internalName || `${formData.type} - Auto`,
            description: formData.description,
            code: finalCode,
            minOrderAmount: Number(formData.minOrderAmount),
            startDate: new Date(formData.startDate),
            expirationDate: new Date(formData.expirationDate),
            totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : null,
            userUsageLimit: formData.userUsageLimit ? Number(formData.userUsageLimit) : null,
            appliesToAll: formData.appliesToAll,
            restaurantSplit: formData.restaurantSplit,
            status
        }

        if (formData.targetProductId) {
            payload.appliesToAll = false
                ; (payload as any).targetProducts = JSON.stringify([formData.targetProductId])
        }

        const res = await createCoupon(payload)

        setLoading(false)
        if (res?.error) {
            setError(res.error)
        } else {
            router.push("/partner/coupons")
        }
    }

    // Proyection calculation for summary
    const proyection = () => {
        let maxImpact = "Variable"
        const usages = Number(formData.totalUsageLimit) || 100 // Estimate 100 if unlimited
        if (formData.type === "FIXED_AMOUNT") {
            maxImpact = `$${(Number(formData.value) * usages).toLocaleString('es-CL')}`
        } else if (formData.type === "PERCENTAGE") {
            const avgTicket = 12000
            const discount = avgTicket * (Number(formData.value) / 100)
            maxImpact = `$${(discount * usages).toLocaleString('es-CL')} (basado en ticket prom. $12k)`
        }
        return { maxImpact, usages: formData.totalUsageLimit ? formData.totalUsageLimit : 'Ilimitados (proyección sobre 100)' }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header & Progress */}
            <div className="mb-8">
                <button onClick={() => router.back()} className="text-gray-400 font-bold uppercase text-sm mb-4 tracking-wide hover:text-gray-900">
                    ← Volver
                </button>
                <h1 className="text-2xl font-black text-gray-900 uppercase">Crear nuevo cupón</h1>

                <div className="flex items-center mt-6 gap-2">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? 'bg-red-600' : 'bg-gray-200'}`} />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs font-bold text-gray-400 uppercase">
                    <span className={step >= 1 ? 'text-red-600' : ''}>Tipo</span>
                    <span className={step >= 2 ? 'text-red-600' : ''}>Config</span>
                    <span className={step >= 3 ? 'text-red-600' : ''}>Reglas</span>
                    <span className={step >= 4 ? 'text-red-600' : ''}>Resumen</span>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold border border-red-200">
                    {error}
                </div>
            )}

            {/* Step 1: Type Selection */}
            {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-bold text-gray-900">Elige el tipo de descuento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {types.map(t => (
                            <div
                                key={t.id}
                                onClick={() => setFormData({ ...formData, type: t.id })}
                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.type === t.id ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border">{t.icon}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{t.title}</h3>
                                        <p className="text-gray-500 text-sm">{t.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Configuration */}
            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-bold text-gray-900">Configura el beneficio</h2>

                    <Card className="rounded-xl border shadow-sm">
                        <CardContent className="p-6 space-y-6">
                            {formData.type === "PERCENTAGE" && (
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Porcentaje de descuento</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range" min="5" max="60" step="5"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                            className="flex-1 accent-red-600"
                                        />
                                        <span className="text-2xl font-black text-gray-900">{formData.value}%</span>
                                    </div>
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-sm text-gray-600">
                                        💡 <span className="font-bold">Vista previa:</span> Un pedido de $10.000 quedaría en <span className="font-bold text-green-600">${(10000 - (10000 * formData.value / 100)).toLocaleString('es-CL')}</span>
                                    </div>
                                </div>
                            )}

                            {formData.type === "FIXED_AMOUNT" && (
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Monto a descontar (CLP)</label>
                                    <Input
                                        type="number"
                                        className="text-lg h-12 rounded-lg"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                        placeholder="Ej: 3000"
                                    />
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-sm text-gray-600">
                                        💡 Recuerda que el monto mínimo de pedido debe ser mayor a este descuento.
                                    </div>
                                </div>
                            )}

                            {(formData.type === "TWO_FOR_ONE" || formData.type === "FREE_ITEM") && (
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Selecciona el producto</label>
                                    <select
                                        className="w-full h-12 bg-white border border-gray-300 rounded-lg px-4 text-gray-900 font-medium outline-none focus:ring-2 focus:ring-red-600 mb-4"
                                        value={formData.targetProductId}
                                        onChange={(e) => setFormData({ ...formData, targetProductId: e.target.value })}
                                    >
                                        <option value="">-- Seleccionar producto --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {(formData.type === "FREE_SHIPPING" || formData.type === "FIRST_ORDER") && (
                                <div>
                                    <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                                        Este tipo de cupón no requiere configuración de valor específica. Parametrizaremos las reglas en el siguiente paso.
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t">
                                <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Nombre interno (solo para ti)</label>
                                <Input
                                    className="h-10 rounded-lg mb-4"
                                    value={formData.internalName}
                                    onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
                                    placeholder="Ej: Promo Verano 2026"
                                />

                                <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Descripción pública (para el cliente)</label>
                                <Input
                                    className="h-10 rounded-lg"
                                    maxLength={60}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ej: Activa tus sentidos con este descuento exclusivo."
                                />
                                <span className="text-xs text-gray-400 float-right mt-1">{formData.description.length}/60</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 3: Rules */}
            {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-bold text-gray-900">Reglas y Restricciones</h2>

                    <Card className="rounded-xl border shadow-sm">
                        <CardContent className="p-6 space-y-6">

                            {/* Code generation */}
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Código del cupón</label>
                                <div className="flex items-center gap-4 mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={formData.autoGenerateCode} onChange={() => setFormData({ ...formData, autoGenerateCode: true })} />
                                        <span className="text-sm font-bold">Autogenerar</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={!formData.autoGenerateCode} onChange={() => setFormData({ ...formData, autoGenerateCode: false })} />
                                        <span className="text-sm font-bold">Personalizado</span>
                                    </label>
                                </div>
                                {!formData.autoGenerateCode && (
                                    <Input
                                        className="h-10 rounded-lg font-mono uppercase"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Ej: PIZZA20"
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Monto mínimo (CLP)</label>
                                    <Input
                                        type="number" className="h-10 rounded-lg"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                        placeholder="Ej: 8000"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Límite usos totales</label>
                                    <Input
                                        type="number" className="h-10 rounded-lg"
                                        value={formData.totalUsageLimit}
                                        onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                                        placeholder="Ilimitado (dejar vacío)"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Fecha de inicio</label>
                                    <Input
                                        type="date" className="h-10 rounded-lg"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-400 uppercase mb-2 block">Fecha de expiración</label>
                                    <Input
                                        type="date" className="h-10 rounded-lg"
                                        value={formData.expirationDate}
                                        onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                                    />
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <h2 className="text-xl font-bold text-gray-900">Resumen y Activación</h2>

                    <Card className="rounded-xl border shadow-sm border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900 border border-gray-300 bg-white px-3 py-1 rounded inline-block font-mono mb-1">
                                    {formData.autoGenerateCode ? '[AUTOGENERADO]' : formData.code.toUpperCase()}
                                </h3>
                                <p className="text-sm text-gray-500">{formData.internalName}</p>
                            </div>
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                                {types.find(t => t.id === formData.type)?.title}
                            </span>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-8 text-sm">
                                <div>
                                    <span className="block text-gray-400 font-bold uppercase text-xs">Beneficio</span>
                                    <span className="font-bold text-gray-900">{formData.type === 'PERCENTAGE' ? `${formData.value}%` : formData.type === 'FIXED_AMOUNT' ? `$${formData.value}` : 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 font-bold uppercase text-xs">Pedido mínimo</span>
                                    <span className="font-bold text-gray-900">${formData.minOrderAmount}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 font-bold uppercase text-xs">Vigencia</span>
                                    <span className="font-bold text-gray-900">{formData.startDate} a {formData.expirationDate}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400 font-bold uppercase text-xs">Límites</span>
                                    <span className="font-bold text-gray-900">Total: {formData.totalUsageLimit || '∞'} | Por user: {formData.userUsageLimit || '∞'}</span>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                                <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                                    <DollarSign className="h-4 w-4" /> Proyección Financiera
                                </h4>
                                <p className="text-sm text-amber-800 mb-2">
                                    El descuento aplicado será absorbido 100% por el restaurante.
                                </p>
                                <p className="text-sm text-amber-900 font-bold">
                                    Costo estimado en {proyection().usages} usos: ~{proyection().maxImpact}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Sticky Next / Prev Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 lg:relative lg:border-t-0 lg:bg-transparent lg:p-0 lg:mt-8 flex gap-4 max-w-4xl mx-auto">
                {step > 1 && (
                    <Button variant="outline" className="h-12 flex-1 rounded-xl font-bold uppercase tracking-wide text-gray-600" onClick={() => setStep(step - 1)}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
                    </Button>
                )}

                {step < 4 ? (
                    <Button
                        className="h-12 flex-1 rounded-xl bg-gray-900 hover:bg-black text-white font-bold uppercase tracking-wide"
                        onClick={() => {
                            if (step === 1 && !formData.type) {
                                setError("Por favor selecciona un tipo de descuento.")
                                return
                            }
                            if (step === 2 && formData.type === "PERCENTAGE" && (!formData.value || formData.value < 5 || formData.value > 100)) {
                                setError("El porcentaje debe ser entre 5 y 100.")
                                return
                            }
                            setError("")
                            setStep(step + 1)
                        }}>
                        Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            disabled={loading}
                            onClick={() => handleSave("PAUSED")}
                            className="h-12 flex-1 rounded-xl border-gray-300 font-bold text-gray-600 uppercase tracking-wide"
                        >
                            Guardar Borrador
                        </Button>
                        <Button
                            disabled={loading}
                            onClick={() => handleSave("ACTIVE")}
                            className="h-12 flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wide flex items-center justify-center shadow-lg shadow-red-600/20"
                        >
                            {loading ? "Activando..." : "Activar Cupón"}
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
