import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/auth'

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()
        
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401, headers: corsHeaders })
        }

        // Si el usuario tiene passwordHash, validamos con bcrypt. 
        // Si no tiene (legacy/demo), permitimos login directo para no bloquear el ambiente local.
        if (user.passwordHash) {
            const isValid = await bcrypt.compare(password, user.passwordHash)
            if (!isValid) {
                return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401, headers: corsHeaders })
            }
        } else {
            console.warn(`[SECURITY] Login Without Password for user: ${email}. Add a password hash in the DB.`)
        }

        const sessionData = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }

        await createSession(sessionData)

        return NextResponse.json({ 
            success: true, 
            user: sessionData
        }, { headers: corsHeaders })

    } catch (error) {
        console.error("[LOGIN_ERROR]", error)
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500, headers: corsHeaders })
    }
}
