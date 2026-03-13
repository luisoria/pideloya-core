"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { createSession, deleteSession } from "@/lib/auth"

export async function login(formData: FormData) {
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = formData.get("password") as string | null

    if (!email) {
        return { error: "El email es requerido" }
    }

    let user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        // Auto-create ONLY for demo quick-login emails (no password provided)
        if (!password) {
            let role = "CUSTOMER"
            if (email.includes("owner")) role = "RESTAURANT"
            if (email.includes("driver")) role = "DRIVER"
            if (email.includes("admin")) role = "ADMIN"

            user = await prisma.user.create({
                data: {
                    email,
                    name: email.split('@')[0],
                    role: role as any,
                }
            })
        } else {
            return { error: "No existe una cuenta con ese email. ¿Quieres registrarte?" }
        }
    } else {
        // User exists — verify password if they have one set
        if (user.passwordHash && password) {
            const isValid = await bcrypt.compare(password, user.passwordHash)
            if (!isValid) {
                return { error: "Contraseña incorrecta" }
            }
        }
        // If no passwordHash, allow login (legacy / demo users)
    }

    // Fetch default address to inject into session
    const defaultAddress = await prisma.customerAddress.findFirst({
        where: { userId: user.id, isDefault: true }
    })

    const sessionData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        activeAddress: defaultAddress ? {
            id: defaultAddress.id,
            comuna: defaultAddress.comuna,
            street: defaultAddress.street,
            number: defaultAddress.number,
            apartment: defaultAddress.apartment,
            alias: defaultAddress.alias
        } : null
    }

    await createSession(sessionData)

    let targetPath = "/"
    switch (user.role) {
        case "RESTAURANT":
            targetPath = "/partner"
            break
        case "DRIVER":
            targetPath = "/driver"
            break
        case "ADMIN":
            targetPath = "/backoffice"
            break
        default:
            targetPath = "/"
            break
    }
    
    redirect(targetPath)
}

export async function logout() {
    await deleteSession()
    redirect("/")
}
