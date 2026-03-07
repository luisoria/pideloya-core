import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1. Get or create owner2 user
  const owner = await prisma.user.upsert({
    where: { email: 'owner2@test.com' },
    update: { role: 'RESTAURANT' },
    create: {
      email: 'owner2@test.com',
      name: 'Luigi Pizza',
      role: 'RESTAURANT'
    }
  })

  // 2. Create Pizza Hut
  const ph = await prisma.restaurant.upsert({
    where: { ownerId: owner.id },
    update: {
      name: 'Pizza Hut',
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80',
      address: '456 Oak Ave, Santiago',
      category: 'Pizza'
    },
    create: {
      name: 'Pizza Hut',
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80',
      address: '456 Oak Ave, Santiago',
      category: 'Pizza',
      ownerId: owner.id
    }
  })

  // 3. Add products to PH
  await prisma.product.createMany({
    data: [
      {
        name: 'Pepperoni Lovers',
        description: 'Doble porción de pepperoni con el inconfundible queso mozzarella de Pizza Hut',
        price: 9990,
        image: '🍕',
        restaurantId: ph.id
      },
      {
        name: 'Super Supreme',
        description: 'Nuestra pizza más completa: carne, pepperoni, pimentones, cebolla, champiñones y aceitunas negras',
        price: 11990,
        image: '🍕',
        restaurantId: ph.id
      },
      {
        name: 'Palitroques con Queso',
        description: 'Masa recién horneada con una deliciosa capa de queso mozzarella fundido',
        price: 4990,
        image: '🥖',
        restaurantId: ph.id
      },
      {
        name: 'Rolls de Canela',
        description: 'Para el postre: masa dulce con canela y glaseado suave',
        price: 3990,
        image: '🧁',
        restaurantId: ph.id
      }
    ]
  })

  console.log('Restoration for Pizza Hut (owner2@test.com) Complete')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
