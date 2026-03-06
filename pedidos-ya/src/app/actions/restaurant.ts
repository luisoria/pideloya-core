"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function addProduct(restaurantId: string, formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") throw new Error("Unauthorized")

    // Verify ownership
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant || restaurant.ownerId !== session.id) throw new Error("Unauthorized")

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const priceStr = formData.get("price") as string
    const image = formData.get("image") as string || "🍔"

    if (!name || !priceStr) {
        throw new Error("Missing required fields")
    }

    const price = parseFloat(priceStr)

    await prisma.product.create({
        data: {
            name,
            description,
            price,
            image,
            restaurantId
        }
    })

    revalidatePath("/restaurant")
}

export async function deleteProduct(productId: string) {
    const session = await getSession()
    if (!session || session.role !== "RESTAURANT") throw new Error("Unauthorized")

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { restaurant: true }
    })

    if (!product || product.restaurant.ownerId !== session.id) {
        throw new Error("Unauthorized")
    }

    await prisma.product.delete({
        where: { id: productId }
    })

    revalidatePath("/restaurant")
}
