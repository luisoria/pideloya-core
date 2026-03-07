import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { type, ticketNumber, email, userName, issue, category, priority, resolution, resolvedBy } = body

        if (!email || !ticketNumber) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 })
        }

        // In production, integrate with SendGrid, Resend, or AWS SES
        // For now, log the email that would be sent
        if (type === 'CREATED') {
            console.log(`
═══════════════════════════════════════════════════
📧 EMAIL: TICKET CREADO
═══════════════════════════════════════════════════
Para: ${email}
Asunto: Ticket ${ticketNumber} - Hemos recibido tu reclamo

Estimado/a ${userName},

Tu reclamo ha sido registrado exitosamente.

📋 Detalles:
  • Número de Ticket: ${ticketNumber}
  • Asunto: ${issue}
  • Categoría: ${category}
  • Prioridad: ${priority}
  • Estado: ABIERTO

⏱️ Tiempo de respuesta estimado: 48 horas

Puedes dar seguimiento a tu ticket en:
${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/support

Equipo de Soporte PídeloYA
═══════════════════════════════════════════════════
            `)
        }

        if (type === 'RESOLVED') {
            console.log(`
═══════════════════════════════════════════════════
📧 EMAIL: TICKET RESUELTO
═══════════════════════════════════════════════════
Para: ${email}
Asunto: Ticket ${ticketNumber} - Tu caso ha sido resuelto

Estimado/a ${userName},

Tu ticket ha sido resuelto.

📋 Detalles:
  • Número de Ticket: ${ticketNumber}
  • Asunto: ${issue}
  • Resolución: ${resolution}
  • Resuelto por: ${resolvedBy}
  • Estado: RESUELTO

Si no estás satisfecho con la resolución, puedes
responder directamente en la plataforma.

Equipo de Soporte PídeloYA
═══════════════════════════════════════════════════
            `)
        }

        return NextResponse.json({ success: true })
    } catch (_e) {
        return NextResponse.json({ error: "Error sending notification" }, { status: 500 })
    }
}
