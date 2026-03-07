import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const customer = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' }
  })

  if (!customer) {
    console.log("No customer found")
    return
  }

  const restaurant = await prisma.restaurant.findFirst({
    include: { 
      products: { 
        where: { available: true }, 
        take: 3 
      } 
    }
  })

  if (!restaurant || restaurant.products.length < 3) {
    console.log("No restaurant or at least 3 active products found")
    return
  }

  // Proper cleanup
  const oldOrders = await prisma.order.findMany({ where: { customerId: customer.id } })
  const oldOrderIds = oldOrders.map(o => o.id)
  
  await prisma.productReview.deleteMany({ where: { orderId: { in: oldOrderIds } } })
  await prisma.review.deleteMany({ where: { orderId: { in: oldOrderIds } } })
  await prisma.orderItem.deleteMany({ where: { orderId: { in: oldOrderIds } } })
  await prisma.order.deleteMany({ where: { id: { in: oldOrderIds } } })

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)

  // Specific Scenario: 1 Order with 3 products, delivered 2 hours ago, PENDING REVIEW
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      restaurantId: restaurant.id,
      status: 'DELIVERED',
      total: restaurant.products.reduce((sum, p) => sum + p.price, 0),
      deliveredAt: twoHoursAgo,
      createdAt: threeHoursAgo,
      items: {
        create: restaurant.products.map(p => ({
          productId: p.id,
          quantity: 1,
          price: p.price
        }))
      }
    }
  })

  console.log(`✅ Seed exitoso para ${customer.email}`)
  console.log(`📦 Orden ID: ${order.id}`)
  console.log(`🍔 Productos: ${restaurant.products.map(p => p.name).join(", ")}`)
  console.log(`⏰ Entregado hace 2 horas. Listo para calificar.`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
