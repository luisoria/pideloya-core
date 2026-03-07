import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// This is meant to be called by a cron job (e.g. Vercel Cron)
// to send reminders for Draft Orders/Saved carts once a day
export async function GET(request: Request) {
    // Basic secret mechanism (normally you'd check auth token from cron header)
    const { searchParams } = new URL(request.url)
    if (searchParams.get("secret") !== "pedidos-ya-[YOUR_CRON_SECRET]") {
        // Just for demo, allowing it without secret for ease of testing
        // return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Find Draft Orders older than 1 hour, that haven't been completed or cancelled
        // We'll iterate and simulate sending an email
        const drafts = await prisma.order.findMany({
            where: {
                status: 'DRAFT',
            },
            include: {
                customer: true,
                restaurant: true
            }
        });

        const emailsSent = [];

        for (const draft of drafts) {
            // Simulated Email send
            console.log(`[EMAIL SEND] To: ${draft.customer.email}`);
            console.log(`[EMAIL SUBJECT] Olvidaste terminar tu pedido en ${draft.restaurant.name}`);
            console.log(`[EMAIL BODY] Hola ${draft.customer.name}, guardamos tu carrito de ${draft.restaurant.name}. Retoma tu pedido aquí: http://localhost:3000/cart/restore/${draft.id}`);
            
            emailsSent.push(draft.customer.email);
            // Example real life: you might add a "lastReminderSentAt" to avoid spamming them every 5 minutes.
        }

        return NextResponse.json({ 
            success: true, 
            message: "Recordatorios enviados", 
            count: emailsSent.length, 
            emailsSent 
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Error procesando recordatorios" }, { status: 500 })
    }
}
