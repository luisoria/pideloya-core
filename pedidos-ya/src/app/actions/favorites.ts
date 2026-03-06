"use server"

import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleFavorite(restaurantId: string) {
    const session = await getSession()
    if (!session) throw new Error("Debes iniciar sesión")

    const existing = await prisma.favorite.findFirst({
        where: { userId: session.id, restaurantId }
    })

    if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } })
    } else {
        await prisma.favorite.create({
            data: { userId: session.id, restaurantId }
        })
    }

    revalidatePath("/")
}
