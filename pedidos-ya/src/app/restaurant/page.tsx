/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useState, useRef, useEffect } from 'react'
import './registro.css'
import { CheckCircle, Upload, FileText, Store, MapPin, ShieldCheck, ArrowRight, ArrowLeft, Send, Search, Package, TrendingUp, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

/* ═══════════════════════════════════════
   DATOS CHILE (Reutilizados del driver para consistencia)
   ═══════════════════════════════════════ */
const REGIONES = ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana de Santiago', 'O\'Higgins', 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes']
const COMUNAS_RM = ['Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín', 'San Miguel', 'San Ramón', 'Santiago', 'Vitacura', 'Puente Alto']

const CATEGORIES = ['Hamburguesas', 'Pizza', 'Sushi', 'Comida Chilena', 'Postres', 'Cafetería', 'Saludable', 'Pastas', 'Farmacia', 'Supermercado']

const CONTRACT_RESTAURANT = `
CONTRATO DE ADHESIÓN A LA PLATAFORMA PIDELOYA - RESTAURANTES

En Santiago de Chile, se celebra el presente contrato entre PIDELOYA SPA (en adelante "La Plataforma") y el proponente del restaurante identificado en este registro (en adelante "El Restaurante").

1. OBJETO: La Plataforma permite al Restaurante publicar sus productos y recibir pedidos de clientes.
2. COMISIONES: El Restaurante acepta que La Plataforma descontará una comisión fija de cada pedido realizado. Dicha comisión es establecida por La Plataforma basándose en el volumen y zona, comunicándose oportunamente mediante el panel administrativo.
3. LOGÍSTICA: Los pedidos pueden ser entregados por Drivers de la red de PideloYA o por repartidores propios si se habilita la opción.
4. CALIDAD: El Restaurante es total responsable de la higiene, calidad y preparación de los productos.
5. PAGOS: Las liquidaciones se realizarán semanalmente descontando comisiones y cargos operativos.
6. FIRMA: Se acepta la firma electrónica mediante validación de correo como prueba fehaciente de aceptación.
`

export default function RestaurantRegistrationPage() {
    const router = useRouter()
    const [screen, setScreen] = useState<'landing' | 'form' | 'done'>('landing')
    const [step, setStep] = useState(1)
    const [appId, setAppId] = useState<string | null>(null)
    const [trackingCode, setTrackingCode] = useState('')

    // ── Form State ──
    const [form, setForm] = useState({
        businessName: '', fantasyName: '', rut: '', category: '', phone: '', email: '',
        address: '', comuna: '', region: 'Metropolitana de Santiago',
        contractFullname: '', contractSigned: false,
        status: 'DRAFT'
    })

    const [uploads, setUploads] = useState<Record<string, { file: File, preview: string, url?: string } | null>>({})
    const [uploadingField, setUploadingField] = useState<string | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // ── Helpers ──
    const set = (key: string, val: string) => {
        setForm(prev => ({ ...prev, [key]: val }))
        setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    }

    const handleFileChange = async (key: string, file: File | null) => {
        if (!file) return
        const preview = URL.createObjectURL(file)
        setUploads(prev => ({ ...prev, [key]: { file, preview } }))

        // Auto-upload if we have session
        if (appId) {
            setUploadingField(key)
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('appId', appId)
                formData.append('field', key) // Should be mapped in server to e.g. commerceRegisterUrl
                formData.append('type', 'restaurant')

                const res = await fetch('/api/restaurant/upload', { method: 'POST', body: formData })
                const data = await res.json()
                if (res.ok && data.url) {
                    const dbField = `${key}Url`
                    setForm(prev => ({ ...prev, [dbField]: data.url }))
                    console.log(`[UPLOAD] ${key} success:`, data.url)
                }
            } catch (e) { console.error(e) } finally { setUploadingField(null) }
        }
    }

    const validateStep = () => {
        const errs: Record<string, string> = {}
        if (step === 1) {
            if (!form.businessName) errs.businessName = 'Razón social requerida'
            if (!form.fantasyName) errs.fantasyName = 'Nombre de fantasía requerido'
            if (!form.rut) errs.rut = 'RUT de empresa requerido'
            if (!form.email.includes('@')) errs.email = 'Email inválido'
            if (!form.phone) errs.phone = 'Teléfono requerido'
        }
        if (step === 2) {
            if (!form.address) errs.address = 'Dirección requerida'
            if (!form.comuna) errs.comuna = 'Comuna requerida'
        }
        if (step === 3) {
            if (!uploads.commerceRegister) errs.docs = 'Falta Registro de Comercio / E-RUT'
            if (!uploads.identityDoc) errs.identity = 'Falta Cédula del Representante'
        }
        if (step === 4) {
            if (!uploads.storefrontPhoto) errs.visuals = 'Falta foto de la fachada'
        }
        if (step === 5) {
            if (!form.contractFullname) errs.contract = 'Ingresa nombre completo para firmar'
        }
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const saveStep = async () => {
        try {
            const body = {
                step,
                applicationId: appId,
                ...form,
                // Map the specific upload keys for the backend
                commerceRegisterUrl: uploads.commerceRegister?.url,
                identityDocUrl: uploads.identityDoc?.url,
                tributaryFolderUrl: uploads.tributaryFolder?.url,
                storefrontPhotoUrl: uploads.storefrontPhoto?.url,
                menuPhotoUrl: uploads.menuPhoto?.url
            }
            if (step === 5) (body as any).status = 'SUBMITTED'

            const res = await fetch('/api/restaurant-applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const data = await res.json()
            if (res.ok) {
                if (data.id) setAppId(data.id)
                if (data.trackingCode) setTrackingCode(data.trackingCode)
                return true
            }
            alert(data.error || 'Error al guardar')
            return false
        } catch (e) { return false }
    }

    const nextStep = async () => {
        if (!validateStep()) return
        const ok = await saveStep()
        if (!ok) return

        if (step === 5) setScreen('done')
        else setStep(s => s + 1)
        window.scrollTo(0, 0)
    }

    /* ═══════════════════════════════════════
       SCREENS
       ═══════════════════════════════════════ */
    if (screen === 'landing') {
        return (
            <div className="res-portal">
                <section className="res-hero">
                    <div className="flex justify-center mb-10 translate-y-0">
                        <div className="bg-red-600/10 border border-red-600/30 px-6 py-2 rounded-full text-red-600 font-bold text-xs tracking-[0.2em] uppercase backdrop-blur-sm animate-pulse-soft">
                            Para Negocios y Restaurantes
                        </div>
                    </div>
                    
                    <h1 className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        Vende más con <span className="highlight">PideloYA</span>
                    </h1>
                    
                    <p className="text-res-text-muted mx-auto text-lg md:text-xl leading-relaxed mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Únete a la red más grande de Chile. Digitaliza tu menú, gestiona tus pedidos en tiempo real
                        y llega a miles de nuevos clientes sin complicaciones.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto mb-20 px-4">
                        <div className="bg-res-surface/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-res-border hover:border-res-primary/50 hover:bg-res-surface transition-all duration-500 group animate-in fade-in zoom-in-95 duration-700 delay-200 text-center">
                            <div className="h-16 w-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto group-hover:scale-110 transition-transform">🚀</div>
                            <h3 className="font-black text-xl mb-3 italic tracking-tighter text-center">MAYOR ALCANCE</h3>
                            <p className="text-sm text-res-text-muted leading-relaxed text-center">Aumenta tus ventas hasta un 40% llegando a zonas que antes no podías.</p>
                        </div>
                        <div className="bg-res-surface/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-res-border hover:border-res-primary/50 hover:bg-res-surface transition-all duration-500 group animate-in fade-in zoom-in-95 duration-700 delay-300 text-center">
                            <div className="h-16 w-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto group-hover:scale-110 transition-transform">📱</div>
                            <h3 className="font-black text-xl mb-3 italic tracking-tighter text-center">GESTIÓN FÁCIL</h3>
                            <p className="text-sm text-res-text-muted leading-relaxed text-center">Recibe y gestiona pedidos desde una tablet intuitiva diseñada para tu cocina.</p>
                        </div>
                        <div className="bg-res-surface/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-res-border hover:border-res-primary/50 hover:bg-res-surface transition-all duration-500 group animate-in fade-in zoom-in-95 duration-700 delay-400 text-center">
                            <div className="h-16 w-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto group-hover:scale-110 transition-transform">💳</div>
                            <h3 className="font-black text-xl mb-3 italic tracking-tighter text-center">PAGOS RÁPIDOS</h3>
                            <p className="text-sm text-res-text-muted leading-relaxed text-center">Liquidaciones semanales transparentes con todo el detalle de tus comisiones.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
                        <button 
                            className="res-btn-primary max-w-sm" 
                            onClick={() => setScreen('form')}
                        >
                            Registrar mi local ahora
                        </button>
                        
                        <div className="text-res-text-muted text-sm font-medium">
                            ¿Ya tienes una cuenta? {' '}
                            <Link href="/login" className="text-white hover:text-res-primary underline underline-offset-4 transition-colors">
                                Iniciar Sesión Partner
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    if (screen === 'done') {
        return (
            <div className="res-portal flex items-center justify-center p-8">
                <div className="res-card text-center max-w-md">
                    <div className="text-6xl mb-6">🎉</div>
                    <h2 className="text-3xl font-black mb-4 italic">¡SOLICITUD ENVIADA!</h2>
                    <p className="text-res-text-muted mb-8">
                        Hemos recibido el registro de <strong>{form.fantasyName}</strong>.
                        Nuestro equipo comercial revisará tus documentos en un plazo de 48-72 horas hábiles.
                    </p>
                    <div className="bg-black/30 p-4 rounded-lg mb-8 border border-res-border">
                        <div className="text-xs uppercase font-bold text-res-text-muted mb-1">Código de Seguimiento</div>
                        <div className="text-2xl font-mono text-res-secondary tracking-widest">{trackingCode}</div>
                    </div>
                    <p className="text-sm text-res-text-muted italic mb-10">
                        Te enviaremos un correo electrónico una vez tu local sea aprobado para que empieces a cargar tus productos.
                    </p>
                    <button className="res-btn-primary" onClick={() => router.push('/')}>Volver al inicio</button>
                </div>
            </div>
        )
    }

    return (
        <div className="res-portal">
            <div className="res-container">
                {/* Header context */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Portal de Aliados</h2>
                        <p className="text-res-text-muted text-sm">Paso {step} de 5</p>
                    </div>
                    <CheckCircle className={`h-8 w-8 ${appId ? 'text-green-500' : 'text-res-border'}`} />
                </div>

                {/* Progress dot UI */}
                <div className="res-step-indicator">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={`res-step-dot ${step >= s ? 'active' : ''}`} />
                    ))}
                </div>

                <div className="res-card">
                    {/* STEP 1: BUSINESS DATA */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Store className="text-res-primary" /> Información del Negocio
                            </h3>
                            <div className="res-group">
                                <label className="res-label">Razón Social</label>
                                <input className="res-input" placeholder="Ej: Gastronomía Andina SpA" value={form.businessName} onChange={e => set('businessName', e.target.value)} />
                                {errors.businessName && <div className="text-res-primary text-xs mt-1">⚠️ {errors.businessName}</div>}
                            </div>
                            <div className="res-group">
                                <label className="res-label">Nombre de Fantasía (Cómo te ven los clientes)</label>
                                <input className="res-input" placeholder="Ej: Burger King La Reina" value={form.fantasyName} onChange={e => set('fantasyName', e.target.value)} />
                            </div>
                            <div className="res-group">
                                <label className="res-label">RUT de Empresa (70.xxx.xxx-x)</label>
                                <input className="res-input" placeholder="XX.XXX.XXX-X" value={form.rut} onChange={e => set('rut', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="res-group">
                                    <label className="res-label">Email de Administración</label>
                                    <input className="res-input" placeholder="admin@mylocal.cl" value={form.email} onChange={e => set('email', e.target.value)} />
                                </div>
                                <div className="res-group">
                                    <label className="res-label">Teléfono de contacto</label>
                                    <input className="res-input" placeholder="+56 9 XXXX XXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: LOCATION */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <MapPin className="text-res-primary" /> Ubicación del Local
                            </h3>
                            <div className="res-group">
                                <label className="res-label">Dirección Completa</label>
                                <input className="res-input" placeholder="Ej: Av. Apoquindo 4500, Local 5" value={form.address} onChange={e => set('address', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="res-group">
                                    <label className="res-label">Región</label>
                                    <select className="res-input" value={form.region} onChange={e => set('region', e.target.value)}>
                                        {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="res-group">
                                    <label className="res-label">Comuna</label>
                                    <select className="res-input" value={form.comuna} onChange={e => set('comuna', e.target.value)}>
                                        <option value="">Selecciona comuna</option>
                                        {COMUNAS_RM.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: LEGAL DOCS */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <FileText className="text-res-primary" /> Documentación Legal
                            </h3>
                            <p className="text-res-text-muted text-sm mb-6">Para validar tu comercio, necesitamos los siguientes documentos escaneados o en foto legible:</p>

                            <div className="space-y-4">
                                <FileUploader
                                    label="E-RUT o Registro de Comercio"
                                    file={uploads.commerceRegister}
                                    onChange={(f) => handleFileChange('commerceRegister', f)}
                                    uploading={uploadingField === 'commerceRegister'}
                                />
                                <FileUploader
                                    label="Cédula de Identidad Representante (Ambas caras)"
                                    file={uploads.identityDoc}
                                    onChange={(f) => handleFileChange('identityDoc', f)}
                                    uploading={uploadingField === 'identityDoc'}
                                />
                                <FileUploader
                                    label="Carpeta Tributaria / Iniciación de Actividades"
                                    file={uploads.tributaryFolder}
                                    onChange={(f) => handleFileChange('tributaryFolder', f)}
                                    uploading={uploadingField === 'tributaryFolder'}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: VISUALS */}
                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Upload className="text-res-primary" /> Presentación Visual
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FileUploader
                                    label="Foto de la Fachada"
                                    hint="Asegúrate que se vea el nombre del local"
                                    file={uploads.storefrontPhoto}
                                    onChange={(f) => handleFileChange('storefrontPhoto', f)}
                                    uploading={uploadingField === 'storefrontPhoto'}
                                />
                                <FileUploader
                                    label="Foto del Menú / Carta"
                                    hint="Opcional: Ayuda a configurar tus productos"
                                    file={uploads.menuPhoto}
                                    onChange={(f) => handleFileChange('menuPhoto', f)}
                                    uploading={uploadingField === 'menuPhoto'}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 5: CONTRACT */}
                    {step === 5 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <ShieldCheck className="text-res-primary" /> Contrato y Firma
                            </h3>
                            <div className="res-contract-box">
                                {CONTRACT_RESTAURANT}
                            </div>
                            <div className="res-group">
                                <label className="res-label">Nombre Completo del Firmante</label>
                                <input className="res-input" placeholder="Yo, [Tu nombre], acepto los términos..." value={form.contractFullname} onChange={e => set('contractFullname', e.target.value)} />
                            </div>
                            <p className="text-[10px] text-res-text-muted italic">
                                Al presionar "Enviar", declaras que los datos proporcionados son veraces y que tienes poderes suficientes para representar legalmente a la empresa mencionada.
                            </p>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-12 flex gap-4">
                        {step > 1 && (
                            <button className="flex-1 flex items-center justify-center gap-2 border-2 border-res-border rounded-xl font-bold hover:bg-white/5 transition-all py-4" onClick={() => setStep(s => s - 1)}>
                                <ArrowLeft className="h-4 w-4" /> Anterior
                            </button>
                        )}
                        <button className="res-btn-primary flex-[2] flex items-center justify-center gap-2" onClick={nextStep}>
                            {step === 5 ? 'Enviar Solicitud Final' : 'Continuar'} <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FileUploader({ label, hint, file, onChange, uploading }: {
    label: string;
    hint?: string;
    file: { file: File; preview: string; url?: string } | null | undefined;
    onChange: (f: File | null) => void;
    uploading: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    return (
        <div className="res-group">
            <label className="res-label">{label}</label>
            <div className={`res-upload ${file ? 'border-green-500 bg-green-500/5' : ''}`} onClick={() => inputRef.current?.click()}>
                <input ref={inputRef} type="file" className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
                {file ? (
                    <div className="flex items-center justify-center gap-3">
                        <CheckCircle className="text-green-500 h-6 w-6" />
                        <span className="text-sm font-bold text-green-500">Archivo Cargado Correctamente</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-res-text-muted mb-2" />
                        <span className="text-sm font-semibold">{uploading ? 'Subiendo...' : 'Seleccionar Archivo'}</span>
                        {hint && <span className="text-xs text-res-text-muted mt-1">{hint}</span>}
                    </div>
                )}
            </div>
        </div>
    )
}
