import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const bk = await prisma.restaurant.findFirst({
    where: { name: { contains: 'Burger King' } },
    include: { products: true }
  })
  console.log('BK:', bk)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
