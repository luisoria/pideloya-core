"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Home, Building2, MapPin, Loader2, Plus, ChevronLeft } from "lucide-react"
import { addAddress } from "@/app/actions/addresses"

interface AddressFormProps {
    onSuccess: () => void
    onCancel: () => void
}

const COMUNAS = [
    "Santiago Centro",
    "Providencia",
    "Las Condes",
    "Ñuñoa",
    "Vitacura",
    "Lo Barnechea",
    "La Reina",
    "Peñalolén",
    "Macul",
    "San Miguel",
    "Maipú",
    "La Florida"
]

export function AddressForm({ onSuccess, onCancel }: AddressFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [alias, setAlias] = useState("Casa")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.append("alias", alias)

        try {
            await addAddress(formData)
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-6">
                <button 
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-black uppercase tracking-tight">Agregar Nueva Dirección</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold animate-shake">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                            Tipo de Dirección
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {["Casa", "Oficina", "Otro"].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setAlias(type)}
                                    className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 transition-all font-bold text-sm ${
                                        alias === type 
                                        ? "border-black bg-black text-white" 
                                        : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                                    }`}
                                >
                                    {type === "Casa" && <Home className="h-4 w-4" />}
                                    {type === "Oficina" && <Building2 className="h-4 w-4" />}
                                    {type === "Otro" && <MapPin className="h-4 w-4" />}
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center">
                            <span className="text-red-500 mr-1">*</span> Comuna:
                        </label>
                        <select 
                            name="comuna" 
                            required
                            className="w-full h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 text-sm font-medium focus:border-black transition-all outline-none appearance-none"
                        >
                            <option value="">Seleccione una comuna</option>
                            {COMUNAS.map(comuna => (
                                <option key={comuna} value={comuna}>{comuna}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center">
                            <span className="text-red-500 mr-1">*</span> Calle:
                        </label>
                        <Input 
                            name="street" 
                            placeholder="Calle" 
                            required 
                            className="h-12 border-2 border-gray-100 focus:border-black rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center">
                                <span className="text-red-500 mr-1">*</span> Numero:
                            </label>
                            <Input 
                                name="number" 
                                placeholder="Número" 
                                required 
                                className="h-12 border-2 border-gray-100 focus:border-black rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                                Depto (opcional):
                            </label>
                            <Input 
                                name="apartment" 
                                placeholder="Depto (opcional)" 
                                className="h-12 border-2 border-gray-100 focus:border-black rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                <Button 
                    type="submit" 
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-100 disabled:opacity-50 transition-all uppercase tracking-tight"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "CONTINUAR"}
                </Button>
            </form>
        </div>
    )
}
