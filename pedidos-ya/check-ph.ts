import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const ph = await prisma.restaurant.findFirst({
    where: { name: { contains: 'Pizza Hut' } },
    include: { products: true, owner: true }
  })
  console.log('Pizza Hut:', JSON.stringify(ph, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
