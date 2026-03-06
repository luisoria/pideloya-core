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

// GET /api/driver/orders - devuelve ordenes READY para el driver
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'READY' },
      include: {
        restaurant: true,
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = orders.map((order) => {
      const rest = order.restaurant as any
      const cust = order.customer as any
      return {
        id: order.id,
        orderNumber: '#' + order.id.substring(0, 6).toUpperCase(),
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        // Restaurante
        restaurantName: rest.name,
        restaurantAddress: rest.address,
        restaurantPhone: rest.phone ?? '+56 2 0000 0000',
        restaurantLat: rest.lat ?? -33.4372,
        restaurantLon: rest.lon ?? -70.6506,
        // Cliente
        customerName: cust.name,
        customerPhone: cust.phone ?? '+56 9 0000 0000',
        customerAddress: 'Av. Libertador B. OHiggins 340, Santiago',
        customerLat: -33.4489,
        customerLon: -70.6693,
        // Items
        items: order.items.map((item) => ({
          name: item.product.name,
          qty: item.quantity,
          price: item.price,
        })),
      }
    })

    return NextResponse.json(formatted, { headers: corsHeaders })
  } catch (error) {
    console.error('[driver/orders GET]', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500, headers: corsHeaders })
  }
}

// PATCH /api/driver/orders - actualiza estado de una orden
export async function PATCH(request: Request) {
  try {
    const { orderId, status, driverEmail } = await request.json()

    const updateData: { status: string; driverId?: string } = { status }

    if (driverEmail && status === 'PICKED_UP') {
      const driver = await prisma.user.findUnique({ where: { email: driverEmail } })
      if (driver) updateData.driverId = driver.id
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    })

    return NextResponse.json(order, { headers: corsHeaders })
  } catch (error) {
    console.error('[driver/orders PATCH]', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500, headers: corsHeaders })
  }
}
