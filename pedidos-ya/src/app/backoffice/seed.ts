"use server"

import { prisma } from "@/lib/prisma"

export async function seedBackoffice() {
    // Generate users
    const user1 = await prisma.user.upsert({
        where: { email: "luiso@test.com" },
        update: {},
        create: {
            email: "luiso@test.com",
            name: "Luis O.",
            phone: "+56 9 1234 5678",
            status: "VIP",
            ltv: 450.00
        }
    })

    const user2 = await prisma.user.upsert({
        where: { email: "mariag@test.com" },
        update: {},
        create: {
            email: "mariag@test.com",
            name: "María G.",
            phone: "+56 9 8765 4321",
            status: "REGULAR",
            ltv: 45.50
        }
    })

    const user3 = await prisma.user.upsert({
        where: { email: "carlosr@test.com" },
        update: {},
        create: {
            email: "carlosr@test.com",
            name: "Carlos R.",
            phone: "+56 9 5555 4444",
            status: "NEW",
            ltv: 12.00
        }
    })

    // Seed tickets if none exist
    const count = await prisma.ticket.count()
    if (count === 0) {
        await prisma.ticket.createMany({
            data: [
                {
                    ticketNumber: "TKT-10001",
                    issue: "Pedido tardío (> 45 min)",
                    description: "Mi pedido #ABC123 lleva más de 45 minutos y aún no llega. El restaurante dice que ya fue despachado.",
                    category: "DELIVERY",
                    status: "OPEN",
                    priority: "HIGH",
                    requesterType: "CUSTOMER",
                    userId: user1.id
                },
                {
                    ticketNumber: "TKT-10002",
                    issue: "Falta un ítem en el pedido",
                    description: "Pedí 2 hamburguesas y solo llegó 1. Adjunto foto del pedido.",
                    category: "ORDER_ISSUE",
                    status: "IN_PROGRESS",
                    priority: "MEDIUM",
                    requesterType: "CUSTOMER",
                    userId: user2.id
                },
                {
                    ticketNumber: "TKT-10003",
                    issue: "Restaurante canceló la orden",
                    description: "Me cancelaron la orden sin explicación después de 20 minutos de espera.",
                    category: "ORDER_ISSUE",
                    status: "RESOLVED",
                    priority: "LOW",
                    requesterType: "CUSTOMER",
                    resolution: "Se aplicó reembolso completo al método de pago original.",
                    resolvedBy: "Admin Central",
                    resolvedAt: new Date("2026-03-02"),
                    userId: user3.id
                }
            ]
        })
    }

    // Seed driver applications if none exist
    const appCount = await prisma.driverApplication.count()
    if (appCount === 0) {
        await prisma.driverApplication.createMany({
            data: [
                {
                    status: "SUBMITTED",
                    firstName: "Andrés",
                    lastNameP: "Muñoz",
                    lastNameM: "Soto",
                    rut: "18.456.789-2",
                    birthDate: "1996-03-15",
                    email: "andres.munoz@gmail.com",
                    phone: "+56 9 3344 5566",
                    gender: "M",
                    nationality: "CL",
                    street: "Av. Irarrázaval",
                    streetNumber: "2340",
                    comuna: "Ñuñoa",
                    region: "Metropolitana de Santiago",
                    vehicleType: "MOTORCYCLE",
                    bankName: "BancoEstado",
                    accountType: "VISTA",
                    accountNumber: "12345678",
                    currentStep: 9,
                },
                {
                    status: "SUBMITTED",
                    firstName: "Camila",
                    lastNameP: "Rojas",
                    lastNameM: "Fuentes",
                    rut: "19.876.543-1",
                    birthDate: "1998-07-22",
                    email: "camila.rojas@outlook.com",
                    phone: "+56 9 7788 9900",
                    gender: "F",
                    nationality: "CL",
                    street: "Los Leones",
                    streetNumber: "789",
                    comuna: "Providencia",
                    region: "Metropolitana de Santiago",
                    vehicleType: "BICYCLE",
                    bankName: "Banco de Chile",
                    accountType: "CORRIENTE",
                    accountNumber: "87654321",
                    currentStep: 9,
                },
                {
                    status: "IN_REVIEW",
                    firstName: "Diego",
                    lastNameP: "Torres",
                    lastNameM: "Vega",
                    rut: "17.234.567-K",
                    birthDate: "1994-11-03",
                    email: "diego.torres@gmail.com",
                    phone: "+56 9 1122 3344",
                    gender: "M",
                    nationality: "VE",
                    foreignDocType: "CEDULA_EXT",
                    foreignDocNumber: "E-84521369",
                    street: "Av. Grecia",
                    streetNumber: "1456",
                    comuna: "Peñalolén",
                    region: "Metropolitana de Santiago",
                    vehicleType: "EBIKE",
                    ebikePower: "OVER_50CC",
                    bankName: "Santander",
                    accountType: "VISTA",
                    accountNumber: "55667788",
                    currentStep: 9,
                },
                {
                    status: "APPROVED",
                    firstName: "Valentina",
                    lastNameP: "Castillo",
                    lastNameM: "Pérez",
                    rut: "20.111.222-3",
                    birthDate: "2000-01-10",
                    email: "vale.castillo@gmail.com",
                    phone: "+56 9 9988 7766",
                    gender: "F",
                    nationality: "CL",
                    street: "Pedro de Valdivia",
                    streetNumber: "321",
                    comuna: "Providencia",
                    region: "Metropolitana de Santiago",
                    vehicleType: "BICYCLE",
                    bankName: "MACH",
                    accountType: "DIGITAL",
                    accountNumber: "99887766",
                    currentStep: 9,
                    reviewedBy: "admin@test.com",
                    reviewedAt: new Date("2026-02-28"),
                },
                {
                    status: "REJECTED",
                    firstName: "Sebastián",
                    lastNameP: "Herrera",
                    rut: "16.555.444-5",
                    birthDate: "1990-06-30",
                    email: "seba.herrera@yahoo.com",
                    phone: "+56 9 4455 6677",
                    gender: "M",
                    nationality: "CL",
                    street: "Gran Avenida",
                    streetNumber: "5678",
                    comuna: "San Miguel",
                    region: "Metropolitana de Santiago",
                    vehicleType: "CAR",
                    bankName: "BCI",
                    accountType: "CORRIENTE",
                    accountNumber: "11223344",
                    currentStep: 9,
                    rejectionReason: "Certificado de antecedentes vencido (más de 30 días)",
                    reviewedBy: "admin@test.com",
                    reviewedAt: new Date("2026-02-27"),
                },
                {
                    status: "DOCS_INCOMPLETE",
                    firstName: "Francisca",
                    lastNameP: "López",
                    lastNameM: "González",
                    rut: "21.333.444-6",
                    birthDate: "2001-09-18",
                    email: "fran.lopez@hotmail.com",
                    phone: "+56 9 2233 4455",
                    gender: "F",
                    nationality: "CL",
                    street: "Tobalaba",
                    streetNumber: "900",
                    comuna: "Las Condes",
                    region: "Metropolitana de Santiago",
                    vehicleType: "MOTORCYCLE",
                    bankName: "Banco Falabella",
                    accountType: "VISTA",
                    accountNumber: "44556677",
                    currentStep: 6,
                    rejectionReason: "Falta foto de licencia de conducir (reverso)",
                    reviewedBy: "admin@test.com",
                    reviewedAt: new Date("2026-03-01"),
                },
            ]
        })
    }
}

