import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const bk = await prisma.restaurant.update({
    where: { name: 'Burger King' },
    data: {
      closeTime: '03:00',
      acceptingOrders: true
    }
  })
  console.log('Updated BK:', bk)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
