import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const bks = await prisma.restaurant.findMany({
    where: { name: { contains: 'Burger King' } }
  })
  
  if (bks.length > 0) {
    for (const b of bks) {
      await prisma.restaurant.update({
        where: { id: b.id },
        data: {
          closeTime: '03:00',
          acceptingOrders: true
        }
      })
      console.log(`Updated BK (ID ${b.id}) to close at 03:00`)
    }
  } else {
    console.log('No BK found to update')
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
