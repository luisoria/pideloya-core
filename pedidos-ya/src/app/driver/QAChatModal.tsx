"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Send, Check, CheckCheck, Loader2, User } from "lucide-react"
import { sendOrderMessage } from "@/app/actions/qa-messaging"

interface Props {
    orderId: string
    isOpen: boolean
    onClose: () => void
    customerName: string
    isDriver?: boolean
}

export function QAChatModal({ orderId, isOpen, onClose, customerName, isDriver = true }: Props) {
    const [messages, setMessages] = useState<any[]>([
        { id: '1', content: 'Hola! Ya tengo tu pedido.', status: 'READ', senderId: 'driver', createdAt: new Date() }
    ])
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)

    const handleSend = async () => {
        if (!input.trim()) return
        setSending(true)
        try {
            const res = await sendOrderMessage(orderId, input)
            if (res.success) {
                setMessages([...messages, {
                    id: Math.random().toString(),
                    content: input,
                    status: 'SENT',
                    senderId: 'driver',
                    createdAt: new Date()
                }])
                setInput("")
                
                // QA: Simular cambio de estado de entregado/leído
                setTimeout(() => {
                    setMessages(prev => prev.map(m => m.content === input ? { ...m, status: 'DELIVERED' } : m))
                }, 1000)
                setTimeout(() => {
                    setMessages(prev => prev.map(m => m.content === input ? { ...m, status: 'READ' } : m))
                }, 2500)
            } else {
                alert(res.error)
            }
        } catch (error) {
            alert("Error al enviar mensaje")
        } finally {
            setSending(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Chat con ${customerName}`}>
            <div className="flex flex-col h-[400px]">
                {/* Message list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((m) => {
                        const isMe = m.senderId === 'driver'
                        return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                    isMe ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                }`}>
                                    <p>{m.content}</p>
                                    <div className="mt-1 flex items-center justify-end gap-1">
                                        <span className={`text-[9px] ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            m.status === 'SENT' ? <Check className="h-3 w-3 text-red-200" /> :
                                            m.status === 'DELIVERED' ? <CheckCheck className="h-3 w-3 text-red-200" /> :
                                            <CheckCheck className="h-3 w-3 text-blue-200" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Input area */}
                <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
                    <input 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-red-500"
                        placeholder="Escribe un mensaje..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700 w-10 h-10 rounded-xl p-0 flex items-center justify-center shadow-lg"
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-white" />}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
