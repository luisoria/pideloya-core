import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/driver/auth — Login de driver con email + password (password inicial = RUT sin puntos ni guión)
export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400, headers: corsHeaders }
            )
        }

        // Buscar la solicitud del driver por email
        const application = await prisma.driverApplication.findFirst({
            where: { email: email.toLowerCase().trim() },
        })

        if (!application) {
            return NextResponse.json(
                { error: 'No se encontró una solicitud con ese email. ¿Ya te registraste?' },
                { status: 404, headers: corsHeaders }
            )
        }

        // Verificar contraseña: si passwordHash existe úsalo, sino usa RUT limpio como default
        const cleanRut = application.rut?.replace(/[.\-]/g, '') || ''
        const storedPassword = application.passwordHash || cleanRut

        if (password !== storedPassword) {
            return NextResponse.json(
                { error: 'Contraseña incorrecta. Tu primera contraseña es tu RUT sin puntos ni guión.' },
                { status: 401, headers: corsHeaders }
            )
        }

        // Retornar datos del driver + su estado
        const isFirstLogin = !application.passwordHash
        return NextResponse.json({
            id: application.id,
            email: application.email,
            firstName: application.firstName,
            lastNameP: application.lastNameP,
            lastNameM: application.lastNameM,
            rut: application.rut,
            phone: application.phone,
            status: application.status,
            vehicleType: application.vehicleType,
            comuna: application.comuna,
            trackingCode: application.trackingCode,
            rejectionReason: application.rejectionReason,
            isApproved: application.status === 'APPROVED',
            isFirstLogin,
        }, { headers: corsHeaders })

    } catch (error) {
        console.error('[driver/auth POST]', error)
        return NextResponse.json(
            { error: 'Error en el servidor' },
            { status: 500, headers: corsHeaders }
        )
    }
}

// PATCH /api/driver/auth — Cambiar contraseña
export async function PATCH(req: Request) {
    try {
        const { email, oldPassword, newPassword } = await req.json()

        if (!email || !newPassword) {
            return NextResponse.json(
                { error: 'Datos incompletos' },
                { status: 400, headers: corsHeaders }
            )
        }

        const application = await prisma.driverApplication.findFirst({
            where: { email: email.toLowerCase().trim() },
        })

        if (!application) {
            return NextResponse.json(
                { error: 'No se encontró la solicitud' },
                { status: 404, headers: corsHeaders }
            )
        }

        // Verificar contraseña anterior
        const cleanRut = application.rut?.replace(/[.\-]/g, '') || ''
        const currentPassword = application.passwordHash || cleanRut

        if (oldPassword !== currentPassword) {
            return NextResponse.json(
                { error: 'Contraseña actual incorrecta' },
                { status: 401, headers: corsHeaders }
            )
        }

        // Actualizar contraseña
        await prisma.driverApplication.update({
            where: { id: application.id },
            data: { passwordHash: newPassword },
        })

        return NextResponse.json({ success: true, message: 'Contraseña actualizada' }, { headers: corsHeaders })

    } catch (error) {
        console.error('[driver/auth PATCH]', error)
        return NextResponse.json(
            { error: 'Error en el servidor' },
            { status: 500, headers: corsHeaders }
        )
    }
}
