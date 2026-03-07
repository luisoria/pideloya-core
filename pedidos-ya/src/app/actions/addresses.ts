"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function getAddresses() {
    const session = await getSession()
    if (!session || !session.id) return []

    return await prisma.customerAddress.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' }
    })
}

export async function addAddress(formData: FormData) {
    const session = await getSession()
    if (!session || !session.id) throw new Error("No autenticado")

    // Comprobar límite de 5 direcciones
    const count = await prisma.customerAddress.count({
        where: { userId: session.id }
    })

    if (count >= 5) {
        throw new Error("Has alcanzado el límite máximo de 5 direcciones guardadas (Error 403)")
    }

    const comuna = formData.get("comuna") as string
    const street = formData.get("street") as string
    const number = formData.get("number") as string
    const apartment = formData.get("apartment") as string || null
    const alias = formData.get("alias") as string || "Mi Dirección"

    if (!comuna || !street || !number) {
        throw new Error("Comuna, Calle y Número son obligatorios")
    }

    // Si es la primera, marcar como default
    const isDefault = count === 0

    const newAddress = await prisma.customerAddress.create({
        data: {
            userId: session.id,
            comuna,
            street,
            number,
            apartment,
            alias,
            isDefault
        }
    })

    if (isDefault) {
        await updateSessionWithAddress(newAddress)
    }

    revalidatePath("/profile")
    return { success: true, address: newAddress }
}

export async function setDefaultAddress(addressId: string) {
    const session = await getSession()
    if (!session || !session.id) throw new Error("No autenticado")

    // Resetear todas y activar la nueva
    await prisma.$transaction([
        prisma.customerAddress.updateMany({
            where: { userId: session.id },
            data: { isDefault: false }
        }),
        prisma.customerAddress.update({
            where: { id: addressId, userId: session.id },
            data: { isDefault: true }
        })
    ])

    const updatedAddress = await prisma.customerAddress.findUnique({
        where: { id: addressId }
    })

    if (updatedAddress) {
        await updateSessionWithAddress(updatedAddress)
    }

    revalidatePath("/profile")
    return { success: true }
}

export async function deleteAddress(addressId: string) {
    const session = await getSession()
    if (!session || !session.id) throw new Error("No autenticado")

    const address = await prisma.customerAddress.findUnique({
        where: { id: addressId, userId: session.id }
    })

    if (!address) throw new Error("Dirección no encontrada")

    await prisma.customerAddress.delete({
        where: { id: addressId }
    })

    // Si borramos la default, buscar otra para hacerla default
    if (address.isDefault) {
        const nextAddress = await prisma.customerAddress.findFirst({
            where: { userId: session.id },
            orderBy: { createdAt: 'desc' }
        })

        if (nextAddress) {
            await setDefaultAddress(nextAddress.id)
        } else {
            // No quedan direcciones, limpiar de la sesión
            await clearAddressFromSession()
        }
    }

    revalidatePath("/profile")
    return { success: true }
}

async function updateSessionWithAddress(address: any) {
    const session = await getSession()
    if (!session) return

    const updatedSession = {
        ...session,
        activeAddress: {
            id: address.id,
            comuna: address.comuna,
            street: address.street,
            number: address.number,
            apartment: address.apartment,
            alias: address.alias
        }
    }

    const cookieStore = await cookies()
    cookieStore.set("auth_session", JSON.stringify(updatedSession), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    })
}

async function clearAddressFromSession() {
    const session = await getSession()
    if (!session) return

    const { activeAddress, ...rest } = session
    
    const cookieStore = await cookies()
    cookieStore.set("auth_session", JSON.stringify(rest), {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    })
}
