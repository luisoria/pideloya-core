/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Verificando Tabla DriverApplication ---');
        // Usar queryRaw para ver la estructura real en SQLite
        const tableInfo = await prisma.$queryRawUnsafe(`PRAGMA table_info(DriverApplication)`);
        console.log('Estructura detectada:');
        console.table(tableInfo);

        const hasEmailCode = tableInfo.some(col => col.name === 'emailCode');
        console.log('¿Tiene campo emailCode?:', hasEmailCode);
    } catch (e) {
        console.error('Error al verificar:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
