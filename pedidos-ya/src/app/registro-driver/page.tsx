'use client'
import './registro.css'
import { useState, useRef, useEffect } from 'react'

/* ═══════════════════════════════════════
   DATOS CHILENOS
   ═══════════════════════════════════════ */
const REGIONES = ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana de Santiago', 'O\'Higgins', 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes']
const COMUNAS_RM = ['Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Bernardo', 'San Joaquín', 'San Miguel', 'San Ramón', 'Santiago', 'Vitacura', 'Puente Alto']
const BANCOS = ['BancoEstado', 'Santander', 'BCI', 'Banco de Chile', 'Banco Falabella', 'Scotiabank', 'BICE', 'Itaú', 'Security', 'Banco Ripley', 'MACH', 'Tenpo', 'Mercado Pago', 'Cuenta RUT']
const STEP_LABELS = ['Datos Personales', 'Dirección', 'Verificación', 'Identidad', 'Vehículo', 'Docs Vehículo', 'Antecedentes', 'Datos Bancarios', 'Contrato & Firma', 'Confirmación']

const CONTRACT_BODY = `
CONTRATO DE PRESTACIÓN DE SERVICIOS DE REPARTO INDEPENDIENTE

En Santiago de Chile, se celebra el presente contrato entre PIDELOYA SPA (en adelante "La Empresa") y el solicitante cuyos datos han sido validados previamente en este portal (en adelante "El Driver").

1. OBJETO: El Driver se obliga a prestar servicios de transporte y entrega de mercancías solicitadas a través de la aplicación PideloYA.
2. INDEPENDENCIA: El Driver declara conocer que la relación es de carácter civil y mercantil, actuando con total autonomía, sin sujeción a horarios ni órdenes directas, y utilizando sus propios medios materiales.
3. PAGOS: La Empresa pagará semanalmente las sumas devengadas por cada reparto efectivamente realizado, previa emisión del documento tributario correspondiente si aplica.
4. OBLIGACIONES: El Driver debe mantener su vehículo en condiciones óptimas y cumplir con las normativas del tránsito vigentes.
5. FIRMA ELECTRÓNICA: Las partes aceptan que la firma mediante código de validación enviado al correo electrónico registrado constituye plena prueba de aceptación de los términos aquí descritos.
`

/* ═══════════════════════════════════════
   VALIDACIÓN RUT CHILENO (Módulo 11)
   ═══════════════════════════════════════ */
