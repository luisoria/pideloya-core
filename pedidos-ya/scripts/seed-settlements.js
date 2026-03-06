const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSettlements() {
    try {
        const restaurant = await prisma.restaurant.findFirst({
            where: { name: { contains: 'Pollo Feliz' } }
        });

        if (!restaurant) {
            console.log('Restaurante Pollo Feliz no encontrado');
            return;
        }

        const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
        if (!customer) {
            // Create a dummy customer if none exists
            const dummy = await prisma.user.create({
                data: {
                    name: 'Cliente Prueba',
                    email: 'test' + Date.now() + '@test.com',
                    password: 'password123',
                    role: 'CUSTOMER'
                }
            });
            customer = dummy;
        }

        // Calcular fechas para la semana pasada
        // Digamos, pedidos entre hace 10 y 5 días
        const now = new Date();

        const ordersData = [
            { total: 18990, daysAgo: 8 },
            { total: 25500, daysAgo: 9 },
            { total: 12400, daysAgo: 10 },
            { total: 42000, daysAgo: 7 }
        ];

        for (const item of ordersData) {
            const orderDate = new Date();
            orderDate.setDate(now.getDate() - item.daysAgo);

            await prisma.order.create({
                data: {
                    restaurantId: restaurant.id,
                    customerId: customer.id,
                    status: 'DELIVERED',
                    total: item.total,
                    createdAt: orderDate,
                    paymentMethod: 'CARD'
                }
            });
        }

        console.log('--- EXITO ---');
        console.log('Se crearon 4 pedidos entregados para la semana anterior en ' + restaurant.name);
    } catch (e) {
        console.error('Error in seed script:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedSettlements();
