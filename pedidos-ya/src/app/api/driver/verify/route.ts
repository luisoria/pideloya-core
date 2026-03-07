import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

// Configurar transportador de correo SMTP
const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER || 'reclutamiento@enigmasecurity.cl',
        pass: (process.env.SMTP_PASS || '#F5gLJ0pWC[c32').replace(/^"|"$/g, ''),
    },
}

console.log('[SMTP Config Check]', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    user: smtpConfig.auth.user,
    hasPass: !!smtpConfig.auth.pass
})

const transporter = nodemailer.createTransport(smtpConfig)

// Generador de código corto (4 dígitos) para mayor facilidad
const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString()

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action, appId, type, code } = body

        if (!appId) return NextResponse.json({ error: 'Falta appId' }, { status: 400 })

        // ── ACCIÓN: ENVIAR CÓDIGO ──
        if (action === 'send') {
            const verificationCode = generateCode() // Código dinámico real
            console.log(`[VERIFY] AppId: ${appId}, Type: ${type}, Code: ${verificationCode}`)

            const data: any = {}
            if (type === 'email') data.emailCode = verificationCode
            else if (type === 'phone') data.phoneCode = verificationCode
            else return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })

            try {
                const app = await prisma.driverApplication.update({
                    where: { id: appId },
                    data
                })

                if (type === 'email' && (app as any).email) {
                    console.log(`[SMTP] Intentando enviar email a: ${(app as any).email} via ${smtpConfig.host}`)
                    try {
                        await transporter.sendMail({
                            from: `"PideloYA" <${smtpConfig.auth.user}>`,
                            to: (app as any).email,
                            subject: `${verificationCode} es tu código de verificación`,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #eee; border-radius: 12px;">
                                    <h2 style="color: #E11D48;">Verificación de Registro</h2>
                                    <p>Hola <strong>${(app as any).firstName || 'Candidato'}</strong>,</p>
                                    <p>Introduce este código en el portal para validar tu identidad:</p>
                                    <div style="font-size: 42px; font-weight: 900; color: #E11D48; letter-spacing: 12px; margin: 30px 0; text-align: center; background: #f9f9f9; padding: 20px; border-radius: 8px;">
                                        ${verificationCode}
                                    </div>
                                    <p style="font-size: 13px; color: #666;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
                                </div>
                            `
                        })
                        console.log(`[SMTP] Email enviado con éxito a ${(app as any).email}`)
                    } catch (err: any) {
                        console.error('[SMTP ERROR]', err)
                        return NextResponse.json({
                            error: `Error SMTP (${err.code || 'UNK'}): ${err.message || 'Error de conexión'}`
                        }, { status: 500 })
                    }
                }

                console.log(`[VERIFY] Código ${verificationCode} generado para ${type === 'email' ? (app as any).email : (app as any).phone}`)

                return NextResponse.json({
                    success: true,
                    message: `Código enviado exitosamente a ${(app as any).email || (app as any).phone}`,
                    _code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
                })
            } catch (err: any) {
                if (err.code === 'P2025') {
                    return NextResponse.json({ error: 'La solicitud no existe o ha caducado. Recarga la página.' }, { status: 404 })
                }
                throw err
            }
        }

        // ── ACCIÓN: VERIFICAR CÓDIGO ──
        if (action === 'check') {
            if (!code) return NextResponse.json({ error: 'Falta código' }, { status: 400 })

            const app = await prisma.driverApplication.findUnique({
                where: { id: appId }
            })

            if (!app) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

            let verified = false
            const updateData: any = {}

            if (type === 'email' && (app as any).emailCode === code) {
                verified = true
                updateData.emailVerified = true
                updateData.emailCode = null
            } else if (type === 'phone' && (app as any).phoneCode === code) {
                verified = true
                updateData.phoneVerified = true
                updateData.phoneCode = null
            }

            if (!verified) {
                return NextResponse.json({ error: 'Código incorrecto. Inténtalo de nuevo.' }, { status: 400 })
            }

            await prisma.driverApplication.update({
                where: { id: appId },
                data: updateData
            })

            return NextResponse.json({ success: true, message: 'Verificación exitosa' })
        }

        return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })

    } catch (error: any) {
        console.error('[verify POST ERROR]', error)
        return NextResponse.json({
            error: 'Error interno del servidor',
            details: error.message
        }, { status: 500 })
    }
}
