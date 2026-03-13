"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth"

export async function register(formData: FormData) {
    const name = (formData.get("name") as string)?.trim()
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const phone = (formData.get("phone") as string)?.trim()
    const street = (formData.get("street") as string)?.trim()
    const number = (formData.get("number") as string)?.trim()
    const apartment = (formData.get("apartment") as string)?.trim()
    const comuna = (formData.get("comuna") as string)?.trim()
    const reference = (formData.get("reference") as string)?.trim() || undefined
    const notes = (formData.get("notes") as string)?.trim() || undefined

    if (!name || !email || !password || !phone || !street || !number || !apartment || !comuna) {
        throw new Error("Todos los campos obligatorios deben ser completados")
    }

    if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
    }

    if (password !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden")
    }

    // Check if user is verified with raw SQL
    const dbUsers = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "emailVerified", id FROM "User" WHERE email = $1`,
        email
    )
    const dbUser = dbUsers[0]
    
    if (!dbUser || !dbUser.emailVerified) {
        throw new Error("Debes verificar tu correo electrónico antes de registrarte")
    }

    const pwHash = await bcrypt.hash(password, 10)

    // Update User with raw SQL to handle unreflected fields (status, etc)
    await prisma.$executeRawUnsafe(
        `UPDATE "User" SET name = $1, phone = $2, status = 'REGULAR', "passwordHash" = $3 WHERE id = $4`,
        name, phone, pwHash, dbUser.id
    )

    // Create Address with raw SQL
    const addrId = crypto.randomUUID()
    await prisma.$executeRawUnsafe(
        `INSERT INTO "CustomerAddress" (id, alias, street, number, apartment, comuna, reference, notes, "isDefault", "userId", "updatedAt", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        addrId, "Casa", street, number, apartment, comuna, reference, notes, true, dbUser.id
    )

    // Fetch the updated user for the session (id and email are standard)
    const user = await prisma.user.findUnique({ where: { id: dbUser.id } })
    if (!user) throw new Error("Error al recuperar el usuario")

    // Send Welcome Email
    try {
        const nodemailer = await import("nodemailer")
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER || 'reclutamiento@enigmasecurity.cl',
                pass: (process.env.SMTP_PASS || '#F5gLJ0pWC[c32').replace(/^"|"$/g, ''),
            },
        })

        await transporter.sendMail({
            from: `"PideloYA" <${process.env.SMTP_USER || 'reclutamiento@enigmasecurity.cl'}>`,
            to: email,
            subject: `¡Bienvenido a PideloYA, ${name}!`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="background: #E11D48; color: white; padding: 10px; border-radius: 8px; font-weight: bold; display: inline-block;">PideloYA</div>
                    </div>
                    <h2 style="color: #E11D48; text-align: center;">¡Bienvenido a bordo!</h2>
                    <p>Hola <strong>${name}</strong>,</p>
                    <p>Estamos muy emocionados de que te hayas unido a PideloYA. Ahora tienes acceso a los mejores restaurantes de tu zona con entregas rápidas y seguras.</p>
                    <div style="background: #fdf2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #991b1b; margin-top: 0;">¿Qué sigue?</h3>
                        <ul style="color: #4b5563;">
                            <li>Explora cientos de menús locales.</li>
                            <li>Añade tus platos favoritos al carrito.</li>
                            <li>¡Recibe tu comida en la puerta de tu casa!</li>
                        </ul>
                    </div>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background: #E11D48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold;">Empieza a pedir ahora</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #999; text-align: center;">Recibiste este correo porque te registraste en PideloYA.</p>
                </div>
            `
        })
    } catch (err) {
        console.error("Error sending welcome email:", err)
    }

    // Auto-login after registration using signed session
    await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    })

    redirect("/")
}
