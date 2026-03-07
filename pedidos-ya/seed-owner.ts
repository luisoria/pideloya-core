import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const restaurant = await prisma.restaurant.findFirst({
    where: { owner: { email: 'owner@test.com' } }
  })

  if (restaurant) {
    // Check if it has products
    const productsCount = await prisma.product.count({ where: { restaurantId: restaurant.id } })
    if (productsCount === 0) {
      await prisma.product.createMany({
        data: [
          {
            name: 'Whopper Especial',
            description: 'Hamburguesa premium con queso fundido y aros de cebolla',
            price: 6490,
            image: '🍔',
            restaurantId: restaurant.id
          },
          {
            name: 'Papas Supremas',
            description: 'Grandes papas con tocino y salsa de queso cheddar',
            price: 3890,
            image: '🍟',
            restaurantId: restaurant.id
          },
          {
            name: 'Sundae de Chocolate',
            description: 'Helado cremoso con salsa caliente de chocolate',
            price: 1990,
            image: '🍦',
            restaurantId: restaurant.id
          }
        ]
      })
      console.log('Added products to Mi Local (owner)')
    } else {
        console.log('Mi Local (owner) already has products')
    }
  } else {
      console.log('Mi Local (owner) restaurant not found')
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
