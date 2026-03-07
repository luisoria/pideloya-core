import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const bk = await prisma.restaurant.findFirst({
    where: { name: { contains: 'Burger King' } }
  })
  console.log('BK Data:', JSON.stringify(bk, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
