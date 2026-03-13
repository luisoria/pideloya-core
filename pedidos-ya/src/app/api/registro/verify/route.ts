import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER || 'reclutamiento@enigmasecurity.cl',
        pass: (process.env.SMTP_PASS || '#F5gLJ0pWC[c32').replace(/^"|"$/g, ''),
    },
}

const transporter = nodemailer.createTransport(smtpConfig)

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString()

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action, email, code } = body

        if (!email) return NextResponse.json({ error: 'Falta email' }, { status: 400 })

        // ── ACCIÓN: ENVIAR CÓDIGO ──
        if (action === 'send') {
            const verificationCode = generateCode()
            
            // Use raw query for unreflected fields
            const dbUsers = await prisma.$queryRawUnsafe<any[]>(
                `SELECT "emailVerified", "passwordHash" FROM "User" WHERE email = $1`,
                email
            )
            const dbUser = dbUsers[0]
            
            if (dbUser && dbUser.emailVerified && dbUser.passwordHash) {
                return NextResponse.json({ error: 'Este correo ya está registrado. Por favor inicia sesión.' }, { status: 400 })
            }

            const existing = await prisma.user.findUnique({ where: { email } })

            if (!existing) {
                // Pre-create user with raw SQL
                const userId = crypto.randomUUID()
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "User" (id, email, name, role, status, "emailCode", "emailVerified")
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    userId, email, 'Pendiente', 'CUSTOMER', 'NEW', verificationCode, false
                )
            } else {
                await prisma.$executeRawUnsafe(
                    `UPDATE "User" SET "emailCode" = $1 WHERE email = $2`,
                    verificationCode, email
                )
            }

            try {
                await transporter.sendMail({
                    from: `"PideloYA" <${smtpConfig.auth.user}>`,
                    to: email,
                    subject: `${verificationCode} es tu código de verificación`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #eee; border-radius: 12px;">
                            <h2 style="color: #E11D48;">Verificación de Registro</h2>
                            <p>Hola,</p>
                            <p>Introduce este código en el portal para validar tu identidad y completar tu registro:</p>
                            <div style="font-size: 42px; font-weight: 900; color: #E11D48; letter-spacing: 12px; margin: 30px 0; text-align: center; background: #f9f9f9; padding: 20px; border-radius: 8px;">
                                ${verificationCode}
                            </div>
                            <p style="font-size: 13px; color: #666;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
                        </div>
                    `
                })
            } catch (err: any) {
                console.error('[SMTP ERROR]', err)
                return NextResponse.json({
                    error: `Error al enviar correo: ${err.message || 'Error de conexión'}`
                }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                message: `Código enviado exitosamente a ${email}`,
                _code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            })
        }

        // ── ACCIÓN: VERIFICAR CÓDIGO ──
        if (action === 'check') {
            if (!code) return NextResponse.json({ error: 'Falta código' }, { status: 400 })

            // Verify with raw SQL
            const dbUsers = await prisma.$queryRawUnsafe<any[]>(
                `SELECT "emailCode" FROM "User" WHERE email = $1`,
                email
            )
            const dbUser = dbUsers[0]

            if (!dbUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

            if (dbUser.emailCode === code) {
                await prisma.$executeRawUnsafe(
                    `UPDATE "User" SET "emailVerified" = true, "emailCode" = null WHERE email = $1`,
                    email
                )
                return NextResponse.json({ success: true, message: 'Verificación exitosa' })
            } else {
                return NextResponse.json({ error: 'Código incorrecto. Inténtalo de nuevo.' }, { status: 400 })
            }
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
