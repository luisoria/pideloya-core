'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import '../registro.css'

function EstadoContent() {
    const searchParams = useSearchParams()
    const [tracking, setTracking] = useState(searchParams.get('t') || '')
    const [email, setEmail] = useState('')
    const [rut, setRut] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [application, setApplication] = useState<any>(null)

    const fetchStatus = async (code?: string) => {
        setLoading(true)
        setError(null)
        try {
            const query = code ? `tracking=${code}` : `email=${email}&rut=${rut}`
            const res = await fetch(`/api/driver-applications?${query}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'No se pudo encontrar la solicitud')
            setApplication(data)
        } catch (err: any) {
            setError(err.message)
            setApplication(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (tracking) {
            fetchStatus(tracking)
        }
    }, [])

    if (application) {
        const statusMap: any = {
            DRAFT: { label: 'Borrador', color: 'var(--dr-text-muted)', icon: '✏️' },
            SUBMITTED: { label: 'Enviada', color: 'var(--dr-blue)', icon: '📋' },
            IN_REVIEW: { label: 'En Revisión', color: 'var(--dr-yellow)', icon: '🔍' },
            DOCS_INCOMPLETE: { label: 'Documentos Incompletos', color: 'var(--dr-accent)', icon: '📄' },
            APPROVED: { label: 'Aprobada', color: 'var(--dr-green)', icon: '✅' },
            REJECTED: { label: 'Rechazada', color: 'var(--dr-red)', icon: '❌' },
        }
        const s = statusMap[application.status] || statusMap.DRAFT

        return (
            <div className="dr-form-page">
                <div className="dr-form-container" style={{ maxWidth: 600, paddingTop: 60, paddingBottom: 60 }}>
                    <div className="dr-form-header">
                        <div style={{ fontSize: 40, marginBottom: 16 }}>{s.icon}</div>
                        <h2>Estado de tu Solicitud</h2>
                        <p>Código: <span style={{ color: 'var(--dr-yellow)', fontWeight: 700 }}>{application.trackingCode}</span></p>
                    </div>

                    <div style={{ background: 'var(--dr-card)', border: '1px solid var(--dr-border)', borderRadius: 20, padding: 32, textAlign: 'center' }}>
                        <div style={{ fontSize: 13, color: 'var(--dr-text-muted)', marginBottom: 8, letterSpacing: 1 }}>ESTADO ACTUAL</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 16 }}>{s.label}</div>
                        <p style={{ color: 'var(--dr-text-secondary)', lineHeight: 1.6 }}>
                            {application.status === 'SUBMITTED' && 'Hemos recibido tu solicitud. Un analista revisará tus documentos pronto.'}
                            {application.status === 'IN_REVIEW' && 'Tu solicitud está siendo revisada por nuestro equipo de operaciones.'}
                            {application.status === 'APPROVED' && '¡Felicidades! Tu solicitud ha sido aprobada. Pronto recibirás instrucciones para activar tu cuenta.'}
                            {application.status === 'REJECTED' && `Lo sentimos, tu solicitud fue rechazada. Motivo: ${application.rejectionReason || 'No especificado'}`}
                            {application.status === 'DOCS_INCOMPLETE' && `Necesitamos que actualices algunos documentos: ${application.rejectionReason || 'Revisa tu correo'}`}
                            {application.status === 'DRAFT' && 'Aún no has enviado tu solicitud. Por favor, completa todos los pasos.'}
                        </p>

                        <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--dr-border)', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: 'var(--dr-text-muted)' }}>Postulante:</span>
                                <strong>{application.firstName} {application.lastNameP}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: 'var(--dr-text-muted)' }}>Fecha:</span>
                                <strong>{new Date(application.createdAt).toLocaleDateString()}</strong>
                            </div>
                        </div>

                        <button className="dr-cta-primary" style={{ marginTop: 32, width: '100%' }} onClick={() => setApplication(null)}>
                            Consultar otra solicitud
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <a href="/registro-driver" style={{ color: 'var(--dr-text-muted)', fontSize: 14 }}>← Volver al inicio</a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="dr-form-page">
            <div className="dr-form-container" style={{ maxWidth: 500, paddingTop: 80, paddingBottom: 60 }}>
                <div className="dr-form-header">
                    <h2>Consulta tu Solicitud</h2>
                    <p>Ingresa tu código de seguimiento o tus datos de registro.</p>
                </div>

                <div className="dr-form-card">
                    <div className="dr-field">
                        <label className="dr-label">Código de Seguimiento</label>
                        <input
                            className="dr-input"
                            placeholder="Ej: d8a1-..."
                            value={tracking}
                            onChange={e => setTracking(e.target.value)}
                        />
                    </div>

                    <div style={{ textAlign: 'center', margin: '16px 0', color: 'var(--dr-text-muted)', fontSize: 13 }}>— O BIEN —</div>

                    <div className="dr-field">
                        <label className="dr-label">Correo Electrónico</label>
                        <input
                            className="dr-input"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="dr-field">
                        <label className="dr-label">RUT</label>
                        <input
                            className="dr-input"
                            placeholder="12.345.678-9"
                            value={rut}
                            onChange={e => setRut(e.target.value)}
                        />
                    </div>

                    {error && <div className="dr-error-msg" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

                    <button
                        className="dr-cta-primary"
                        style={{ width: '100%' }}
                        onClick={() => fetchStatus(tracking)}
                        disabled={loading}
                    >
                        {loading ? 'Consultando...' : 'Ver Estado'}
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <p style={{ color: 'var(--dr-text-muted)', fontSize: 14 }}>
                        ¿Aún no tienes una solicitud? <a href="/registro-driver" style={{ color: 'var(--dr-yellow)' }}>Postula aquí</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function PaginaEstado() {
    return (
        <Suspense fallback={<div className="dr-form-page" style={{ textAlign: 'center', paddingTop: 100 }}>Cargando...</div>}>
            <EstadoContent />
        </Suspense>
    )
}
