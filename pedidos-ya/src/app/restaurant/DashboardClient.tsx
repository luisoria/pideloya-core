"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"

import { Check, Clock, Plus, Trash2, Search, Package, DollarSign, Activity } from "lucide-react"
import { updateOrderStatus } from "@/app/actions/orders"
import { addProduct, deleteProduct } from "@/app/actions/restaurant"
import { useRouter } from "next/navigation"

export function DashboardClient({ initialOrders, menu, restaurantId }: any) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("orders")
    
    // UI State
    const [orders, setOrders] = useState(initialOrders)
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Derived Metrics
    const totalSales = orders.reduce((acc: number, val: any) => acc + (val.status !== "PENDING" ? val.total : 0), 0)
    const activeOrderCount = orders.filter((o:any) => o.status !== "PICKED_UP" && o.status !== "DELIVERED").length

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setIsUpdating(orderId)
        try {
            await updateOrderStatus(orderId, newStatus)
            setOrders((prev:any[]) => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        } catch (error) {
            console.error(error)
        } finally {
            setIsUpdating(null)
            router.refresh()
        }
    }

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
        setIsUpdating(productId)
        try {
            await deleteProduct(productId)
        } catch(error) {
            console.error(error)
        } finally {
            setIsUpdating(null)
            router.refresh()
        }
    }

    const handleAddProduct = async (formData: FormData) => {
        setIsSubmitting(true)
        try {
            await addProduct(restaurantId, formData)
            setIsModalOpen(false)
        } catch (error) {
            console.error(error)
            alert("Error al intentar añadir producto")
        } finally {
            setIsSubmitting(false)
            router.refresh() // Pull new products via Server Action
        }
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-[var(--primary)] text-white pt-8 pb-16 px-4 md:px-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full border-4 border-white/10 opacity-50 pointer-events-none"></div>
                <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase flex items-center gap-3 text-white">
                            <Activity className="h-10 w-10 text-[var(--secondary)]" /> 
                            Partner Hub
                        </h1>
                        <p className="text-red-100 text-lg mt-2 font-medium tracking-wide">
                            Gestión Inteligente de Envíos e Inventario
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-black/20 rounded-lg p-3 px-5 text-center border-b-2 border-[var(--secondary)]">
                            <span className="block text-sm text-[var(--secondary)] uppercase font-bold tracking-wider">Hoy</span>
                            <span className="text-2xl font-black text-white">${totalSales.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-8 max-w-7xl mx-auto -mt-10">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8 flex divide-x divide-gray-100">
                    <button 
                        onClick={() => setActiveTab("orders")}
                        className={`flex-1 py-4 text-center font-bold uppercase transition-colors flex items-center justify-center gap-2
                        ${activeTab === "orders" ? "bg-red-50 text-[var(--primary)] border-b-4 border-b-[var(--primary)]" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                        <Package className="h-5 w-5" /> Monitor de Pedidos ({activeOrderCount})
                    </button>
                    <button 
                        onClick={() => setActiveTab("menu")}
                        className={`flex-1 py-4 text-center font-bold uppercase transition-colors flex items-center justify-center gap-2
                        ${activeTab === "menu" ? "bg-red-50 text-[var(--primary)] border-b-4 border-b-[var(--primary)]" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                        <DollarSign className="h-5 w-5" /> Catálogo & Precios
                    </button>
                </div>

                {activeTab === "orders" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.length === 0 && <p className="col-span-full py-20 text-center text-xl text-gray-400 font-bold uppercase border-2 border-dashed border-gray-200 rounded-xl">No hay órdenes activas actualmente</p>}
                        {orders.map((order: any) => (
                            <Card key={order.id} className={`shadow-md hover:shadow-lg transition-all rounded-xl border-t-0 border-x-0 border-b-4 ${order.status === "PENDING" ? 'border-b-red-500' : 'border-b-[var(--secondary)]'}`}>
                                <CardHeader className="pb-3 border-b bg-gray-50/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <Badge className={`text-xs uppercase tracking-wider font-bold shadow-sm ${order.status === "PENDING" ? "bg-red-50 text-red-600 border border-red-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`} variant="outline">
                                            {order.status}
                                        </Badge>
                                        <span className="font-bold text-gray-500 text-sm">#{order.id.slice(0, 6)}</span>
                                    </div>
                                    <CardTitle className="text-xl text-gray-900 mt-1">{order.customer?.name}</CardTitle>
                                    <CardDescription className="font-bold text-green-600 mt-1">${order.total.toFixed(2)} USD</CardDescription>
                                </CardHeader>
                                <CardContent className="py-4">
                                    <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-3">Resumen de Compras</h4>
                                    <div className="text-sm font-semibold text-gray-800 space-y-2">
                                        {order.items.map((it:any) => (
                                            <div key={it.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                                <span className="flex items-center gap-2">
                                                    <span className="bg-[var(--primary)] text-white text-[10px] px-1.5 py-0.5 rounded font-black">{it.quantity}x</span>
                                                    {it.product.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-gray-50 p-4 border-t gap-3">
                                    {order.status === "PENDING" && (
                                        <Button className="w-full bg-[var(--primary)] text-white hover:bg-red-800 font-bold shadow-md shadow-red-200" onClick={() => handleStatusChange(order.id, "COOKING")} disabled={isUpdating === order.id}>
                                            <Check className="mr-2 h-4 w-4" /> {isUpdating === order.id ? "Aceptando..." : "Aceptar Orden"}
                                        </Button>
                                    )}
                                    {order.status === "COOKING" && (
                                        <Button className="w-full bg-[var(--secondary)] text-yellow-900 hover:bg-yellow-500 font-bold shadow-md shadow-yellow-200" onClick={() => handleStatusChange(order.id, "READY")} disabled={isUpdating === order.id}>
                                            <Clock className="mr-2 h-4 w-4" /> {isUpdating === order.id ? "Enviando..." : "Marcar Listo (Embalado)"}
                                        </Button>
                                    )}
                                    {(order.status === "READY" || order.status === "PICKED_UP") && (
                                        <Button className="w-full bg-gray-200 text-gray-600 font-bold cursor-not-allowed" disabled>
                                            <Package className="mr-2 h-4 w-4" /> En poder del Repartidor
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === "menu" && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Catálogo de Productos</h2>
                                <p className="text-gray-500 text-sm mt-1">Administra tus artículos visibles al público en tiempo real.</p>
                            </div>
                            <Button className="bg-gray-900 hover:bg-black text-white font-bold h-10 px-6 shadow-lg rounded-full" onClick={() => setIsModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {menu.length === 0 && <p className="col-span-full py-10 text-center text-gray-500 font-semibold">Tu catálogo está vacío.</p>}
                            {menu.map((item:any) => (
                                <Card key={item.id} className="overflow-hidden hover:border-[var(--secondary)] transition-all group shadow-sm border-gray-200">
                                    <div className="flex h-full">
                                        <div className="w-32 bg-gray-50 flex items-center justify-center text-5xl shrink-0 group-hover:bg-yellow-50 transition-colors border-r border-gray-100">
                                            {item.image || "🍔"}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center p-4 relative">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute top-2 right-2 h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDeleteProduct(item.id)}
                                                disabled={isUpdating === item.id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <CardTitle className="text-lg font-bold text-gray-900 pr-8">{item.name}</CardTitle>
                                            <CardDescription className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-8">{item.description}</CardDescription>
                                            <div className="mt-3 inline-block">
                                                <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-0 font-black text-sm px-2">
                                                    ${item.price.toFixed(2)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Producto">
                <form action={handleAddProduct} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Nombre del Producto</label>
                        <Input name="name" required placeholder="Ej. Combo Hamburguesa Doble" className="focus-visible:ring-[var(--primary)]" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Descripción (Opcional)</label>
                        <Input name="description" placeholder="Ej. Doble carne, queso cheddar, papas y bebida..." className="focus-visible:ring-[var(--primary)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Precio (USD)</label>
                            <Input name="price" type="number" step="0.01" min="0" required placeholder="0.00" className="focus-visible:ring-[var(--primary)]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Emoji / Icono</label>
                            <Input name="image" placeholder="🍔, 🍕, 🥗" defaultValue="🍲" className="focus-visible:ring-[var(--primary)] text-center text-xl" />
                        </div>
                    </div>
                    <div className="pt-4 border-t mt-6 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-[var(--primary)] text-white hover:bg-red-800 font-bold">
                            {isSubmitting ? "Guardando..." : "Guardar Producto"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
