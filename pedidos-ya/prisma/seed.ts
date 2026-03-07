import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Delete all existing data to prevent unique constraints or duplication issues
async function cleanDB() {
  console.log('Limpiando base de datos...')
  // Using deleteMany in reverse order of dependencies
  await prisma.orderItem.deleteMany().catch(() => {})
  await prisma.couponUsage.deleteMany().catch(() => {})
  await prisma.order.deleteMany().catch(() => {})
  await prisma.coupon.deleteMany().catch(() => {})
  await prisma.review.deleteMany().catch(() => {})
  await prisma.favorite.deleteMany().catch(() => {})
  await prisma.product.deleteMany().catch(() => {})
  await prisma.restaurantCommissionRecord.deleteMany().catch(() => {})
  await prisma.restaurant.deleteMany().catch(() => {})
  await prisma.restaurantApplication.deleteMany().catch(() => {})
  await prisma.driverApplication.deleteMany().catch(() => {})
  await prisma.ticketReply.deleteMany().catch(() => {})
  await prisma.ticket.deleteMany().catch(() => {})
  
  // Wait, deleting users might delete the users the client actually signed up with.
  // We'll only delete test users created by seed.
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test.com'
      }
    }
  }).catch(() => {})
}

async function main() {
  await cleanDB()
  
  console.log('Iniciando siembra de datos masiva...')

  // Clientes y Roles base
  await prisma.user.create({
    data: { email: 'customer@test.com', name: 'Cliente Demo', role: 'CUSTOMER' }
  })
  await prisma.user.create({
    data: { email: 'driver@test.com', name: 'Driver Moto', role: 'DRIVER' }
  })
  await prisma.user.create({
    data: { email: 'admin@test.com', name: 'Admin Boss', role: 'ADMIN' }
  })

  // Lista de Categorías y sus Restaurantes
  const restaurantsData = [
    // Burgers
    {
      email: 'burgerking@test.com', name: 'Burger Rey', category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
      address: 'Av. Providencia 123', phone: '+56900000001',
      products: [
        { name: 'Doble Queso', description: 'Doble hamburguesa con extra queso', price: 6500, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
        { name: 'Papas Fritas XL', description: 'Porción grande de papas cruzadas', price: 2500, image: 'https://images.unsplash.com/photo-1573059224875-f1404306b3e2?w=400&q=80' },
        { name: 'Coca Cola', description: 'Bebida en lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Pepsi', description: 'Bebida en lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1629203851288-7ece11236502?w=400&q=80' }
      ]
    },
    {
      email: 'mcdonalds@test.com', name: 'MacHamburguesas', category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
      address: 'Alameda 456', phone: '+56900000002',
      products: [
        { name: 'Cuarto de Libra', description: 'Clásica de 1/4 libra', price: 5900, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80' },
        { name: 'Nuggets x10', description: 'Crujientes nuggets de pollo', price: 3900, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80' },
        { name: 'Coca Cola Zero', description: 'Bebida Zero 500cc', price: 1800, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Sprite', description: 'Bebida en lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d4b3?w=400&q=80' }
      ]
    },
    // Pizza
    {
      email: 'pizzahut@test.com', name: 'Pizza Experta', category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      address: 'Irarrázaval 789', phone: '+56900000003',
      products: [
        { name: 'Pizza Pepperoni Familiar', description: 'Queso y Pepperoni', price: 12900, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80' },
        { name: 'Palitos de Ajo', description: 'Porción de 8 palitos', price: 3500, image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80' },
        { name: 'Coca Cola', description: 'Bebida 1.5 L', price: 2500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Pepsi', description: 'Bebida 1.5 L', price: 2500, image: 'https://images.unsplash.com/photo-1629203851288-7ece11236502?w=400&q=80' }
      ]
    },
    {
      email: 'papajohns@test.com', name: 'Papa Pizzas', category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80',
      address: 'Apoquindo 100', phone: '+56900000004',
      products: [
        { name: 'Pizza Mechada', description: 'Carne mechada y cebolla', price: 14900, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
        { name: 'Alitas BBQ', description: 'Alitas de pollo Bañadas', price: 5900, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80' },
        { name: 'Coca Cola', description: 'Bebida en Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Fanta', description: 'Bebida en Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&q=80' }
      ]
    },
    // Sushi
    {
      email: 'sushi1@test.com', name: 'Mundo Sushi', category: 'Sushi',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
      address: 'Tobalaba 200', phone: '+56900000005',
      products: [
        { name: 'Avocado Roll', description: 'Envuelto en palta, relleno salmón', price: 6900, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80' },
        { name: 'Gyozas de Cerdo', description: '5 unidades', price: 3900, image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=400&q=80' },
        { name: 'Pepsi', description: 'Bebida Lata', price: 1500, image: 'https://images.unsplash.com/photo-1629203851288-7ece11236502?w=400&q=80' },
        { name: 'Agua Mineral', description: 'Sin gas 500cc', price: 1200, image: 'https://images.unsplash.com/photo-1559839914-17aae19cb840?w=400&q=80' }
      ]
    },
    {
      email: 'sushi2@test.com', name: 'Niu Rolls', category: 'Sushi',
      image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
      address: 'Vitacura 300', phone: '+56900000006',
      products: [
        { name: 'Panko Roll', description: 'Frito en panko relleno camarón', price: 7500, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80' },
        { name: 'Yakimeshi Pollo', description: 'Arroz salteado con pollo', price: 5900, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80' },
        { name: 'Coca Cola', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Jugo Natural', description: 'Mango o Frambuesa', price: 2500, image: 'https://images.unsplash.com/photo-1622597467836-f382441c09eb?w=400&q=80' }
      ]
    },
    // Pollo
    {
      email: 'kfc@test.com', name: 'Pollo Crujiente', category: 'Pollo',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
      address: 'Vicuña Mackenna 400', phone: '+56900000007',
      products: [
        { name: 'Bucket 10 Piezas', description: '10 presas de pollo frito', price: 14900, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' },
        { name: 'Papas Familiares', description: 'Papas fritas grandes', price: 3500, image: 'https://images.unsplash.com/photo-1573059224875-f1404306b3e2?w=400&q=80' },
        { name: 'Pepsi', description: 'Botella 1.5L', price: 2500, image: 'https://images.unsplash.com/photo-1629203851288-7ece11236502?w=400&q=80' },
        { name: '7Up', description: 'Botella 1.5L', price: 2500, image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d4b3?w=400&q=80' }
      ]
    },
    {
      email: 'tarragona@test.com', name: 'Pollo y Papas', category: 'Pollo',
      image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
      address: 'Bandera 500', phone: '+56900000008',
      products: [
        { name: 'Combo Pollo Asado', description: '1/4 de Pollo Asado con Papas', price: 5900, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80' },
        { name: 'Empanadas Queso', description: '3 Empanadas fritas', price: 2000, image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=400&q=80' },
        { name: 'Coca Cola', description: 'Vaso 500cc', price: 1500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Fanta', description: 'Vaso 500cc', price: 1500, image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&q=80' }
      ]
    },
    // Chilena
    {
      email: 'domino@test.com', name: 'Rey del Completo', category: 'Chilena',
      image: 'https://images.unsplash.com/photo-1629226500858-a8d6be6f9e60?w=800&q=80',
      address: 'Agustinas 600', phone: '+56900000009',
      products: [
        { name: 'Completo Italiano', description: 'Vienesa, tomate, palta y mayo', price: 2800, image: 'https://images.unsplash.com/photo-1629226500858-a8d6be6f9e60?w=400&q=80' },
        { name: 'As Italiano', description: 'Carne picada, tomate, palta y mayo', price: 4500, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
        { name: 'Coca Cola', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Pepsi', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1629203851288-7ece11236502?w=400&q=80' }
      ]
    },
    {
      email: 'juanmaestro@test.com', name: 'Maestro Sanguche', category: 'Chilena',
      image: 'https://images.unsplash.com/photo-1549590143-d5855148a9d5?w=800&q=80',
      address: 'Huerfanos 700', phone: '+56900000010',
      products: [
        { name: 'Churrasco Italiano', description: 'Pan frica, carne, palta, tomate, mayo', price: 6500, image: 'https://images.unsplash.com/photo-1549590143-d5855148a9d5?w=400&q=80' },
        { name: 'Lomito Luco', description: 'Lomito de cerdo con queso fundido', price: 5900, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
        { name: 'Coca Cola', description: 'Vaso 400cc', price: 1800, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
        { name: 'Kem Piña', description: 'Vaso 400cc', price: 1800, image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d4b3?w=400&q=80' }
      ]
    },
    // Saludable
    {
      email: 'greenhats@test.com', name: 'Vida Verde', category: 'Saludable',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
      address: 'Isidora Goyenechea 800', phone: '+56900000011',
      products: [
        { name: 'Ensalada César', description: 'Lechuga, crutones, queso, pollo', price: 5500, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
        { name: 'Wrap de Atún', description: 'Tortilla integral, atún y verduras', price: 4500, image: 'https://images.unsplash.com/photo-1626700051175-1a069df91999?w=400&q=80' },
        { name: 'Botella Agua Mineral', description: 'Sin gas 500cc', price: 1200, image: 'https://images.unsplash.com/photo-1559839914-17aae19cb840?w=400&q=80' },
        { name: 'Jugo Verde Detox', description: 'Manzana, apio, espinaca', price: 2800, image: 'https://images.unsplash.com/photo-1622597467836-f382441c09eb?w=400&q=80' }
      ]
    },
    {
      email: 'nutribowl@test.com', name: 'Nutri Bowls', category: 'Saludable',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      address: 'El Bosque 900', phone: '+56900000012',
      products: [
        { name: 'Poke Bowl Salmón', description: 'Arroz sushi, salmón crudo, edamames', price: 7900, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
        { name: 'Bowl Quinoa Pollo', description: 'Quinoa, palta, pollo plancha', price: 6900, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
        { name: 'Kombucha Berries', description: 'Té fermentado', price: 3000, image: 'https://images.unsplash.com/photo-1622597467836-f382441c09eb?w=400&q=80' },
        { name: 'Coca Cola Light', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' }
      ]
    },
    // Postres
    {
      email: 'dunkin@test.com', name: 'Dulce Dona', category: 'Postres',
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
      address: 'Costanera Center', phone: '+56900000013',
      products: [
        { name: 'Caja 6 Donuts', description: 'Surtido clásico', price: 5900, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80' },
        { name: 'Muffin de Chocolate', description: 'Relleno con trufa', price: 2500, image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80' },
        { name: 'Café Latte', description: 'Café espresso con leche caliente', price: 2900, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
        { name: 'Coca Cola', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' }
      ]
    },
    {
      email: 'starbucks@test.com', name: 'Café & Dulces', category: 'Postres',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
      address: 'Plaza Vespucio', phone: '+56900000014',
      products: [
        { name: 'Cheesecake Frambuesa', description: 'Porción individual', price: 3900, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80' },
        { name: 'Brownie Nuez', description: 'Puro chocolate con nueces', price: 2500, image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80' },
        { name: 'Frappuccino Caramelo', description: 'Café helado con crema', price: 4500, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
        { name: 'Pepsi', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1629203851288-7ece11236502?w=400&q=80' }
      ]
    }
  ];

  for (const rData of restaurantsData) {
    // Crear el dueño
    const owner = await prisma.user.create({
      data: {
        email: rData.email,
        name: `Dueño de ${rData.name}`,
        role: 'RESTAURANT'
      }
    });

    // Crear el restaurante y sus productos
    await prisma.restaurant.create({
      data: {
        name: rData.name,
        image: rData.image,
        category: rData.category,
        address: rData.address,
        phone: rData.phone,
        ownerId: owner.id,
        // Varied schedules for testing
        openTime: rData.category === 'Postres' ? '12:00' : '09:00',
        closeTime: rData.category === 'Sushi' ? '00:00' : '23:00',
        // Make one specific restaurant closed for demonstration
        acceptingOrders: rData.name !== 'Burger Rey', 
        products: {
          create: rData.products
        }
      }
    });
  }

  console.log(`¡Se han sembrado ${restaurantsData.length} restaurantes exitosamente!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
