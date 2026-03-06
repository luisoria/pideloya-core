import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // ── Usuarios ──────────────────────────────────────────
    const customer = await prisma.user.upsert({
        where: { email: 'customer@test.com' },
        update: {},
        create: { email: 'customer@test.com', name: 'John Customer', role: 'CUSTOMER', phone: '+56 9 1234 5678', status: 'VIP', ltv: 145.50 },
    })

    const admin = await prisma.user.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: { email: 'admin@test.com', name: 'Super Admin', role: 'ADMIN' },
    })

    const driver = await prisma.user.upsert({
        where: { email: 'driver@test.com' },
        update: {},
        create: { email: 'driver@test.com', name: 'Speedy Rider', role: 'DRIVER', phone: '+56 9 8765 4321' },
    })

    const owner = await prisma.user.upsert({
        where: { email: 'owner@test.com' },
        update: {},
        create: { email: 'owner@test.com', name: 'Burger King Owner', role: 'RESTAURANT', phone: '+56 2 2345 6789' },
    })

    const owner2 = await prisma.user.upsert({
        where: { email: 'owner2@test.com' },
        update: {},
        create: { email: 'owner2@test.com', name: 'Pizza Hut Owner', role: 'RESTAURANT', phone: '+56 2 3456 7890' },
    })

    const owner3 = await prisma.user.upsert({
        where: { email: 'owner3@test.com' },
        update: {},
        create: { email: 'owner3@test.com', name: 'Sushi Owner', role: 'RESTAURANT', phone: '+56 2 4567 8901' },
    })

    const owner4 = await prisma.user.upsert({
        where: { email: 'owner4@test.com' },
        update: {},
        create: { email: 'owner4@test.com', name: 'Empanada Owner', role: 'RESTAURANT', phone: '+56 2 5678 9012' },
    })

    const owner5 = await prisma.user.upsert({
        where: { email: 'owner5@test.com' },
        update: {},
        create: { email: 'owner5@test.com', name: 'Pollo Owner', role: 'RESTAURANT', phone: '+56 2 6789 0123' },
    })

    // ── Restaurantes con coords reales de Santiago ────────
    const burger = await prisma.restaurant.upsert({
        where: { ownerId: owner.id },
        update: { lat: -33.4372, lon: -70.6506, phone: '+56 2 2345 6789' },
        create: {
            name: 'Burger King Providencia',
            image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
            address: 'Av. Providencia 2124, Providencia, Santiago',
            category: 'Burgers',
            lat: -33.4372,
            lon: -70.6506,
            phone: '+56 2 2345 6789',
            ownerId: owner.id,
            products: {
                create: [
                    { name: 'Whopper Meal', description: 'Whopper + Papas + Bebida', price: 9990, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
                    { name: 'Hamburguesa de Tocineta', description: 'Con tocino crocante y queso cheddar', price: 8990, image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=400&q=80' },
                    { name: 'Chicken Crispy', description: 'Pollo crocante con mayo', price: 7990, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80' },
                    { name: 'Papas Grandes', description: 'Papas fritas tamaño familiar', price: 3490, image: 'https://images.unsplash.com/photo-1576107232684-1279f8604b53?w=400&q=80' },
                ],
            },
        },
    })

    const pizza = await prisma.restaurant.upsert({
        where: { ownerId: owner2.id },
        update: { lat: -33.4189, lon: -70.6064, phone: '+56 2 3456 7890' },
        create: {
            name: 'Pizza Hut Las Condes',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
            address: 'Av. Apoquindo 4501, Las Condes, Santiago',
            category: 'Pizza',
            lat: -33.4189,
            lon: -70.6064,
            phone: '+56 2 3456 7890',
            ownerId: owner2.id,
            products: {
                create: [
                    { name: 'Pizza Pepperoni Grande', description: 'Masa tradicional, salsa tomate y pepperoni', price: 14990, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80' },
                    { name: 'Pizza Hawaiana', description: 'Jamón, piña y mozzarella', price: 13990, image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80' },
                    { name: 'Garlic Bread', description: 'Pan de ajo con mantequilla', price: 3990, image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&q=80' },
                    { name: 'Alitas BBQ', description: '12 alitas en salsa BBQ', price: 8990, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80' },
                ],
            },
        },
    })

    const sushi = await prisma.restaurant.upsert({
        where: { ownerId: owner3.id },
        update: { lat: -33.4259, lon: -70.6088, phone: '+56 2 4567 8901' },
        create: {
            name: 'Sushi Osaka Vitacura',
            image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
            address: 'Av. Vitacura 3565, Vitacura, Santiago',
            category: 'Sushi',
            lat: -33.4259,
            lon: -70.6088,
            phone: '+56 2 4567 8901',
            ownerId: owner3.id,
            products: {
                create: [
                    { name: 'Combo Salmón 16 piezas', description: 'Nigiri y rolls de salmón premium', price: 16990, image: 'https://images.unsplash.com/photo-1617196033183-421ae4bb5c2b?w=400&q=80' },
                    { name: 'Rock & Roll 8 piezas', description: 'Roll tempura con palta y queso', price: 9990, image: 'https://images.unsplash.com/photo-1617196034059-1e16c19c4ac1?w=400&q=80' },
                    { name: 'Edamame', description: 'Vainas de soja saladas', price: 3490, image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&q=80' },
                    { name: 'Miso Soup', description: 'Sopa de miso tradicional', price: 2490, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80' },
                ],
            },
        },
    })

    const empanadas = await prisma.restaurant.upsert({
        where: { ownerId: owner4.id },
        update: { lat: -33.4569, lon: -70.6483, phone: '+56 2 5678 9012' },
        create: {
            name: 'El Rincón de las Empanadas',
            image: 'https://images.unsplash.com/photo-1598511726067-f00cfada9ce5?w=800&q=80',
            address: 'Av. Grecia 1250, Ñuñoa, Santiago',
            category: 'Comida Chilena',
            lat: -33.4569,
            lon: -70.6483,
            phone: '+56 2 5678 9012',
            ownerId: owner4.id,
            products: {
                create: [
                    { name: 'Empanada de Pino', description: 'Carne picada, huevo, aceituna y cebolla', price: 2990, image: 'https://images.unsplash.com/photo-1617636173735-8e8c9e4a0d8b?w=400&q=80' },
                    { name: 'Empanada de Queso', description: 'Queso derretido crujiente', price: 2490, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80' },
                    { name: 'Combo 6 Empanadas', description: 'Mix de sabores a elegir', price: 14990, image: 'https://images.unsplash.com/photo-1598511726067-f00cfada9ce5?w=400&q=80' },
                    { name: 'Sopaipillas', description: 'Sopaipillas fritas con pebre', price: 1990, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
                ],
            },
        },
    })

    const pollo = await prisma.restaurant.upsert({
        where: { ownerId: owner5.id },
        update: { lat: -33.4831, lon: -70.6508, phone: '+56 2 6789 0123' },
        create: {
            name: 'Pollo Feliz Maipú',
            image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
            address: 'Av. Américo Vespucio 1260, Maipú, Santiago',
            category: 'Chicken',
            lat: -33.4831,
            lon: -70.6508,
            phone: '+56 2 6789 0123',
            ownerId: owner5.id,
            products: {
                create: [
                    { name: 'Pollo Entero a las Brasas', description: 'Pollo rostizado con papas y ensalada', price: 8990, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=400&q=80' },
                    { name: 'Medio Pollo + Papas', description: 'Medio pollo con papas fritas', price: 5490, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80' },
                    { name: 'Alitas Picantes x8', description: '8 alitas en salsa picante', price: 6990, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80' },
                    { name: 'Completo Italiano', description: 'Pan, salchicha, palta, tomate y mayo', price: 2990, image: 'https://images.unsplash.com/photo-1612392062631-94e6e857f98d?w=400&q=80' },
                ],
            },
        },
    })

    // ── Tickets de soporte ────────────────────────────────
    await prisma.ticket.upsert({
        where: { id: 'ticket-001' },
        update: {},
        create: { id: 'ticket-001', ticketNumber: 'TKT-20001', issue: 'Pedido llegó frío y con productos faltantes', description: 'Mi pedido de Burger King llegó frío y faltaba la hamburguesa de tocineta.', category: 'ORDER_ISSUE', priority: 'HIGH', requesterType: 'CUSTOMER', userId: customer.id },
    })
    await prisma.ticket.upsert({
        where: { id: 'ticket-002' },
        update: {},
        create: { id: 'ticket-002', ticketNumber: 'TKT-20002', issue: 'Driver tardó más de 1 hora en llegar', description: 'El repartidor tardó más de 60 minutos y el pedido ya estaba frío.', category: 'DELIVERY', priority: 'MEDIUM', requesterType: 'CUSTOMER', userId: customer.id },
    })

    // ── Órdenes READY para el driver ──────────────────────
    // Obtenemos los productos creados
    const burgerProducts = await prisma.product.findMany({ where: { restaurantId: burger.id } })
    const pizzaProducts = await prisma.product.findMany({ where: { restaurantId: pizza.id } })
    const sushiProducts = await prisma.product.findMany({ where: { restaurantId: sushi.id } })

    // Orden 1: READY en Burger King
    const existingOrder1 = await prisma.order.findFirst({ where: { restaurantId: burger.id, status: 'READY' } })
    if (!existingOrder1) {
        await prisma.order.create({
            data: {
                status: 'READY',
                total: 17980,
                customerId: customer.id,
                restaurantId: burger.id,
                items: {
                    create: [
                        { productId: burgerProducts[0].id, quantity: 1, price: burgerProducts[0].price },
                        { productId: burgerProducts[1].id, quantity: 1, price: burgerProducts[1].price },
                    ],
                },
            },
        })
    }

    // Orden 2: READY en Pizza Hut
    const existingOrder2 = await prisma.order.findFirst({ where: { restaurantId: pizza.id, status: 'READY' } })
    if (!existingOrder2) {
        await prisma.order.create({
            data: {
                status: 'READY',
                total: 14990,
                customerId: customer.id,
                restaurantId: pizza.id,
                items: {
                    create: [
                        { productId: pizzaProducts[0].id, quantity: 1, price: pizzaProducts[0].price },
                    ],
                },
            },
        })
    }

    // Orden 3: READY en Sushi
    const existingOrder3 = await prisma.order.findFirst({ where: { restaurantId: sushi.id, status: 'READY' } })
    if (!existingOrder3) {
        await prisma.order.create({
            data: {
                status: 'READY',
                total: 19480,
                customerId: customer.id,
                restaurantId: sushi.id,
                items: {
                    create: [
                        { productId: sushiProducts[0].id, quantity: 1, price: sushiProducts[0].price },
                        { productId: sushiProducts[2].id, quantity: 1, price: sushiProducts[2].price },
                    ],
                },
            },
        })
    }

    // Orden 4: PENDING en Burger (para el dashboard del restaurante) 
    const existingPending = await prisma.order.findFirst({ where: { restaurantId: burger.id, status: 'PENDING' } })
    if (!existingPending) {
        await prisma.order.create({
            data: {
                status: 'PENDING',
                total: 8990,
                customerId: customer.id,
                restaurantId: burger.id,
                items: {
                    create: [
                        { productId: burgerProducts[1].id, quantity: 1, price: burgerProducts[1].price },
                    ],
                },
            },
        })
    }

    // ── Clientes adicionales para reseñas ──────────────────
    const customer2 = await prisma.user.upsert({
        where: { email: 'maria@test.com' },
        update: {},
        create: { email: 'maria@test.com', name: 'María González', role: 'CUSTOMER', phone: '+56 9 5555 1111', status: 'VIP', ltv: 89.90 },
    })
    const customer3 = await prisma.user.upsert({
        where: { email: 'carlos@test.com' },
        update: {},
        create: { email: 'carlos@test.com', name: 'Carlos Soto', role: 'CUSTOMER', phone: '+56 9 5555 2222', status: 'REGULAR', ltv: 45.00 },
    })
    const customer4 = await prisma.user.upsert({
        where: { email: 'valentina@test.com' },
        update: {},
        create: { email: 'valentina@test.com', name: 'Valentina Reyes', role: 'CUSTOMER', phone: '+56 9 5555 3333', status: 'NEW', ltv: 12.50 },
    })

    // ── Reseñas ──────────────────────────────────────────
    const reviewsData = [
        // Burger King - avg ~4.5
        { rating: 5, comment: '¡La mejor Whopper de Santiago! Llegó caliente y en tiempo.', customerId: customer.id, restaurantId: burger.id },
        { rating: 4, comment: 'Buenas hamburguesas, papas un poco frías pero todo bien.', customerId: customer2.id, restaurantId: burger.id },
        { rating: 5, comment: 'Rápido y delicioso. El Chicken Crispy es adictivo 🍗', customerId: customer3.id, restaurantId: burger.id },
        { rating: 4, comment: 'Siempre consistente, buena relación precio-calidad.', customerId: customer4.id, restaurantId: burger.id },
        // Pizza Hut - avg ~4.3
        { rating: 5, comment: 'Pizza Pepperoni espectacular, masa perfecta.', customerId: customer.id, restaurantId: pizza.id },
        { rating: 4, comment: 'Buena pizza pero tardó un poco más de lo esperado.', customerId: customer2.id, restaurantId: pizza.id },
        { rating: 4, comment: 'Las alitas BBQ son increíbles, volveré a pedir.', customerId: customer3.id, restaurantId: pizza.id },
        { rating: 5, comment: 'Pan de ajo divino, y la hawaiana mejor que en el local.', customerId: customer4.id, restaurantId: pizza.id },
        // Sushi Osaka - avg ~4.7
        { rating: 5, comment: 'Salmón fresco, presentación impecable. Top tier sushi 🍣', customerId: customer.id, restaurantId: sushi.id },
        { rating: 5, comment: 'El mejor sushi delivery de Vitacura sin duda.', customerId: customer2.id, restaurantId: sushi.id },
        { rating: 4, comment: 'Muy rico, solo le faltó un poco más de wasabi.', customerId: customer3.id, restaurantId: sushi.id },
        { rating: 5, comment: 'Combo de 16 piezas generoso y ultra fresco.', customerId: customer4.id, restaurantId: sushi.id },
        // Empanadas - avg ~4.8
        { rating: 5, comment: '¡Las mejores empanadas de pino! Como las de la abuela 🫔', customerId: customer.id, restaurantId: empanadas.id },
        { rating: 5, comment: 'Sopaipillas recién hechas, increíble para un delivery.', customerId: customer2.id, restaurantId: empanadas.id },
        { rating: 5, comment: 'Combo de 6 empanadas para compartir, todas perfectas.', customerId: customer3.id, restaurantId: empanadas.id },
        { rating: 4, comment: 'Empanadas de queso riquísimas, las de pino un 10/10.', customerId: customer4.id, restaurantId: empanadas.id },
        // Pollo Feliz - avg ~4.0
        { rating: 4, comment: 'Pollo jugoso y bien sazonado, papas abundantes.', customerId: customer.id, restaurantId: pollo.id },
        { rating: 3, comment: 'El pollo estaba bien pero las alitas no estaban tan picantes.', customerId: customer2.id, restaurantId: pollo.id },
        { rating: 5, comment: 'Completo italiano brutal, como los del carrito pero mejor 🌭', customerId: customer3.id, restaurantId: pollo.id },
        { rating: 4, comment: 'Buena porción por el precio. El pollo entero rinde mucho.', customerId: customer4.id, restaurantId: pollo.id },
    ]

    for (const review of reviewsData) {
        const existing = await prisma.review.findFirst({
            where: { customerId: review.customerId, restaurantId: review.restaurantId }
        })
        if (!existing) {
            await prisma.review.create({ data: review })
        }
    }

    // ── Favoritos ──────────────────────────────────────────
    const favoritesData = [
        { userId: customer.id, restaurantId: burger.id },
        { userId: customer.id, restaurantId: sushi.id },
        { userId: customer.id, restaurantId: empanadas.id },
        { userId: customer2.id, restaurantId: pizza.id },
        { userId: customer2.id, restaurantId: empanadas.id },
        { userId: customer3.id, restaurantId: burger.id },
        { userId: customer3.id, restaurantId: pollo.id },
    ]

    for (const fav of favoritesData) {
        const existing = await prisma.favorite.findFirst({
            where: { userId: fav.userId, restaurantId: fav.restaurantId }
        })
        if (!existing) {
            await prisma.favorite.create({ data: fav })
        }
    }

    const restaurants = await prisma.restaurant.findMany()
    const orders = await prisma.order.findMany()
    const reviews = await prisma.review.findMany()
    const favorites = await prisma.favorite.findMany()
    console.log(`✅ Seed completo:`)
    console.log(`   👤 Usuarios: 4 customers, admin, driver, owner x5`)
    console.log(`   🍽️  Restaurantes: ${restaurants.length}`)
    console.log(`   📦 Órdenes: ${orders.length} (3 READY para driver, 1 PENDING)`)
    console.log(`   ⭐ Reseñas: ${reviews.length}`)
    console.log(`   ❤️  Favoritos: ${favorites.length}`)
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
