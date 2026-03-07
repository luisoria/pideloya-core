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
    include: { products: { take: 4 } }
  })

  if (!restaurant || restaurant.products.length < 2) {
    console.log("No restaurant or products found")
    return
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)

  // Order 1: Delivered 2 hours ago with reviews
  const order1 = await prisma.order.create({
    data: {
      customerId: customer.id,
      restaurantId: restaurant.id,
      status: 'DELIVERED',
      total: restaurant.products.slice(0, 2).reduce((sum, p) => sum + p.price, 0),
      deliveredAt: twoHoursAgo,
      createdAt: threeHoursAgo,
      items: {
        create: restaurant.products.slice(0, 2).map(p => ({
          productId: p.id,
          quantity: 1,
          price: p.price
        }))
      }
    }
  })

  await prisma.review.create({
    data: {
      rating: 5,
      comment: "¡Excelente servicio y comida! Llegó todo caliente.",
      customerId: customer.id,
      restaurantId: restaurant.id,
      orderId: order1.id
    }
  })

  for (const product of restaurant.products.slice(0, 2)) {
    await prisma.productReview.create({
      data: {
        rating: 5,
        comment: `El mejor ${product.name} que he probado.`,
        customerId: customer.id,
        productId: product.id,
        orderId: order1.id
      }
    })
  }

  // Order 2: Delivered recently (no reviews yet, should show waiting message)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
  await prisma.order.create({
    data: {
      customerId: customer.id,
      restaurantId: restaurant.id,
      status: 'DELIVERED',
      total: restaurant.products[2].price,
      deliveredAt: thirtyMinsAgo,
      createdAt: twoHoursAgo,
      items: {
        create: [{
          productId: restaurant.products[2].id,
          quantity: 1,
          price: restaurant.products[2].price
        }]
      }
    }
  })

  console.log(`Seed completed for customer ${customer.email}`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
