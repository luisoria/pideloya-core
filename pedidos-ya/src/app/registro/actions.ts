"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { hashPassword, verifyPassword } from "@/lib/password"

export async function register(formData: FormData) {
    const name = (formData.get("name") as string)?.trim()
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const phone = (formData.get("phone") as string)?.trim() || undefined

    if (!name || !email || !password) {
        throw new Error("Todos los campos son obligatorios")
    }

    if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
    }

    if (password !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden")
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        throw new Error("Ya existe una cuenta con ese email")
    }

    const pwHash = hashPassword(password)

    const user = await prisma.user.create({
        data: {
            name,
            email,
            phone,
            role: "CUSTOMER",
            status: "NEW",
            passwordHash: pwHash,
        }
    })

    // Auto-login after registration
    const cookieStore = await cookies()
    cookieStore.set("auth_session", JSON.stringify(user), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    })

    redirect("/")
}
