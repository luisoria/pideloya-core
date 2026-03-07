import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      products: true,
      owner: true,
    }
  })
  console.log('RESTAURANTS:', JSON.stringify(restaurants, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
