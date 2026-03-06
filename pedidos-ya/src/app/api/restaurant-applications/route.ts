/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import crypto from 'crypto'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { step, applicationId, contractSigned, ...rawData } = body

        // Sanitize data for Prisma (remove fields not in schema)
        const data = { ...rawData }

        // RUT cleaning
        if (data.rut) data.rut = data.rut.replace(/[.\-]/g, '')
        if (data.email) data.email = data.email.trim().toLowerCase()

        // ── UPDATE EXISTING ──
        if (applicationId) {
            try {
                const current = await prisma.restaurantApplication.findUnique({
                    where: { id: applicationId }
                })

                if (current && current.status !== 'DRAFT') {
                    return NextResponse.json({ error: 'Solicitud bloqueada' }, { status: 403 })
                }

                // Contract Signing Logic
                if (step === 5 && data.contractFullname) {
                    const hashData = `${applicationId}-${data.contractFullname}-${new Date().getTime()}`
                    const hash = crypto.createHash('sha256').update(hashData).digest('hex')
                    const validationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

                    data.contractSignatureHash = hash
                    data.contractValidationCode = validationCode
                    data.contractSignedAt = new Date()
                }

                const updated = await prisma.restaurantApplication.update({
                    where: { id: applicationId },
                    data: {
                        ...data,
                        updatedAt: new Date()
                    },
                })

                return NextResponse.json(updated)
            } catch (err: any) {
                console.error("[RESTAURANT_APP_UPDATE_ERROR]", err)
                return NextResponse.json({ error: 'Error al actualizar: ' + err.message }, { status: 500 })
            }
        }

        // ── CREATE OR RECOVER BY RUT ──
        if (data.rut) {
            const existing = await prisma.restaurantApplication.findFirst({
                where: { rut: data.rut },
            })
            if (existing) {
                if (existing.status !== 'DRAFT') {
                    return NextResponse.json({ error: 'Ya existe una solicitud para este RUT' }, { status: 409 })
                }
                return NextResponse.json({ id: existing.id, trackingCode: existing.trackingCode }, { status: 200 })
            }
        }

        // Create New
        try {
            const trackingCode = Math.random().toString(36).substring(2, 10).toUpperCase()
            const application = await prisma.restaurantApplication.create({
                data: {
                    ...data,
                    trackingCode,
                    status: 'DRAFT'
                },
            })

            return NextResponse.json(application, { status: 201 })
        } catch (err: any) {
            console.error("[RESTAURANT_APP_CREATE_ERROR]", err)
            return NextResponse.json({ error: 'Error al crear: ' + err.message }, { status: 500 })
        }

    } catch (error: any) {
        console.error("[RESTAURANT_APP_GLOBAL_ERROR]", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
