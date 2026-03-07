import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando expansión de catálogo de restaurantes...')

  const restaurantsData = [
    // Burgers (2)
    {
      email: 'wendys@test.com', name: 'Wendo Burgers', category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80',
      address: 'Costanera Center', phone: '+56911110001',
      products: [
        { name: 'Hamburguesa Bacon', description: 'Tocino ahumado y queso cheddar', price: 6900, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80' },
        { name: 'Aros de Cebolla', description: '10 unidades', price: 2900, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=80' },
        { name: 'Fanta', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&q=80' }
      ]
    },
    {
      email: 'carlsjr@test.com', name: 'Carlos Jr.', category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
      address: 'Nueva Las Condes', phone: '+56911110002',
      products: [
        { name: 'Famous Star Beef', description: '100% Angus', price: 8900, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
        { name: 'Papas Waffle', description: 'Papas con corte especial', price: 3500, image: 'https://images.unsplash.com/photo-1573059224875-f1404306b3e2?w=400&q=80' },
        { name: 'Sprite', description: 'Botella 500cc', price: 1800, image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d4b3?w=400&q=80' }
      ]
    },
    
    // Pizza (2)
    {
      email: 'telepizza@test.com', name: 'Tele Pizzas', category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
      address: 'Vicuña Mackenna 2000', phone: '+56911110003',
      products: [
        { name: 'Pizza Barbacoa', description: 'Salsa BBQ, carne, pollo', price: 13900, image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80' },
        { name: 'Pizzolinos', description: 'Mini rolls de pepperoni', price: 4900, image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80' },
        { name: 'Pepsi', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1629203851288-7ece11236502?w=400&q=80' }
      ]
    },
    {
      email: 'melt@test.com', name: 'Melt Pizzas', category: 'Pizza',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      address: 'Pocuro 3000', phone: '+56911110004',
      products: [
        { name: 'Pizza Margarita', description: 'Albahaca, tomate, mozzarella', price: 11900, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
        { name: 'Papas Trufadas', description: 'Papas fritas con aceite de trufa', price: 5900, image: 'https://images.unsplash.com/photo-1573059224875-f1404306b3e2?w=400&q=80' },
        { name: 'Agua Mineral', description: 'Botella 500cc', price: 1500, image: 'https://images.unsplash.com/photo-1559839914-17aae19cb840?w=400&q=80' }
      ]
    },

    // Sushi (2)
    {
      email: 'sushihouse@test.com', name: 'Sushi de la Casa', category: 'Sushi',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
      address: 'Américo Vespucio Sur', phone: '+56911110005',
      products: [
        { name: 'Sashimi Salmón', description: 'Cortes premium 10 unidades', price: 9900, image: 'https://images.unsplash.com/photo-1534482421627-c10b7546f53e?w=400&q=80' },
        { name: 'Ebi Fried Roll', description: 'Camarón furai envuelto en queso crema', price: 7900, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80' },
        { name: 'Jugo Natural Mango', description: '300cc', price: 2900, image: 'https://images.unsplash.com/photo-1622597467836-f382441c09eb?w=400&q=80' }
      ]
    },
    {
      email: 'samurai@test.com', name: 'Samurai Rolls', category: 'Sushi',
      image: 'https://images.unsplash.com/photo-1558985250-27a406d64cb3?w=800&q=80',
      address: 'Pedro de Valdivia', phone: '+56911110006',
      products: [
        { name: 'Ceviche Mixto', description: 'Pescado blanco, salmón, pulpo', price: 8900, image: 'https://images.unsplash.com/photo-1534604973900-c4391e428502?w=400&q=80' },
        { name: 'California Roll', description: 'Kanikama, palta', price: 5900, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80' },
        { name: 'Limonada', description: 'Con Menta y Jengibre', price: 3500, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' }
      ]
    },

    // Pollo (2)
    {
      email: 'campero@test.com', name: 'Pollo Campero', category: 'Pollo',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
      address: 'Avenida Brasil', phone: '+56911110007',
      products: [
        { name: 'Pollo 1/2 asado', description: 'La mitad de un pollo con especias', price: 7900, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80' },
        { name: 'Ensalada Coleslaw', description: 'Poción mediana', price: 2500, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
        { name: 'Coca Cola', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' }
      ]
    },
    {
      email: 'chickenlove@test.com', name: 'Amor al Pollo', category: 'Pollo',
      image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&q=80',
      address: 'Barrio Italia', phone: '+56911110008',
      products: [
        { name: 'Sandwich Pollo Frito', description: 'Crispy chicken sandwich', price: 6900, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80' },
        { name: 'Papas Rústicas', description: 'Doble cocción', price: 3500, image: 'https://images.unsplash.com/photo-1573059224875-f1404306b3e2?w=400&q=80' },
        { name: 'Sprite', description: 'Lata 350cc', price: 1500, image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d4b3?w=400&q=80' }
      ]
    },

    // Chilena (2)
    {
      email: 'elhoyos@test.com', name: 'Restaurant El Hoyo', category: 'Chilena',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
      address: 'Estación Central', phone: '+56911110009',
      products: [
        { name: 'Pernil de Cerdo', description: 'Especialidad de la casa', price: 9900, image: 'https://images.unsplash.com/photo-1549590143-d5855148a9d5?w=400&q=80' },
        { name: 'Pastel de Choclo', description: 'Plato tradicional en greda', price: 7500, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
        { name: 'Terremoto', description: 'Bebida tradicional', price: 4500, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' }
      ]
    },
    {
      email: 'lafuente@test.com', name: 'Fuente Chilena', category: 'Chilena',
      image: 'https://images.unsplash.com/photo-1629226500858-a8d6be6f9e60?w=800&q=80',
      address: 'Avenida Apoquindo', phone: '+56911110010',
      products: [
        { name: 'Barros Luco', description: 'Empanada de carne y queso', price: 6900, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
        { name: 'Crudo Alemán', description: 'Carne cruda con tostadas', price: 8500, image: 'https://images.unsplash.com/photo-1534604973900-c4391e428502?w=400&q=80' },
        { name: 'Schop Cristal', description: 'Cerveza de litro', price: 3500, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' }
      ]
    },

    // Saludable (2)
    {
      email: 'veganfood@test.com', name: 'Comida Vegana 100%', category: 'Saludable',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
      address: 'Barrio Lastarria', phone: '+56911110011',
      products: [
        { name: 'Hamburguesa de Lentejas', description: 'Vegan burger con papas', price: 7500, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&q=80' },
        { name: 'Falafel Bowl', description: 'Hummus y vegetales frescos', price: 6900, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
        { name: 'Jugo Prensado Pera', description: 'Bebida 350cc', price: 3500, image: 'https://images.unsplash.com/photo-1622597467836-f382441c09eb?w=400&q=80' }
      ]
    },
    {
      email: 'salads@test.com', name: 'Solo Ensaladas', category: 'Saludable',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
      address: 'Avenida Vitacura', phone: '+56911110012',
      products: [
        { name: 'Ensalada Griega', description: 'Queso feta, aceitunas y tomate', price: 6900, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&q=80' },
        { name: 'Galletas de Avena', description: 'Hechas en casa sin azúcar', price: 2900, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80' },
        { name: 'Agua Gasificada', description: 'Botella 500cc', price: 1500, image: 'https://images.unsplash.com/photo-1559839914-17aae19cb840?w=400&q=80' }
      ]
    },

    // Postres (2)
    {
      email: 'helado@test.com', name: 'Heladería Emporio', category: 'Postres',
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
      address: 'Isidora Goyenechea', phone: '+56911110013',
      products: [
        { name: 'Helado 1 Litro', description: 'Sabor Chocolate y Vainilla', price: 9900, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80' },
        { name: 'Copa de Helado', description: 'Con Frutas frescas y crema', price: 4900, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80' },
        { name: 'Milkshake Frutilla', description: 'Malteada 500cc', price: 3900, image: 'https://images.unsplash.com/photo-1622597467836-f382441c09eb?w=400&q=80' }
      ]
    },
    {
      email: 'crepes@test.com', name: 'Crepes & Waffles', category: 'Postres',
      image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80',
      address: 'Parque Arauco', phone: '+56911110014',
      products: [
        { name: 'Crepe Nutella', description: 'Nutella y Plátano', price: 5900, image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80' },
        { name: 'Waffle Berries', description: 'Con Helado de vainilla', price: 6500, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80' },
        { name: 'Cappuccino', description: 'Caliente', price: 2800, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' }
      ]
    }
  ];

  for (const rData of restaurantsData) {
    // Revisar si existe el restaurante o crearlo
    let owner = await prisma.user.findFirst({ where: { email: rData.email } });
    if (!owner) {
      owner = await prisma.user.create({
        data: {
          email: rData.email,
          name: "Dueño de " + rData.name,
          role: 'RESTAURANT'
        }
      });
    }

    const exists = await prisma.restaurant.findFirst({ where: { ownerId: owner.id }});
    if (!exists) {
      await prisma.restaurant.create({
        data: {
          name: rData.name,
          image: rData.image,
          category: rData.category,
          address: rData.address,
          phone: rData.phone,
          ownerId: owner.id,
          products: {
            create: rData.products
          }
        }
      });
    }
  }

  console.log("¡Se han añadido " + restaurantsData.length + " restaurantes adicionales!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
