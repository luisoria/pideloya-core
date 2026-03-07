import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Check if owner exists, if not create it
  const owner = await prisma.user.upsert({
    where: { email: 'owner1@test.com' },
    update: { role: 'RESTAURANT' },
    create: {
      email: 'owner1@test.com',
      name: 'John Burger',
      role: 'RESTAURANT'
    }
  })

  // Create Burger King
  const restaurant = await prisma.restaurant.upsert({
    where: { ownerId: owner.id },
    update: {
      name: 'Burger King',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      address: '123 Main St, Santiago',
      category: 'Burgers'
    },
    create: {
      name: 'Burger King',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      address: '123 Main St, Santiago',
      category: 'Burgers',
      ownerId: owner.id
    }
  })

  // Add some products
  await prisma.product.createMany({
    data: [
      {
        name: 'Whopper',
        description: 'Hamburguesa de res a la parrilla, rodajas de tomate fresco, lechuga, cebolla roja, mayonesa suave, ketchup y pepinillos crujientes',
        price: 5990,
        image: '🍔',
        restaurantId: restaurant.id
      },
      {
        name: 'Mega Bacon',
        description: 'Doble carne a la parrilla con abundante tocino, queso cheddar y salsa especial',
        price: 7490,
        image: '🥓',
        restaurantId: restaurant.id
      },
      {
        name: 'Papas Fritas XL',
        description: 'Crujientes y doradas, perfectas para acompañar tu Whopper',
        price: 2490,
        image: '🍟',
        restaurantId: restaurant.id
      },
      {
        name: 'Onion Rings',
        description: 'Aros de cebolla empanizados y crujientes',
        price: 2990,
        image: '🧅',
        restaurantId: restaurant.id
      }
    ]
  })

  console.log('Seed Burger King Complete')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
