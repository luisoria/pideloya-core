"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { AlertCircle, MapPin, Camera, Loader2 } from "lucide-react"
import { reportDeliveryIncident } from "@/app/actions/qa-messaging"

interface Props {
    orderId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function QAIncidentModal({ orderId, isOpen, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState("IMPOSSIBLE_DELIVERY")
    const [description, setDescription] = useState("")

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // QA: Simular captura de ubicación real
            // En producción usaríamos navigator.geolocation.getCurrentPosition
            const lat = -33.4372 + (Math.random() * 0.01)
            const lon = -70.6506 + (Math.random() * 0.01)

            const res = await reportDeliveryIncident(orderId, type, description, lat, lon)
            if (res.success) {
                alert("Incidencia reportada. La ubicación ha sido capturada y la orden será re-asignada.")
                onSuccess()
                onClose()
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert("Error al reportar la incidencia.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reportar Incidencia Crítica">
            <div className="p-4 space-y-4">
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <p className="text-xs text-red-700">
                        Esta acción detendrá tu entrega actual. Tu ubicación será capturada para que otro repartidor pueda recoger el pedido desde tu punto actual.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Tipo de Incidencia</label>
                    <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500"
                    >
                        <option value="IMPOSSIBLE_DELIVERY">No puedo entregar (Dirección inaccesible)</option>
                        <option value="VEHICLE_BREAKDOWN">Avería del vehículo</option>
                        <option value="ACCIDENT">Accidente</option>
                        <option value="OTHER">Otro motivo urgente</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400">Descripción detallada</label>
                    <textarea 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[100px] outline-none focus:border-red-500"
                        placeholder="Explica brevemente qué sucedió..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Ubicación GPS será capturada</span>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
                    <Button 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black"
                        onClick={handleSubmit}
                        disabled={loading || !description}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                        DISPARAR ALERTA
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
