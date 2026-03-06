import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendStatusEmail } from '@/lib/mail'
import crypto from 'crypto'

const prisma = new PrismaClient()

// POST — Crear o actualizar solicitud (vía Formulario Driver)
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { step, applicationId, password, passwordConfirm, ...data } = body

        // Limpiar datos clave
        if (data.rut) data.rut = data.rut.replace(/[.\-]/g, '')
        if (data.email) data.email = data.email.trim().toLowerCase()

        // Mapear password a passwordHash para el schema si viene en el body
        if (password) {
            data.passwordHash = password;
        }

        // ── ACTUALIZAR SOLICITUD EXISTENTE ──
        if (applicationId) {
            try {
                // Verificar estado antes de actualizar
                const current = await prisma.driverApplication.findUnique({
                    where: { id: applicationId }
                })

                if (current && current.status !== 'DRAFT') {
                    return NextResponse.json({
                        error: 'Esta solicitud ya no puede ser modificada porque está en revisión o ya fue procesada.'
                    }, { status: 403 })
                }

                if (step === 9 && data.contractFullname) {
                    const hashData = `${applicationId}-${data.contractFullname}-${new Date().getTime()}`;
                    const hash = crypto.createHash('sha256').update(hashData).digest('hex');
                    const validationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                    data.contractSignatureHash = hash;
                    data.contractValidationCode = validationCode;
                    data.contractSignedAt = new Date();
                }

                const updated = await prisma.driverApplication.update({
                    where: { id: applicationId },
                    data: { ...data, currentStep: step ?? undefined, updatedAt: new Date() },
                })

                // Si el nuevo estado es IN_REVIEW (envío final del formulario), notificar
                if (updated.status === 'IN_REVIEW') {
                    await sendStatusEmail(updated)
                }

                return NextResponse.json(updated)
            } catch (err: any) {
                console.error('[API UPDATE ERROR]', err)
                if (err.code === 'P2025') {
                    return NextResponse.json({ error: 'La sesión ha expirado o la solicitud no existe.' }, { status: 404 })
                }
                return NextResponse.json({ error: 'Error al actualizar el progreso' }, { status: 500 })
            }
        }

        // ── CREAR O RECUPERAR POR RUT ──
        if (data.rut && !applicationId) {
            const existing = await prisma.driverApplication.findFirst({
                where: { rut: data.rut },
            })
            if (existing) {
                // Si existe pero no está en borrador, bloquear
                if (existing.status !== 'DRAFT') {
                    let errorMsg = 'Ya tienes una solicitud en curso que no puede ser editada. Consulta su estado con tu código de seguimiento.'
                    if (existing.status === 'APPROVED') {
                        errorMsg = 'Ya usted tiene aprobada su cuenta delivery, no puede crear otra.'
                    }
                    return NextResponse.json({
                        error: errorMsg,
                        status: existing.status
                    }, { status: 409 })
                }
                
                // Si es borrador, permitir que el cliente la recupere y la actualizamos con sus nuevos datos del step actual
                const updated = await prisma.driverApplication.update({
                    where: { id: existing.id },
                    data: { ...data, currentStep: step ?? existing.currentStep, updatedAt: new Date() }
                })

                return NextResponse.json(
                    {
                        message: 'Solicitud recuperada y actualizada',
                        existingId: updated.id,
                        id: updated.id,
                        trackingCode: updated.trackingCode,
                        application: updated
                    },
                    { status: 200 }
                )
            }
        }

        // Crear nueva solicitud
        const trackingCode = Math.random().toString(36).substring(2, 10).toUpperCase()
        const application = await prisma.driverApplication.create({
            data: { ...data, trackingCode, currentStep: step ?? 1, status: 'DRAFT' },
        })

        return NextResponse.json(application, { status: 201 })
    } catch (error: any) {
        console.error('[driver-applications POST ERROR]', error)
        return NextResponse.json({
            error: 'Error interno del servidor',
            details: error.message
        }, { status: 500 })
    }
}

// GET — Obtener solicitud por ID o trackingCode
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const tracking = searchParams.get('tracking')
    const email = searchParams.get('email')
    const rut = searchParams.get('rut')?.replace(/[.\-]/g, '')

    try {
        let application = null

        if (id) {
            application = await prisma.driverApplication.findUnique({ where: { id } })
        } else if (tracking) {
            application = await prisma.driverApplication.findUnique({ where: { trackingCode: tracking } })
        } else if (email && rut) {
            application = await prisma.driverApplication.findFirst({
                where: { email, rut },
            })
        }

        if (!application) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
        }

        return NextResponse.json(application)
    } catch (error) {
        console.error('[driver-applications GET]', error)
        return NextResponse.json({ error: 'Error al consultar solicitud' }, { status: 500 })
    }
}

// PATCH — Actualizar estado (backoffice)
export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { id, status, rejectionReason, reviewedBy } = body

        const updated = await prisma.driverApplication.update({
            where: { id },
            data: {
                status,
                rejectionReason: rejectionReason || null,
                reviewedBy: reviewedBy || 'admin',
                reviewedAt: new Date(),
            },
        })

        // Enviar notificación de cambio de estatus
        await sendStatusEmail(updated)

        return NextResponse.json(updated)
    } catch (error) {
        console.error('[driver-applications PATCH ERROR]', error)
        return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 })
    }
}
