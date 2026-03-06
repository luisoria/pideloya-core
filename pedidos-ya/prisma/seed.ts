import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create Base Users
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      name: 'Cliente Demo',
      role: 'CUSTOMER',
    },
  })

  const owner = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: {
      email: 'owner@test.com',
      name: 'Owner Restaurant',
      role: 'RESTAURANT',
    },
  })

  const driver = await prisma.user.upsert({
    where: { email: 'driver@test.com' },
    update: {},
    create: {
      email: 'driver@test.com',
      name: 'Driver Moto',
      role: 'DRIVER',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin Boss',
      role: 'ADMIN',
    },
  })

  // 2. Create Restaurants
  const restaurant1 = await prisma.restaurant.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      name: 'Burger King',
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
      address: '123 Main St, Santiago',
      category: 'Burgers',
      ownerId: owner.id,
      products: {
        create: [
          { name: 'Whopper Meal', description: 'Whopper + Fries + Drink', price: 9.99, image: '🍔' },
          { name: 'Cheeseburger', description: 'Classic cheeseburger', price: 4.99, image: '🧀' },
          { name: 'Chicken Fries', description: 'Crispy chicken fries', price: 5.49, image: '🍟' },
        ]
      }
    }
  })

  const owner2 = await prisma.user.upsert({
    where: { email: 'owner2@test.com' },
    update: {},
    create: {
      email: 'owner2@test.com',
      name: 'Luigi Pizza',
      role: 'RESTAURANT',
    },
  })

  const restaurant2 = await prisma.restaurant.upsert({
      where: { ownerId: owner2.id },
      update: {},
      create: {
          name: 'Pizza Hut',
          image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80',
          address: '456 Oak Ave, Santiago',
          category: 'Pizza',
          ownerId: owner2.id,
          products: {
              create: [
                  { name: 'Pepperoni Pizza', description: 'Large Pepperoni', price: 12.99, image: '🍕' },
                  { name: 'Garlic Bread', description: 'Crispy Garlic Bread', price: 3.99, image: '🥖' },
              ]
          }
      }
  })

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
