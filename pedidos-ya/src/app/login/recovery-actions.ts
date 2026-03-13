"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"

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

export async function sendRecoveryCode(email: string) {
    if (!email) throw new Error("Email es requerido")

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error("No existe un usuario con este correo")

    const code = Math.floor(1000 + Math.random() * 9000).toString()

    // Store code using raw SQL (Prisma client sync issue)
    await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "emailCode" = $1 WHERE email = $2`,
        code, email
    )

    try {
        await transporter.sendMail({
            from: `"PideloYA" <${smtpConfig.auth.user}>`,
            to: email,
            subject: `${code} es tu código de recuperación`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #eee; border-radius: 12px; margin: 0 auto;">
                    <h2 style="color: #E11D48;">Recuperación de Contraseña</h2>
                    <p>Has solicitado restablecer tu contraseña. Usa el siguiente código:</p>
                    <div style="font-size: 32px; font-weight: 900; color: #E11D48; letter-spacing: 8px; margin: 20px 0; text-align: center; background: #f9f9f9; padding: 15px; border-radius: 8px;">
                        ${code}
                    </div>
                    <p style="font-size: 13px; color: #666;">Si no solicitaste esto, ignora el mensaje.</p>
                </div>
            `
        })
    } catch (err: any) {
        throw new Error("Error al enviar el correo")
    }

    return { success: true }
}

export async function verifyCode(email: string, code: string) {
    const dbUsers = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "emailCode" FROM "User" WHERE email = $1`,
        email
    )
    const dbUser = dbUsers[0]
    if (!dbUser || dbUser.emailCode !== code) {
        throw new Error("Código incorrecto")
    }
    return { success: true }
}

export async function resetPassword(email: string, code: string, password: string) {
    // Re-verify code
    const dbUsers = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "emailCode" FROM "User" WHERE email = $1`,
        email
    )
    const dbUser = dbUsers[0]
    if (!dbUser || dbUser.emailCode !== code) {
        throw new Error("Código expirado o inválido")
    }

    const pwHash = await bcrypt.hash(password, 10)

    // Update password and clear code with raw SQL
    await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "passwordHash" = $1, "emailCode" = null, "emailVerified" = true WHERE email = $2`,
        pwHash, email
    )

    return { success: true }
}
