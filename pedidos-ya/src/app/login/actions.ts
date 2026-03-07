"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { verifyPassword } from "@/lib/password"

export async function login(formData: FormData) {
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = formData.get("password") as string | null

    if (!email) {
        throw new Error("El email es requerido")
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
                    role,
                }
            })
        } else {
            throw new Error("No existe una cuenta con ese email. ¿Quieres registrarte?")
        }
    } else {
        // User exists — verify password if they have one set
        if (user.passwordHash && password) {
            if (!verifyPassword(password, user.passwordHash)) {
                throw new Error("Contraseña incorrecta")
            }
        } else if (user.passwordHash && !password) {
            // Account has password but none provided (quick-login dev button) — allow for dev users
            // In production this should be blocked
        }
        // If no passwordHash, allow login (legacy / demo users)
    }

    // Fetch default address to inject into session
    const defaultAddress = await prisma.customerAddress.findFirst({
        where: { userId: user.id, isDefault: true }
    })

    const sessionData = {
        ...user,
        activeAddress: defaultAddress ? {
            id: defaultAddress.id,
            comuna: defaultAddress.comuna,
            street: defaultAddress.street,
            number: defaultAddress.number,
            apartment: defaultAddress.apartment,
            alias: defaultAddress.alias
        } : null
    }

    const cookieStore = await cookies()
    cookieStore.set("auth_session", JSON.stringify(sessionData), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    })

    switch (user.role) {
        case "RESTAURANT":
            redirect("/partner")
        case "DRIVER":
            redirect("/driver")
        case "ADMIN":
            redirect("/backoffice")
        default:
            redirect("/")
    }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete("auth_session")
    redirect("/")
}