function formatRut(value: string) {
    const clean = value.replace(/[^0-9kK]/g, '')
    if (clean.length < 2) return clean
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1).toUpperCase()
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${formatted}-${dv}`
}

function validateRut(rut: string): boolean {
    const clean = rut.replace(/[.\-]/g, '')
    if (clean.length < 8) return false
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1).toUpperCase()
    let sum = 0, mul = 2
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * mul
        mul = mul === 7 ? 2 : mul + 1
    }
    const expected = 11 - (sum % 11)
    const dvExpected = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected)
    return dv === dvExpected
}

function calcAge(dateStr: string): number {
    const birth = new Date(dateStr)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
}

function passwordStrength(p: string): string {
    if (!p) return ''
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return ['', 'weak', 'fair', 'good', 'strong'][score]
}

/* ═══════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════ */
export default function RegistroDriverPage() {
    const [screen, setScreen] = useState<'landing' | 'form' | 'done'>('landing')
    const [step, setStep] = useState(1)
    const [appId, setAppId] = useState<string | null>(null)
    const [trackingCode, setTrackingCode] = useState('')

    // ── Datos del formulario ──
    const [form, setForm] = useState({
        firstName: '', lastNameP: '', lastNameM: '', rut: '', birthDate: '', email: '', phone: '',
        gender: '', nationality: 'CL', foreignDocType: '', foreignDocNumber: '',
        street: '', streetNumber: '', apartment: '', comuna: '', region: 'Metropolitana de Santiago',
        phoneVerified: false, emailVerified: false, password: '', passwordConfirm: '',
        vehicleType: '', ebikePower: '',
        bankName: '', accountType: '', accountNumber: '', bankRut: '',
        contractSigned: false, contractFullname: '', contractVerifyCode: '',
        status: 'DRAFT', // Estado inicial
    })

    const isLocked = form.status !== 'DRAFT' && form.status !== ''
        && screen !== 'landing' && screen !== 'done'

    // ── Archivos subidos ──
    const [uploads, setUploads] = useState<Record<string, { file: File; preview: string; url?: string } | null>>({})
    const [uploadingField, setUploadingField] = useState<string | null>(null)

    const handleFileChange = async (key: string, file: File | null) => {
        if (!file) return

        // Preview local
        const preview = URL.createObjectURL(file)
        setUploads(prev => ({ ...prev, [key]: { file, preview } }))

        // Si ya tenemos appId, subir inmediatamente
        if (appId) {
            setUploadingField(key)
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('appId', appId)
                formData.append('field', key)

                const res = await fetch('/api/driver/upload', {
                    method: 'POST',
                    body: formData
                })
                const data = await res.json()
                if (res.ok && data.url) {
                    // Guardar URL en el form para persistencia en DB
                    const dbField = `${key}Url`
                    setForm(prev => ({ ...prev, [dbField]: data.url }))
                    setUploads(prev => ({ ...prev, [key]: { ...prev[key]!, url: data.url } }))
                    console.log(`[UPLOAD] ${key} subido exitosamente:`, data.url)
                }
            } catch (e) {
                console.error('[UPLOAD ERROR]', e)
            } finally {
                setUploadingField(null)
            }
        }
    }

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [rutValid, setRutValid] = useState<boolean | null>(null)

    // ── Estado de Verificación ──
    const [verifyCodes, setVerifyCodes] = useState({ email: '', phone: '' })
    const [loadingVerify, setLoadingVerify] = useState<'email-send' | 'email-check' | 'phone-send' | 'phone-check' | null>(null)

    const resetForm = () => {
        setAppId(null)
        setTrackingCode('')
        setStep(1)
        setRutValid(null)
        setErrors({})
        setUploads({})
        setVerifyCodes({ email: '', phone: '' })
        setForm({
            firstName: '', lastNameP: '', lastNameM: '', rut: '', birthDate: '', email: '', phone: '',
            gender: '', nationality: 'CL', foreignDocType: '', foreignDocNumber: '',
            street: '', streetNumber: '', apartment: '', comuna: '', region: 'Metropolitana de Santiago',
            phoneVerified: false, emailVerified: false, password: '', passwordConfirm: '',
            vehicleType: '', ebikePower: '',
            bankName: '', accountType: '', accountNumber: '', bankRut: '',
            contractSigned: false, contractFullname: '', contractVerifyCode: '',
            status: 'DRAFT',
        })
    }

    const handleSendCode = async (type: 'email' | 'phone') => {
        console.log(`[VERIFY] Enviando código para ${type}...`)
        let currentId = appId

        if (!currentId) {
            console.log('[VERIFY] No hay appId, guardando primero...')
            const result = await saveStep()
            if (typeof result === 'string') {
                currentId = result
            } else {
                return alert('⚠️ Debes completar los datos anteriores correctamente antes de validar tu correo.')
            }
        }

        setLoadingVerify(`${type}-send` as any)
        try {
            const res = await fetch('/api/driver/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', appId: currentId, type })
            })
            const data = await res.json()
            if (res.ok) {
                alert(`✅ Código enviado a tu ${type === 'email' ? 'correo' : 'teléfono'}. Por favor revisa tu bandeja de entrada.`)
            } else {
                alert(`❌ Error al enviar: ${data.error || 'Servidor SMTP no disponible'}`)
            }
        } catch (e) {
            alert('❌ Error de conexión. Revisa tu internet.')
        } finally {
            setLoadingVerify(null)
        }
    }

    const handleCheckCode = async (type: 'email' | 'phone') => {
        console.log(`[VERIFY] Validando código para ${type}...`)
        if (!appId) return alert('⚠️ Error: No se encontró tu solicitud. Intenta recargar.')

        const codeVal = type === 'email' ? verifyCodes.email : verifyCodes.phone
        if (!codeVal || codeVal.length < 4) return alert('⚠️ Ingresa el código de 4 dígitos.')

        setLoadingVerify(`${type}-check` as any)
        try {
            const res = await fetch('/api/driver/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check', appId, type, code: codeVal })
            })
            const data = await res.json()
            if (res.ok) {
                setForm(prev => ({ ...prev, [type + 'Verified']: true }))
                alert('✅ ¡Validación exitosa!')
            } else {
                alert(`❌ ${data.error || 'Código incorrecto'}`)
            }
        } catch (e) {
            alert('❌ Error al validar código.')
        } finally {
            setLoadingVerify(null)
        }
    }

    const set = (key: string, val: string) => {
        setForm(prev => ({ ...prev, [key]: val }))
        setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    }

    const handleRut = async (val: string) => {
        const formatted = formatRut(val)
        set('rut', formatted)

        if (formatted.length >= 10 && validateRut(formatted)) {
            setRutValid(true)
            console.log('[RUT] Verificando pre-inscripción...')
            // Intentar recuperar si ya existe
            try {
                const res = await fetch('/api/driver-applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rut: formatted, step: 1 })
                })
                const data = await res.json()

                if (res.status === 409 && data.application) {
                    const app = data.application
                    console.log('[RUT] Solicitud encontrada, cargando datos...')
                    setAppId(app.id)
                    setTrackingCode(app.trackingCode || '')
                    setForm(prev => ({
                        ...prev,
                        firstName: app.firstName || prev.firstName,
                        lastNameP: app.lastNameP || prev.lastNameP,
                        lastNameM: app.lastNameM || prev.lastNameM,
                        birthDate: app.birthDate || prev.birthDate,
                        email: app.email || prev.email,
                        phone: app.phone || prev.phone,
                        gender: app.gender || prev.gender,
                        nationality: app.nationality || prev.nationality,
                        foreignDocType: app.foreignDocType || prev.foreignDocType,
                        foreignDocNumber: app.foreignDocNumber || prev.foreignDocNumber,
                        street: app.street || prev.street,
                        streetNumber: app.streetNumber || prev.streetNumber,
                        apartment: app.apartment || prev.apartment,
                        comuna: app.comuna || prev.comuna,
                        region: app.region || prev.region,
                        vehicleType: app.vehicleType || prev.vehicleType,
                        ebikePower: app.ebikePower || prev.ebikePower,
                        bankName: app.bankName || prev.bankName,
                        accountType: app.accountType || prev.accountType,
                        accountNumber: app.accountNumber || prev.accountNumber,
                        emailVerified: app.emailVerified ?? false,
                        phoneVerified: app.phoneVerified ?? false,
                    }))

                    if (app.currentStep > 1) {
                        alert(`👋 Hola ${app.firstName}, hemos recuperado tu progreso hasta el paso ${app.currentStep}.`)
                        setStep(app.currentStep)
                    }
                } else if (res.status === 409 && res.ok === false) {
                    // Estado bloqueado (APPROVED, IN_REVIEW, etc)
                    alert(`🚫 ${data.error || 'Ya tienes una solicitud procesada con este RUT.'}`)
                    // Salir y resetear
                    resetForm()
                    setScreen('landing')
                }
            } catch (e) {
                console.warn('Error al verificar RUT existente')
            }
        } else if (formatted.length >= 10) {
            setRutValid(false)
        } else {
            setRutValid(null)
        }
    }

    const saveStep = async () => {
        console.log('[DB] Guardando etapa:', step)
        try {
            const body: any = { step, applicationId: appId, ...form }
            if (step === (shouldSkipStep6 ? 8 : 9)) body.status = 'SUBMITTED'

            const res = await fetch('/api/driver-applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await res.json()

            if (res.status === 409 && data.existingId) {
                setAppId(data.existingId)
                return data.existingId as string
            }

            if (!res.ok) {
                alert(`⚠️ No se pudo guardar el progreso: ${data.error || 'Error desconocido'}`)
                return null
            }

            if (data.id) {
                setAppId(data.id)
                if (data.trackingCode) setTrackingCode(data.trackingCode)
                return data.id as string
            }
            return 'OK'
        } catch (e) {
            console.error('[DB ERROR]', e)
            return null
        }
    }

    // ── Validación por paso ──
    const validateStep = (): boolean => {
        const errs: Record<string, string> = {}

        if (step === 1) {
            if (!form.firstName.trim()) errs.firstName = 'Ingresa tu nombre'
            if (!form.lastNameP.trim()) errs.lastNameP = 'Ingresa tu apellido paterno'
            if (!form.rut || !validateRut(form.rut)) errs.rut = 'Tu RUT no es válido — revisa el último dígito'
            if (!form.birthDate) errs.birthDate = 'Selecciona tu fecha de nacimiento'
            else if (calcAge(form.birthDate) < 18) errs.birthDate = 'Lo sentimos, debes ser mayor de 18 años para postular 🙁'
            if (!form.email.includes('@')) errs.email = 'Ingresa un correo válido'
            if (!form.phone || form.phone.length < 8) errs.phone = 'Ingresa un teléfono válido (+56 9 XXXX XXXX)'
            if (form.nationality !== 'CL' && !form.foreignDocNumber) errs.foreignDocNumber = 'Ingresa tu número de documento'
        }

        if (step === 2) {
            if (!form.street.trim()) errs.street = 'Ingresa tu calle'
            if (!form.streetNumber.trim()) errs.streetNumber = 'Ingresa el número'
            if (!form.comuna) errs.comuna = 'Selecciona tu comuna'
        }

        if (step === 3) {
            if (!form.password || form.password.length < 8) errs.password = 'Mínimo 8 caracteres'
            if (!/[A-Z]/.test(form.password)) errs.password = 'Debe tener al menos 1 mayúscula'
            if (!/[0-9]/.test(form.password)) errs.password = 'Debe tener al menos 1 número'
            if (form.password !== form.passwordConfirm) errs.passwordConfirm = 'Las contraseñas no coinciden'

            if (!form.emailVerified) errs.emailVerified = 'Debes validar tu correo'
        }

        if (step === 5) {
            if (!form.vehicleType) errs.vehicleType = 'Selecciona tu tipo de vehículo'
        }

        if (step === 8) {
            if (!form.bankName) errs.bankName = 'Selecciona tu banco'
            if (!form.accountType) errs.accountType = 'Selecciona tipo de cuenta'
            if (!form.accountNumber) errs.accountNumber = 'Ingresa el número de cuenta'
        }

        if (step === 9) {
            if (!form.contractFullname.trim()) errs.contractFullname = 'Ingresa tu nombre completo'
            if (!form.emailVerified) errs.contractSignature = 'Debes validar primero tu correo en el paso 3'
        }

        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const nextStep = async () => {
        if (!validateStep()) return
        const saved = await saveStep()
        if (!saved) return

        if (step === (shouldSkipStep6 ? 9 : 10)) {
            setScreen('done')
        } else {
            setStep(s => s + 1)
            window.scrollTo(0, 0)
        }
    }

    const prevStep = () => {
        if (step > 1) { setStep(s => s - 1); window.scrollTo(0, 0) }
    }

    // ── Saltar paso 6 si bicicleta normal ──
    const shouldSkipStep6 = form.vehicleType === 'BICYCLE' || (form.vehicleType === 'EBIKE' && form.ebikePower === 'UNDER_50CC')

    useEffect(() => {
        if (step === 6 && shouldSkipStep6) setStep(7)
    }, [step, shouldSkipStep6])

    // ── Mantener bankRut sincronizado con RUT principal ──
    useEffect(() => {
        if (form.rut) {
            setForm(prev => ({ ...prev, bankRut: prev.rut }))
        }
    }, [form.rut])

    /* ═══════════════════════════════════════
       LANDING PAGE
       ═══════════════════════════════════════ */
    if (screen === 'landing') {
        return (
            <div className="dr-landing">
                {/* Viewport Meta for Mobile Implementation */}
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />

                <section className="dr-hero">
                    <div className="dr-logo-badge">🛵 PideloYA Drivers</div>
                    <h1>
                        Gana <span className="dr-highlight">dinero extra</span><br />
                        repartiendo con nosotros
                    </h1>
                    <p className="dr-hero-sub">
                        Trabaja cuando quieras, cobra cada semana y sé parte de la red de delivery
                        que está creciendo en todo Chile. Sin jefes, sin horarios fijos.
                    </p>
                    <div className="dr-stats-row">
                        <div className="dr-stat">
                            <div className="dr-stat-value">2,400+</div>
                            <div className="dr-stat-label">Drivers activos</div>
                        </div>
                        <div className="dr-stat">
                            <div className="dr-stat-value">15</div>
                            <div className="dr-stat-label">Ciudades</div>
                        </div>
                        <div className="dr-stat">
                            <div className="dr-stat-value">$320k</div>
                            <div className="dr-stat-label">Promedio semanal</div>
                        </div>
                    </div>
                    <button className="dr-cta-primary" onClick={() => setScreen('form')}>
                        🚀 Quiero ser repartidor
                    </button>
                    <a className="dr-cta-secondary" href="/registro-driver/estado">
                        Ya tengo una solicitud → Ver estado
                    </a>
                </section>

                <section className="dr-benefits">
                    <div className="dr-benefit-card">
                        <div className="dr-benefit-icon">💰</div>
                        <h3>Pago Semanal Garantizado</h3>
                        <p>Recibe tu pago directamente en tu cuenta todos los viernes. Sin atrasos, sin excusas.</p>
                    </div>
                    <div className="dr-benefit-card">
                        <div className="dr-benefit-icon">🕐</div>
                        <h3>Horario 100% Flexible</h3>
                        <p>Conéctate cuando quieras. Tú decides tus horarios, tus días y tu zona de trabajo.</p>
                    </div>
                    <div className="dr-benefit-card">
                        <div className="dr-benefit-icon">🛡️</div>
                        <h3>Seguro y Cobertura</h3>
                        <p>Estás cubierto con nuestro seguro de accidentes mientras repartes con PideloYA.</p>
                    </div>
                    <div className="dr-benefit-card">
                        <div className="dr-benefit-icon">📱</div>
                        <h3>App Fácil de Usar</h3>
                        <p>Nuestra app te guía en cada entrega. GPS en tiempo real, notificaciones y soporte 24/7.</p>
                    </div>
                    <div className="dr-benefit-card">
                        <div className="dr-benefit-icon">🚲</div>
                        <h3>Cualquier Vehículo</h3>
                        <p>Bicicleta, moto o auto. Todos son bienvenidos en nuestra flota de repartidores.</p>
                    </div>
                    <div className="dr-benefit-card">
                        <div className="dr-benefit-icon">🌟</div>
                        <h3>Bonos por Rendimiento</h3>
                        <p>Gana más con nuestro sistema de bonificaciones por entregas, horario peak y fidelidad.</p>
                    </div>
                </section>

                <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <button className="dr-cta-primary" onClick={() => { resetForm(); setScreen('form'); }}>
                        🚀 Postula ahora — Toma 10 minutos
                    </button>
                </div>
            </div>
        )
    }

    /* ═══════════════════════════════════════
       CONFIRMACIÓN (PANTALLA 9)
       ═══════════════════════════════════════ */
    if (screen === 'done') {
        return (
            <div className="dr-form-page">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <div className="dr-confetti">
                    <div className="dr-confetti-emoji">🎉</div>
                    <h2>¡Bienvenido a la familia PideloYA!</h2>
                    <p style={{ color: 'var(--dr-text-secondary)', maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}>
                        Tu solicitud fue enviada exitosamente. Revisaremos tus datos en las próximas
                        <strong style={{ color: 'var(--dr-yellow)' }}> 24 a 48 horas hábiles</strong>.
                    </p>
                    <p style={{ color: 'var(--dr-text-muted)', fontSize: 13, marginBottom: 32 }}>
                        Te enviamos un correo a <strong>{form.email}</strong> con los detalles.
                    </p>
                    <div style={{ background: 'var(--dr-card)', border: '1px solid var(--dr-border)', borderRadius: 16, padding: 24, maxWidth: 400, margin: '0 auto 24px', textAlign: 'left' }}>
                        <div style={{ fontSize: 12, color: 'var(--dr-text-muted)', marginBottom: 4 }}>CÓDIGO DE SEGUIMIENTO</div>
                        <div style={{ fontFamily: 'var(--dr-font-display)', fontSize: 20, color: 'var(--dr-yellow)', wordBreak: 'break-all' }}>{trackingCode || 'GENERANDO...'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                        <a href={`/registro-driver/contrato/${appId}`} className="dr-cta-primary" style={{ textDecoration: 'none', width: 'auto', background: 'var(--dr-green)' }}>
                            📄 Ver y descargar mi Contrato
                        </a>
                        <a href={`/registro-driver/estado?t=${trackingCode}`} className="dr-cta-secondary" style={{ textDecoration: 'none', width: 'auto', border: '1px solid var(--dr-border)' }}>
                            📋 Ver estado de mi solicitud
                        </a>
                        <button
                            className="dr-btn-ghost"
                            onClick={() => { resetForm(); setScreen('landing'); }}
                            style={{ background: 'transparent', border: '1px solid var(--dr-border)', color: 'var(--dr-text-secondary)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    /* ═══════════════════════════════════════
       FORMULARIO MULTI-STEP
       ═══════════════════════════════════════ */
    const totalSteps = shouldSkipStep6 ? 9 : 10
    const progress = (step / totalSteps) * 100

    return (
        <div className="dr-form-page">
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />

            {/* PROGRESS BAR */}
            <div className="dr-progress-bar">
                <div className="dr-progress-info">
                    <div className="dr-progress-step">Paso <span>{step}</span> de {totalSteps} · {STEP_LABELS[step - 1]}</div>
                    <div className="dr-progress-step" style={{ color: 'var(--dr-text-muted)' }}>
                        {step <= 2 ? 'Solo te faltan unos pasos 🚀' : step >= 7 ? '¡Ya casi! 🎉' : 'Vas muy bien 💪'}
                    </div>
                </div>
                <div className="dr-progress-track">
                    <div className="dr-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {isLocked && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--dr-red)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                    textAlign: 'center',
                    color: 'var(--dr-red)',
                    fontWeight: 700,
                    margin: '0 20px 24px'
                }}>
                    🔒 Esta solicitud está en estado <strong>{form.status}</strong> y no puede ser modificada.
                </div>
            )}

            <div className={`dr-form-container ${isLocked ? 'dr-locked' : ''}`}>

                {/* ── PASO 1: DATOS PERSONALES ── */}
                {step === 1 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Datos Personales</h2>
                            <p>Cuéntanos un poco sobre ti. Esto nos ayuda a protegerte.</p>
                        </div>
                        <div className="dr-row">
                            <div className="dr-field">
                                <label className="dr-label">Nombre</label>
                                <input className={`dr-input ${errors.firstName ? 'dr-error' : ''}`} placeholder="Ej: Juan" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                                {errors.firstName && <div className="dr-error-msg">⚠️ {errors.firstName}</div>}
                            </div>
                            <div className="dr-field">
                                <label className="dr-label">Apellido Paterno</label>
                                <input className={`dr-input ${errors.lastNameP ? 'dr-error' : ''}`} placeholder="Ej: Pérez" value={form.lastNameP} onChange={e => set('lastNameP', e.target.value)} />
                                {errors.lastNameP && <div className="dr-error-msg">⚠️ {errors.lastNameP}</div>}
                            </div>
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Apellido Materno (opcional)</label>
                            <input className="dr-input" placeholder="Ej: González" value={form.lastNameM} onChange={e => set('lastNameM', e.target.value)} />
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">RUT</label>
                            <input className={`dr-input ${rutValid === false ? 'dr-error' : rutValid === true ? 'dr-success' : ''}`} placeholder="12.345.678-9" value={form.rut} onChange={e => handleRut(e.target.value)} maxLength={12} />
                            {rutValid === false && <div className="dr-error-msg">⚠️ Tu RUT no es válido — revisa el último dígito</div>}
                            {rutValid === true && <div style={{ color: 'var(--dr-green)', fontSize: 13, marginTop: 6 }}>✅ RUT válido</div>}
                        </div>
                        <div className="dr-row">
                            <div className="dr-field">
                                <label className="dr-label">Fecha de Nacimiento</label>
                                <input type="date" className={`dr-input ${errors.birthDate ? 'dr-error' : ''}`} value={form.birthDate} onChange={e => set('birthDate', e.target.value)} disabled={isLocked} />
                                {errors.birthDate && <div className="dr-error-msg">⚠️ {errors.birthDate}</div>}
                            </div>
                            <div className="dr-field">
                                <label className="dr-label">Sexo (opcional)</label>
                                <select className="dr-input dr-select" value={form.gender} onChange={e => set('gender', e.target.value)} disabled={isLocked}>
                                    <option value="">Seleccionar</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="O">Otro</option>
                                    <option value="PREFER_NOT">Prefiero no decir</option>
                                </select>
                            </div>
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Correo Electrónico</label>
                            <input
                                type="email"
                                className={`dr-input ${errors.email ? 'dr-error' : ''}`}
                                placeholder="tu@correo.com"
                                value={form.email}
                                disabled={isLocked}
                                onChange={e => {
                                    const val = e.target.value
                                    set('email', val)
                                    // Si cambia el mail y ya estaba verificado, invalidar
                                    if (form.emailVerified) {
                                        setForm(prev => ({ ...prev, emailVerified: false }))
                                    }
                                }}
                            />
                            {errors.email && <div className="dr-error-msg">⚠️ {errors.email}</div>}
                            {form.emailVerified && <div style={{ color: 'var(--dr-green)', fontSize: 12, marginTop: 4 }}>✓ Correo verificado. (Si lo cambias, deberás validarlo de nuevo)</div>}
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Teléfono</label>
                            <input className={`dr-input ${errors.phone ? 'dr-error' : ''}`} placeholder="+56 9 1234 5678" value={form.phone} onChange={e => set('phone', e.target.value)} disabled={isLocked} />
                            {errors.phone && <div className="dr-error-msg">⚠️ {errors.phone}</div>}
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Nacionalidad</label>
                            <select className="dr-input dr-select" value={form.nationality} onChange={e => set('nationality', e.target.value)} disabled={isLocked}>
                                <option value="CL">🇨🇱 Chile</option>
                                <option value="VE">🇻🇪 Venezuela</option>
                                <option value="CO">🇨🇴 Colombia</option>
                                <option value="PE">🇵🇪 Perú</option>
                                <option value="HT">🇭🇹 Haití</option>
                                <option value="BO">🇧🇴 Bolivia</option>
                                <option value="OTHER">Otra</option>
                            </select>
                        </div>
                        {form.nationality !== 'CL' && (
                            <div className="dr-row">
                                <div className="dr-field">
                                    <label className="dr-label">Tipo de Documento</label>
                                    <select className="dr-input dr-select" value={form.foreignDocType} onChange={e => set('foreignDocType', e.target.value)} disabled={isLocked}>
                                        <option value="">Seleccionar</option>
                                        <option value="CEDULA_EXT">Cédula de Extranjería</option>
                                        <option value="PASSPORT">Pasaporte</option>
                                        <option value="RESIDENCIA_TRAMITE">Residencia en Trámite</option>
                                    </select>
                                </div>
                                <div className="dr-field">
                                    <label className="dr-label">N° Documento</label>
                                    <input className={`dr-input ${errors.foreignDocNumber ? 'dr-error' : ''}`} placeholder="Número" value={form.foreignDocNumber} onChange={e => set('foreignDocNumber', e.target.value)} disabled={isLocked} />
                                    {errors.foreignDocNumber && <div className="dr-error-msg">⚠️ {errors.foreignDocNumber}</div>}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── PASO 2: DIRECCIÓN ── */}
                {step === 2 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Dirección de Residencia</h2>
                            <p>¿Dónde vives? Esto nos ayuda a asignarte pedidos cerca de tu zona.</p>
                        </div>
                        <div className="dr-row">
                            <div className="dr-field" style={{ flex: 2 }}>
                                <label className="dr-label">Calle</label>
                                <input className={`dr-input ${errors.street ? 'dr-error' : ''}`} placeholder="Av. Providencia" value={form.street} onChange={e => set('street', e.target.value)} />
                                {errors.street && <div className="dr-error-msg">⚠️ {errors.street}</div>}
                            </div>
                            <div className="dr-field">
                                <label className="dr-label">Número</label>
                                <input className={`dr-input ${errors.streetNumber ? 'dr-error' : ''}`} placeholder="1234" value={form.streetNumber} onChange={e => set('streetNumber', e.target.value)} />
                                {errors.streetNumber && <div className="dr-error-msg">⚠️ {errors.streetNumber}</div>}
                            </div>
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Depto / Casa (opcional)</label>
                            <input className="dr-input" placeholder="Depto 302, Torre B" value={form.apartment} onChange={e => set('apartment', e.target.value)} />
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Región</label>
                            <select className="dr-input dr-select" value={form.region} onChange={e => set('region', e.target.value)}>
                                {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Comuna</label>
                            <select className={`dr-input dr-select ${errors.comuna ? 'dr-error' : ''}`} value={form.comuna} onChange={e => set('comuna', e.target.value)} disabled={isLocked}>
                                <option value="">Seleccionar</option>
                                {COMUNAS_RM.sort().map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.comuna && <div className="dr-error-msg">⚠️ {errors.comuna}</div>}
                        </div>
                    </>
                )}

                {/* ── PASO 3: VERIFICACIÓN ── */}
                {step === 3 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Verificación de Seguridad</h2>
                            <p>Valida tu identidad y crea una contraseña segura.</p>
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Contraseña de acceso</label>
                            <input type="password" className={`dr-input ${errors.password ? 'dr-error' : ''}`} placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => set('password', e.target.value)} />
                            <div className={`dr-strength-bar ${passwordStrength(form.password)}`} />
                            {errors.password && <div className="dr-error-msg">⚠️ {errors.password}</div>}
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Repetir contraseña</label>
                            <input type="password" className={`dr-input ${errors.passwordConfirm ? 'dr-error' : ''}`} placeholder="Confirmar" value={form.passwordConfirm} onChange={e => set('passwordConfirm', e.target.value)} />
                            {errors.passwordConfirm && <div className="dr-error-msg">⚠️ {errors.passwordConfirm}</div>}
                        </div>

                        <div style={{ height: 2, background: 'var(--dr-border)', margin: '32px 0' }} />

                        {/* VERIFICACIÓN EMAIL */}
                        <div className={`dr-verify-card ${form.emailVerified ? 'verified' : ''}`} style={{ background: 'var(--dr-card)', padding: 20, borderRadius: 16, border: '1px solid var(--dr-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>📧 Validar Correo Electrónico</div>
                                {form.emailVerified ? <span style={{ color: 'var(--dr-green)', fontWeight: 700, fontSize: 11, background: 'rgba(34,197,94,0.1)', padding: '4px 8px', borderRadius: 6 }}>✅ VERIFICADO</span> : <span style={{ color: 'var(--dr-accent)', fontWeight: 700, fontSize: 11, background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 6 }}>PENDIENTE</span>}
                            </div>
                            <div style={{ color: 'var(--dr-text-muted)', fontSize: 13, marginBottom: 16 }}>Recibirás un código de 4 dígitos en <strong>{form.email}</strong></div>

                            {!form.emailVerified && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        className="dr-input"
                                        placeholder="Ingresa código"
                                        title="Código de verificación"
                                        aria-label="Código de verificación de correo"
                                        style={{ flex: 1, fontSize: 14 }}
                                        value={verifyCodes.email}
                                        onChange={e => setVerifyCodes(v => ({ ...v, email: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        className="dr-btn-ghost"
                                        onClick={(e) => { e.preventDefault(); handleSendCode('email'); }}
                                        disabled={loadingVerify === 'email-send'}
                                        style={{ width: 'auto', padding: '0 16px', fontSize: 13 }}
                                    >
                                        {loadingVerify === 'email-send' ? '...' : 'Enviar'}
                                    </button>
                                    <button
                                        type="button"
                                        className="dr-btn-ghost"
                                        onClick={(e) => { e.preventDefault(); handleCheckCode('email'); }}
                                        disabled={!verifyCodes.email || loadingVerify === 'email-check'}
                                        style={{ width: 'auto', padding: '0 16px', background: 'var(--dr-yellow)', color: 'black', fontWeight: 700, border: 'none', fontSize: 13 }}
                                    >
                                        Validar
                                    </button>
                                </div>
                            )}
                        </div>

                        {errors.emailVerified && (
                            <div className="dr-error-msg" style={{ marginTop: 20 }}>
                                ⚠️ Debes validar tu correo para continuar.
                            </div>
                        )}
                    </>
                )}

                {/* ── PASO 4: IDENTIDAD ── */}
                {step === 4 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Verificación de Identidad</h2>
                            <p>Sube fotos de tu documento de identidad. Esto nos ayuda a protegerte.</p>
                        </div>
                        <FileUpload
                            label="📸 Foto Frente Cédula"
                            hint="Toca para subir la parte frontal de tu cédula"
                            subhint="JPG, PNG o PDF · Máx 10MB"
                            accept="image/*,.pdf"
                            capture="environment"
                            file={uploads.idFront || null}
                            onChange={(f) => handleFileChange('idFront', f)}
                            disabled={isLocked}
                        />
                        <FileUpload
                            label="📸 Foto Reverso Cédula"
                            hint="Toca para subir el reverso de tu cédula"
                            accept="image/*,.pdf"
                            capture="environment"
                            file={uploads.idBack || null}
                            onChange={(f) => handleFileChange('idBack', f)}
                            disabled={isLocked}
                        />
                        <FileUpload
                            label="🤳 Selfie en Tiempo Real"
                            hint="Toca para tomar una selfie"
                            subhint="Se abrirá la cámara frontal"
                            accept="image/*"
                            capture="user"
                            file={uploads.selfie || null}
                            onChange={(f) => handleFileChange('selfie', f)}
                            disabled={isLocked}
                        />
                    </>
                )}

                {/* ── PASO 5: VEHÍCULO ── */}
                {step === 5 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Tipo de Vehículo</h2>
                            <p>¿Con qué te mueves? Selecciona tu vehículo principal.</p>
                        </div>
                        {errors.vehicleType && <div className="dr-error-msg" style={{ marginBottom: 12 }}>⚠️ {errors.vehicleType}</div>}
                        <div className="dr-vehicle-grid">
                            {[
                                { id: 'BICYCLE', emoji: '🚲', name: 'Bicicleta' },
                                { id: 'EBIKE', emoji: '⚡', name: 'Bici Eléctrica' },
                                { id: 'MOTORCYCLE', emoji: '🏍️', name: 'Moto' },
                                { id: 'CAR', emoji: '🚗', name: 'Automóvil' },
                            ].map(v => (
                                <div key={v.id} className={`dr-vehicle-card ${form.vehicleType === v.id ? 'dr-selected' : ''} ${isLocked ? 'locked' : ''}`} onClick={() => !isLocked && set('vehicleType', v.id)}>
                                    <span className="dr-vehicle-emoji">{v.emoji}</span>
                                    <span className="dr-vehicle-name">{v.name}</span>
                                </div>
                            ))}
                        </div>
                        {form.vehicleType === 'EBIKE' && (
                            <div className="dr-field" style={{ marginTop: 20 }}>
                                <label className="dr-label">Potencia del motor</label>
                                <div className="dr-row">
                                    <div className={`dr-vehicle-card ${form.ebikePower === 'UNDER_50CC' ? 'dr-selected' : ''} ${isLocked ? 'locked' : ''}`} onClick={() => !isLocked && set('ebikePower', 'UNDER_50CC')} style={{ padding: 16 }}>
                                        <span className="dr-vehicle-name">Menos de 50cc</span>
                                    </div>
                                    <div className={`dr-vehicle-card ${form.ebikePower === 'OVER_50CC' ? 'dr-selected' : ''} ${isLocked ? 'locked' : ''}`} onClick={() => !isLocked && set('ebikePower', 'OVER_50CC')} style={{ padding: 16 }}>
                                        <span className="dr-vehicle-name">50cc o más</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── PASO 6: DOCUMENTOS VEHÍCULO ── */}
                {step === 6 && !shouldSkipStep6 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Documentos del Vehículo</h2>
                            <p>Necesitamos los siguientes documentos para verificar tu {form.vehicleType === 'MOTORCYCLE' ? 'moto' : 'vehículo'}.</p>
                        </div>
                        {[
                            { key: 'licFront', label: 'Licencia de Conducir (Frente)' },
                            { key: 'licBack', label: 'Licencia de Conducir (Reverso)' },
                            { key: 'circulation', label: 'Permiso de Circulación' },
                            { key: 'soap', label: 'SOAP Vigente' },
                        ].map((doc) => (
                            <FileUpload
                                key={doc.key}
                                label={doc.label}
                                hint="Toca para subir o tomar foto"
                                accept="image/*,.pdf"
                                capture="environment"
                                file={uploads[doc.key] || null}
                                onChange={(f) => handleFileChange(doc.key, f)}
                            />
                        ))}
                        {form.vehicleType === 'CAR' && (
                            <FileUpload
                                label="Revisión Técnica Vigente"
                                hint="Toca para subir o tomar foto"
                                accept="image/*,.pdf"
                                capture="environment"
                                file={uploads.techReview || null}
                                onChange={(f) => handleFileChange('techReview', f)}
                            />
                        )}
                    </>
                )}

                {/* ── PASO 7: ANTECEDENTES ── */}
                {step === 7 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Certificado de Antecedentes</h2>
                            <p>Es obligatorio para todos. Puedes obtenerlo gratis en el Registro Civil.</p>
                        </div>
                        <FileUpload
                            label="📋 Certificado de Antecedentes"
                            hint="Sube tu Certificado de Antecedentes"
                            subhint="Máximo 30 días desde su emisión · PDF o imagen"
                            accept="image/*,.pdf"
                            file={uploads.background || null}
                            onChange={(f) => handleFileChange('background', f)}
                        />
                        <div style={{ background: 'var(--dr-card)', border: '1px solid var(--dr-border)', borderRadius: 12, padding: 20, marginTop: 20 }}>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>📌 ¿Cómo obtenerlo?</div>
                            <ol style={{ color: 'var(--dr-text-secondary)', fontSize: 14, lineHeight: 2, paddingLeft: 20 }}>
                                <li>Ingresa a <a href="https://www.registrocivil.cl" target="_blank" style={{ color: 'var(--dr-red)' }}>registrocivil.cl</a></li>
                                <li>Busca «Certificado de Antecedentes para Fines Particulares»</li>
                                <li>Ingresa con tu ClaveÚnica o datos personales</li>
                                <li>Descarga el PDF y súbelo aquí</li>
                            </ol>
                            <div style={{ color: 'var(--dr-green)', fontSize: 13, marginTop: 8 }}>✅ Es gratuito y lo obtienes en menos de 5 minutos</div>
                        </div>
                    </>
                )}

                {/* ── PASO 8: DATOS BANCARIOS ── */}
                {step === 8 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Datos Bancarios</h2>
                            <p>Aquí recibirás tus pagos semanales. Asegúrate de que el RUT sea el mismo.</p>
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Banco</label>
                            <select className={`dr-input dr-select ${errors.bankName ? 'dr-error' : ''}`} value={form.bankName} onChange={e => set('bankName', e.target.value)} disabled={isLocked}>
                                <option value="">Selecciona tu banco</option>
                                {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            {errors.bankName && <div className="dr-error-msg">⚠️ {errors.bankName}</div>}
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Tipo de Cuenta</label>
                            <select className={`dr-input dr-select ${errors.accountType ? 'dr-error' : ''}`} value={form.accountType} onChange={e => set('accountType', e.target.value)} disabled={isLocked}>
                                <option value="">Seleccionar</option>
                                <option value="CORRIENTE">Cuenta Corriente</option>
                                <option value="VISTA">Cuenta Vista / RUT</option>
                                <option value="CHEQUERA">Chequera Electrónica</option>
                                <option value="DIGITAL">Cuenta Digital</option>
                            </select>
                            {errors.accountType && <div className="dr-error-msg">⚠️ {errors.accountType}</div>}
                        </div>
                        <div className="dr-field">
                            <label className="dr-label">Número de Cuenta</label>
                            <input className={`dr-input ${errors.accountNumber ? 'dr-error' : ''}`} placeholder="Ej: 12345678" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} disabled={isLocked} />
                            {errors.accountNumber && <div className="dr-error-msg">⚠️ {errors.accountNumber}</div>}
                        </div>
                        <div style={{ background: 'var(--dr-yellow-soft)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 12, padding: 16, marginTop: 12 }}>
                            <div style={{ color: 'var(--dr-yellow)', fontWeight: 700, fontSize: 13 }}>
                                ⚠️ El RUT titular de la cuenta debe coincidir con tu RUT: <strong>{form.rut || '—'}</strong>
                            </div>
                        </div>
                    </>
                )}

                {/* ── PASO 9: CONTRATO & FIRMA ── */}
                {step === 9 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Contrato de Prestación de Servicios</h2>
                            <p>Lee atentamente el contrato y firma electrónicamente para finalizar.</p>
                        </div>
                        <div style={{ background: '#000', color: '#0f0', padding: 20, borderRadius: 8, fontSize: 12, fontFamily: 'monospace', height: 250, overflowY: 'auto', marginBottom: 20, border: '1px solid #333' }}>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{CONTRACT_BODY}</pre>
                            <div style={{ marginTop: 20, color: '#fff', borderTop: '1px solid #333', paddingTop: 10 }}>
                                <p>ID DE CONTRATO: {appId?.substring(0, 8).toUpperCase()}</p>
                                <p>FIRMANTE: {form.firstName} {form.lastNameP}</p>
                                <p>RUT: {form.rut}</p>
                            </div>
                        </div>

                        <div className="dr-field">
                            <label className="dr-label">Nombre Completo para Firma</label>
                            <input
                                className={`dr-input ${errors.contractFullname ? 'dr-error' : ''}`}
                                placeholder="Ej: Juan Antonio Pérez González"
                                value={form.contractFullname}
                                onChange={e => set('contractFullname', e.target.value)}
                                disabled={isLocked}
                            />
                            <p style={{ fontSize: 11, color: 'var(--dr-text-muted)', marginTop: 4 }}>Al escribir tu nombre, confirmas que has leído y aceptas los términos del contrato.</p>
                            {errors.contractFullname && <div className="dr-error-msg">⚠️ {errors.contractFullname}</div>}
                        </div>

                        {!form.emailVerified ? (
                            <div style={{ background: 'var(--dr-yellow-soft)', padding: 16, borderRadius: 12, border: '1px solid var(--dr-yellow)', color: 'var(--dr-yellow)', fontSize: 13 }}>
                                ⚠️ Debes validar tu correo electrónico primero (paso 3) para poder firmar.
                            </div>
                        ) : (
                            <div className="dr-row" style={{ alignItems: 'flex-end', gap: 12 }}>
                                <div className="dr-field" style={{ flex: 1 }}>
                                    <label className="dr-label">Código de Validación Civil (vía Email)</label>
                                    <input
                                        className="dr-input"
                                        placeholder="4 dígitos"
                                        value={verifyCodes.email}
                                        onChange={e => setVerifyCodes(v => ({ ...v, email: e.target.value }))}
                                        maxLength={4}
                                    />
                                </div>
                                <div style={{ paddingBottom: 8 }}>
                                    <button
                                        className="dr-btn-secondary"
                                        style={{ height: 48 }}
                                        onClick={() => handleSendCode('email')}
                                        disabled={loadingVerify !== null}
                                    >
                                        {loadingVerify === 'email-send' ? '...' : 'Re-enviar'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── PASO 10: REVISIÓN FINAL ── */}
                {step === 10 && (
                    <>
                        <div className="dr-form-header">
                            <h2>Revisa tu Solicitud</h2>
                            <p>Verifica que todo esté correcto antes de enviar.</p>
                        </div>
                        {[
                            { label: 'Nombre', value: `${form.firstName} ${form.lastNameP} ${form.lastNameM}` },
                            { label: 'RUT', value: form.rut },
                            { label: 'Email', value: form.email },
                            { label: 'Teléfono', value: form.phone },
                            { label: 'Dirección', value: `${form.street} ${form.streetNumber}, ${form.comuna}` },
                            { label: 'Vehículo', value: form.vehicleType },
                            { label: 'Banco', value: `${form.bankName} — ${form.accountType}` },
                            { label: 'Contrato', value: 'Firmado Electrónicamente ✓' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--dr-border)' }}>
                                <span style={{ color: 'var(--dr-text-muted)', fontSize: 13 }}>{item.label}</span>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.value || '—'}</span>
                            </div>
                        ))}
                    </>
                )}

            </div>

            {/* STICKY CTA */}
            <div className="dr-footer-cta">
                <div className="dr-footer-inner">
                    {step > 1 && (
                        <button className="dr-btn-back" onClick={prevStep} disabled={isLocked}>← Atrás</button>
                    )}
                    <button className="dr-btn-next" onClick={nextStep} disabled={isLocked}>
                        {step === (shouldSkipStep6 ? 9 : 10) ? '✅ Enviar Solicitud' : `Continuar →`}
                    </button>
                </div>
            </div>
        </div >
    )
}

// ── FileUpload Component con soporte de cámara móvil ──
function FileUpload({ label, hint, subhint, accept, capture, file, onChange, disabled }: {
    label: string
    hint: string
    subhint?: string
    accept?: string
    capture?: 'user' | 'environment'
    file: { file: File; preview: string } | null
    onChange: (f: File | null) => void
    disabled?: boolean
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    return (
        <div className={`dr-field ${disabled ? 'dr-disabled-field' : ''}`}>
            <label className="dr-label">{label}</label>
            <div
                className="dr-upload-zone"
                onClick={() => !disabled && inputRef.current?.click()}
                style={{ cursor: disabled ? 'default' : 'pointer', position: 'relative', overflow: 'hidden', opacity: disabled ? 0.6 : 1 }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept || 'image/*,.pdf'}
                    {...(capture ? { capture } : {})}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.files?.[0] || null)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    aria-label={label}
                />
                {disabled && !file && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 18 }}>🔒</div>}
                {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                        {file.file.type.startsWith('image/') ? (
                            <img
                                src={file.preview}
                                alt="Preview"
                                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--dr-green)' }}
                            />
                        ) : (
                            <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dr-bg)', borderRadius: 8, fontSize: 24 }}>
                                📄
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--dr-green)', fontWeight: 700, fontSize: 13 }}>✅ Archivo seleccionado</div>
                            <div style={{ color: 'var(--dr-text-muted)', fontSize: 12, marginTop: 2 }}>
                                {file.file.name.length > 30 ? file.file.name.substring(0, 27) + '...' : file.file.name}
                            </div>
                            <div style={{ color: 'var(--dr-text-muted)', fontSize: 11 }}>
                                {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </div>
                        <div style={{ color: 'var(--dr-accent)', fontSize: 12, fontWeight: 600 }}>Cambiar</div>
                    </div>
                ) : (
                    <>
                        <div className="dr-upload-icon">{capture === 'user' ? '📷' : '📄'}</div>
                        <div className="dr-upload-text">{hint}</div>
                        {subhint && <div style={{ color: 'var(--dr-text-muted)', fontSize: 12, marginTop: 8 }}>{subhint}</div>}
                    </>
                )}
            </div>
        </div>
    )
}
