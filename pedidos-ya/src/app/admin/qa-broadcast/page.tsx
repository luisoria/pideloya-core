"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Megaphone, Send, Users, MapPin, Loader2, Globe } from "lucide-react"
import { broadcastToDrivers } from "@/app/actions/qa-messaging"

export default function QABroadcastPage() {
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [target, setTarget] = useState("ALL") // ALL, GEO, STATUS

    const handleBroadcast = async () => {
        if (!message) return
        setLoading(true)
        try {
            const res = await broadcastToDrivers(message)
            if (res.success) {
                alert("📢 Broadcast enviado con éxito a todos los repartidores.")
                setMessage("")
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert("Error al enviar broadcast.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-10 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl">
                    <Megaphone className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">QA Messaging Hub</h1>
                    <p className="text-gray-500">Panel de control de comunicaciones en tiempo real para QA</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tools column */}
                <div className="space-y-4">
                    <Card className="rounded-2xl border-2 border-black/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase">Segmentación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button 
                                variant={target === "ALL" ? "default" : "outline"} 
                                className="w-full justify-start font-bold h-10"
                                onClick={() => setTarget("ALL")}
                            >
                                <Globe className="mr-2 h-4 w-4" /> Global
                            </Button>
                            <Button 
                                variant={target === "GEO" ? "default" : "outline"} 
                                className="w-full justify-start font-bold h-10"
                                onClick={() => setTarget("GEO")}
                            >
                                <MapPin className="mr-2 h-4 w-4" /> Geofencing
                            </Button>
                            <Button 
                                variant={target === "STATUS" ? "default" : "outline"} 
                                className="w-full justify-start font-bold h-10"
                                onClick={() => setTarget("STATUS")}
                            >
                                <Users className="mr-2 h-4 w-4" /> Estatus
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl bg-blue-600 text-white border-none shadow-lg shadow-blue-200">
                        <CardContent className="p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Tips de QA</p>
                            <p className="text-xs mt-2 font-medium leading-relaxed">
                                Los mensajes de broadcast aparecerán en el dashboard de todos los drivers que estén online.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Composer column */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-3xl border-2 border-black/5 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-lg">Broadcast Composer</h3>
                                <p className="text-xs text-gray-500">Enviar mensaje masivo unidireccional</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-green-600 uppercase">Live System</span>
                            </div>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Contenido del Mensaje</label>
                                <textarea 
                                    className="w-full min-h-[150px] p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-black transition-all resize-none"
                                    placeholder="Escribe el aviso para los repartidores..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            {target === "GEO" && (
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">Ubicación de Referencia</p>
                                    <Input placeholder="Santiago Centro (Fijar Radio 5km)" className="bg-white border-blue-200 rounded-xl" />
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button 
                                    className="h-12 px-8 rounded-2xl bg-black hover:bg-gray-800 text-white font-black shadow-xl"
                                    disabled={loading || !message}
                                    onClick={handleBroadcast}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    EFECTUAR BROADCAST
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simulation logs (Visual only for QA) */}
                    <Card className="rounded-3xl border-gray-100 bg-gray-900 text-white">
                        <CardHeader className="pb-2 border-b border-white/5">
                            <CardTitle className="text-xs font-bold uppercase text-gray-500">Output Log (Simulated)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 font-mono text-[10px] space-y-1 text-gray-400">
                            <p><span className="text-green-500">[SYSTEM]</span> Socket server initialized at ws://localhost:3000</p>
                            <p><span className="text-blue-500">[INFO]</span> 24 drivers connected in Santiago area.</p>
                            <p><span className="text-yellow-500">[READY]</span> Awaiting broadcast event...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
