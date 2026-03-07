"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { MapPin, Plus, Trash2, CheckCircle2, Home, Building2, ShieldCheck, Loader2 } from "lucide-react"
import { AddressForm } from "./AddressForm"
import { getAddresses, setDefaultAddress, deleteAddress } from "@/app/actions/addresses"

export function AddressManager() {
    const [view, setView] = useState<'list' | 'add'>('list')
    const [addresses, setAddresses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchAddresses = async () => {
        setLoading(true)
        try {
            const data = await getAddresses()
            setAddresses(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAddresses()
    }, [])

    const handleSetDefault = async (id: string) => {
        setUpdating(id)
        try {
            await setDefaultAddress(id)
            await fetchAddresses()
        } catch (err) {
            console.error(err)
        } finally {
            setUpdating(null)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta dirección?")) return
        setUpdating(id)
        try {
            await deleteAddress(id)
            await fetchAddresses()
        } catch (err) {
            console.error(err)
        } finally {
            setUpdating(null)
        }
    }

    if (loading && addresses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Loader2 className="h-10 w-10 text-gray-300 animate-spin" />
                <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando direcciones...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setView('list')}
                        className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${
                            view === 'list' ? "text-black border-b-2 border-black pb-1" : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        <Home className="h-4 w-4" /> Ver Mis Direcciones
                    </button>
                    <button 
                        onClick={() => setView('add')}
                        disabled={addresses.length >= 5}
                        className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${
                            view === 'add' ? "text-black border-b-2 border-black pb-1" : 
                            addresses.length >= 5 ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        <Plus className="h-4 w-4" /> Agregar Nueva Dirección
                    </button>
                </div>
                {addresses.length >= 5 && view === 'list' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
                         <ShieldCheck className="h-4 w-4 text-amber-600" />
                         <span className="text-[10px] font-black text-amber-700 uppercase">Límite alcanzado (5/5)</span>
                    </div>
                )}
            </div>

            {view === 'list' ? (
                <div className="space-y-4">
                    {addresses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                <Plus className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-bold mb-6">No tienes direcciones guardadas</p>
                            <Button 
                                onClick={() => setView('add')}
                                className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 font-black uppercase text-xs h-10"
                            >
                                Registrar mi primera dirección
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addresses.map((address) => (
                                <Card 
                                    key={address.id} 
                                    className={`relative overflow-hidden group cursor-pointer border-2 transition-all rounded-3xl ${
                                        address.isDefault ? "border-black shadow-lg shadow-gray-100" : "border-gray-100 bg-gray-50/50 hover:border-gray-200"
                                    }`}
                                    onClick={() => !address.isDefault && handleSetDefault(address.id)}
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors ${
                                                    address.isDefault ? "bg-black text-white" : "bg-white text-gray-400 border border-gray-100 group-hover:bg-gray-100"
                                                }`}>
                                                    {address.alias === 'Casa' ? <Home className="h-5 w-5" /> : 
                                                     address.alias === 'Oficina' ? <Building2 className="h-5 w-5" /> : 
                                                     <MapPin className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 flex items-center gap-2">
                                                        {address.alias}
                                                        {address.isDefault && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                                                    </h4>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{address.comuna}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(address.id)
                                                }}
                                                className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="text-gray-600 text-sm font-medium leading-relaxed">
                                            <p>{address.street} {address.number}</p>
                                            {address.apartment && <p className="text-xs text-gray-400">Apto/Depto: {address.apartment}</p>}
                                        </div>
                                        
                                        {address.isDefault && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Activa por defecto</span>
                                            </div>
                                        )}
                                        
                                        {updating === address.id && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
                                                <Loader2 className="h-6 w-6 text-black animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <AddressForm 
                    onSuccess={() => {
                        setView('list')
                        fetchAddresses()
                    }} 
                    onCancel={() => setView('list')} 
                />
            )}
        </div>
    )
}
