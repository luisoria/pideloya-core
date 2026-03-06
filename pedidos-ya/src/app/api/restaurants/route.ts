import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
    try {
        const restaurants = await prisma.restaurant.findMany({
            include: { products: true }
        })
        return NextResponse.json(restaurants, { headers: corsHeaders })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500, headers: corsHeaders })
    }
}
