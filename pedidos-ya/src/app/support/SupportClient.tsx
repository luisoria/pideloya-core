/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Plus, Send, ArrowLeft, Headphones, FileText, ShieldAlert, Truck, CreditCard, Bug } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTicket, addTicketReply } from "@/app/actions/tickets"

const CATEGORIES = [
    { value: "ORDER_ISSUE", label: "Problema con pedido", icon: <FileText className="h-5 w-5" />, color: "border-blue-400 bg-blue-50" },
    { value: "DELIVERY", label: "Problema de entrega", icon: <Truck className="h-5 w-5" />, color: "border-amber-400 bg-amber-50" },
    { value: "PAYMENT", label: "Problema de pago", icon: <CreditCard className="h-5 w-5" />, color: "border-green-400 bg-green-50" },
    { value: "QUALITY", label: "Calidad del producto", icon: <ShieldAlert className="h-5 w-5" />, color: "border-red-400 bg-red-50" },
    { value: "APP_BUG", label: "Error en la app", icon: <Bug className="h-5 w-5" />, color: "border-purple-400 bg-purple-50" },
    { value: "GENERAL", label: "Consulta general", icon: <Headphones className="h-5 w-5" />, color: "border-gray-400 bg-gray-50" },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    OPEN: { label: "Abierto", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    IN_PROGRESS: { label: "En Proceso", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    RESOLVED: { label: "Resuelto", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
    CLOSED: { label: "Cerrado", color: "bg-gray-50 text-gray-500 border-gray-200", dot: "bg-gray-400" },
    ESCALATED: { label: "Escalado", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
}

function fmtDate(d: string | Date) {
    const date = new Date(d)
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function SupportClient({ tickets, orders, session }: { tickets: any[]; orders: any[]; session: any }) {
    const router = useRouter()
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list')
    const [selectedTicket, setSelectedTicket] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [success, setSuccess] = useState('')

    const openTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED')
    const closedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const fd = new FormData(e.currentTarget)
        const res = await createTicket({
            issue: fd.get('issue') as string,
            description: fd.get('description') as string,
            category: fd.get('category') as string,
            priority: fd.get('priority') as string,
            orderId: fd.get('orderId') as string || undefined,
            requesterType: session.role === 'DRIVER' ? 'DRIVER' : session.role === 'RESTAURANT' ? 'RESTAURANT' : 'CUSTOMER',
        })
        setLoading(false)
        if (res.success) {
            setSuccess(`Ticket ${res.ticketNumber} creado. Recibirás un email de confirmación.`)
            setTimeout(() => { setSuccess(''); setView('list'); router.refresh() }, 3000)
        }
    }

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) return
        setLoading(true)
        await addTicketReply(selectedTicket.id, replyText)
        setReplyText('')
        setLoading(false)
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        {view !== 'list' && (
                            <button onClick={() => { setView('list'); setSelectedTicket(null) }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                <Headphones className="h-7 w-7 text-[var(--primary)]" />
                                Centro de Soporte
                            </h1>
                            <p className="text-sm text-gray-500">Gestiona tus reclamos y consultas</p>
                        </div>
                    </div>
                    {view === 'list' && (
                        <Button onClick={() => setView('create')} className="bg-[var(--primary)] hover:bg-red-700 font-bold shadow-lg shadow-red-200">
                            <Plus className="h-4 w-4 mr-2" /> Nuevo Reclamo
                        </Button>
                    )}
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3 animate-in">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <p className="font-bold text-green-700">{success}</p>
                    </div>
                )}

                {/* ══════════ LIST VIEW ══════════ */}
                {view === 'list' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white border-b-4 border-blue-500 rounded-xl p-4 shadow-sm">
                                <div className="text-2xl font-black text-gray-900">{openTickets.length}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase">Abiertos</div>
                            </div>
                            <div className="bg-white border-b-4 border-amber-500 rounded-xl p-4 shadow-sm">
                                <div className="text-2xl font-black text-gray-900">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase">En Proceso</div>
                            </div>
                            <div className="bg-white border-b-4 border-green-500 rounded-xl p-4 shadow-sm">
                                <div className="text-2xl font-black text-gray-900">{closedTickets.length}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase">Resueltos</div>
                            </div>
                            <div className="bg-white border-b-4 border-gray-400 rounded-xl p-4 shadow-sm">
                                <div className="text-2xl font-black text-gray-900">{tickets.length}</div>
                                <div className="text-xs font-bold text-gray-500 uppercase">Total</div>
                            </div>
                        </div>

                        {tickets.length === 0 ? (
                            <Card className="shadow-lg rounded-xl text-center py-16">
                                <CardContent>
                                    <Headphones className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-600 mb-2">Sin tickets</h3>
                                    <p className="text-gray-400 mb-6">No tienes reclamos ni consultas registradas</p>
                                    <Button onClick={() => setView('create')} className="bg-[var(--primary)] hover:bg-red-700 font-bold">
                                        <Plus className="h-4 w-4 mr-2" /> Crear Reclamo
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map((ticket: any) => {
                                    const st = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN
                                    return (
                                        <Card key={ticket.id} className="shadow-sm rounded-xl hover:shadow-md transition-all cursor-pointer border-l-4"
                                            style={{ borderLeftColor: st.dot === 'bg-blue-500' ? '#3b82f6' : st.dot === 'bg-amber-500' ? '#f59e0b' : st.dot === 'bg-green-500' ? '#22c55e' : st.dot === 'bg-red-500' ? '#ef4444' : '#9ca3af' }}
                                            onClick={() => { setSelectedTicket(ticket); setView('detail') }}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">{ticket.ticketNumber}</span>
                                                            <Badge variant="outline" className={`text-xs font-bold border ${st.color}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot} mr-1.5 inline-block`}></span>
                                                                {st.label}
                                                            </Badge>
                                                            <Badge variant="outline" className={`text-xs font-bold ${ticket.priority === 'CRITICAL' ? 'border-red-300 bg-red-50 text-red-700' :
                                                                ticket.priority === 'HIGH' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                                                                    ticket.priority === 'MEDIUM' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                                                                        'border-gray-300 bg-gray-50 text-gray-600'
                                                                }`}>{ticket.priority}</Badge>
                                                        </div>
                                                        <h3 className="font-bold text-gray-900 text-base truncate">{ticket.issue}</h3>
                                                        <p className="text-sm text-gray-500 truncate mt-0.5">{ticket.description}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-xs text-gray-400">{fmtDate(ticket.createdAt)}</div>
                                                        {ticket.replies?.length > 0 && (
                                                            <div className="flex items-center gap-1 text-xs text-blue-500 mt-1 justify-end">
                                                                <MessageSquare className="h-3 w-3" /> {ticket.replies.length}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════ CREATE VIEW ══════════ */}
                {view === 'create' && (
                    <Card className="shadow-lg rounded-xl overflow-hidden">
                        <CardHeader className="bg-white border-b">
                            <CardTitle className="text-xl font-extrabold uppercase text-gray-800 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-[var(--primary)]" /> Nuevo Reclamo
                            </CardTitle>
                            <CardDescription>Describe tu problema y te responderemos en menos de 48 horas</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleCreate} className="space-y-6">
                                {/* Category Selection */}
                                <div>
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 block">Categoría del reclamo</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {CATEGORIES.map(cat => (
                                            <label key={cat.value} className={`relative cursor-pointer rounded-xl border-2 p-4 flex items-center gap-3 transition-all hover:shadow-md ${cat.color} has-[:checked]:ring-2 has-[:checked]:ring-[var(--primary)] has-[:checked]:border-[var(--primary)]`}>
                                                <input type="radio" name="category" value={cat.value} className="absolute opacity-0" defaultChecked={cat.value === 'GENERAL'} />
                                                {cat.icon}
                                                <span className="font-bold text-sm text-gray-800">{cat.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 block">Asunto</label>
                                    <Input name="issue" placeholder="Resumen breve del problema" required className="border-2" />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 block">Descripción detallada</label>
                                    <textarea name="description" rows={4} required
                                        className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                                        placeholder="Explica tu problema con el mayor detalle posible..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 block">Prioridad</label>
                                        <select title="Prioridad" name="priority" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm bg-white focus:border-[var(--primary)] outline-none">
                                            <option value="LOW">Baja</option>
                                            <option value="MEDIUM" selected>Media</option>
                                            <option value="HIGH">Alta</option>
                                            <option value="CRITICAL">Crítica</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1 block">Pedido relacionado (opcional)</label>
                                        <select title="Pedido" name="orderId" className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm bg-white focus:border-[var(--primary)] outline-none">
                                            <option value="">Ninguno</option>
                                            {orders.map((o: any) => (
                                                <option key={o.id} value={o.id}>#{o.id.split('-')[0]} — {o.restaurant?.name} (${o.total})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setView('list')}>Cancelar</Button>
                                    <Button type="submit" disabled={loading} className="flex-1 bg-[var(--primary)] hover:bg-red-700 font-bold shadow-lg shadow-red-200">
                                        {loading ? 'Enviando...' : 'Enviar Reclamo'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* ══════════ DETAIL VIEW ══════════ */}
                {view === 'detail' && selectedTicket && (() => {
                    const st = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.OPEN
                    return (
                        <div className="space-y-6">
                            {/* Ticket Header */}
                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <span className="text-sm font-black text-gray-400 uppercase tracking-wider">{selectedTicket.ticketNumber}</span>
                                            <h2 className="text-xl font-black text-gray-900 mt-1">{selectedTicket.issue}</h2>
                                        </div>
                                        <Badge variant="outline" className={`text-sm font-bold border-2 px-3 py-1 ${st.color}`}>
                                            <span className={`w-2 h-2 rounded-full ${st.dot} mr-2 inline-block`}></span>
                                            {st.label}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div><span className="text-gray-400 font-bold uppercase text-xs">Categoría</span><br /><span className="font-bold text-gray-700">{selectedTicket.category}</span></div>
                                        <div><span className="text-gray-400 font-bold uppercase text-xs">Prioridad</span><br /><span className="font-bold text-gray-700">{selectedTicket.priority}</span></div>
                                        <div><span className="text-gray-400 font-bold uppercase text-xs">Creado</span><br /><span className="font-bold text-gray-700">{fmtDate(selectedTicket.createdAt)}</span></div>
                                        <div><span className="text-gray-400 font-bold uppercase text-xs">SLA</span><br />
                                            <span className="font-bold text-gray-700 flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" /> {selectedTicket.slaDeadline ? fmtDate(selectedTicket.slaDeadline) : '48h'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                        <p className="text-sm text-gray-700">{selectedTicket.description}</p>
                                    </div>

                                    {selectedTicket.resolution && (
                                        <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                <span className="text-sm font-black text-green-700 uppercase">Resolución</span>
                                            </div>
                                            <p className="text-sm text-green-800">{selectedTicket.resolution}</p>
                                            <p className="text-xs text-green-600 mt-2">Resuelto por {selectedTicket.resolvedBy} el {selectedTicket.resolvedAt ? fmtDate(selectedTicket.resolvedAt) : ''}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Conversation Thread */}
                            <Card className="shadow-lg rounded-xl overflow-hidden">
                                <CardHeader className="bg-white border-b">
                                    <CardTitle className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-[var(--primary)]" /> Conversación ({selectedTicket.replies?.length || 0})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3 max-h-[400px] overflow-y-auto bg-gray-50">
                                    {(!selectedTicket.replies || selectedTicket.replies.length === 0) && (
                                        <p className="text-center text-gray-400 py-8">Sin mensajes aún. Escribe el primer mensaje.</p>
                                    )}
                                    {selectedTicket.replies?.map((reply: any) => (
                                        <div key={reply.id} className={`flex ${reply.authorRole === 'ADMIN' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${reply.authorRole === 'ADMIN'
                                                ? 'bg-white border border-gray-200'
                                                : 'bg-[var(--primary)] text-white'
                                                }`}>
                                                <div className={`text-xs font-bold mb-1 ${reply.authorRole === 'ADMIN' ? 'text-blue-600' : 'text-red-100'}`}>
                                                    {reply.author} · {reply.authorRole}
                                                </div>
                                                <p className="text-sm">{reply.message}</p>
                                                <div className={`text-xs mt-1 ${reply.authorRole === 'ADMIN' ? 'text-gray-400' : 'text-red-200'}`}>
                                                    {fmtDate(reply.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>

                                {/* Reply Input */}
                                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                                    <div className="p-4 border-t bg-white">
                                        <div className="flex gap-2">
                                            <Input
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Escribe tu mensaje..."
                                                className="flex-1 border-2"
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleReply() }}
                                            />
                                            <Button onClick={handleReply} disabled={loading || !replyText.trim()} className="bg-[var(--primary)] hover:bg-red-700 font-bold px-6">
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}
