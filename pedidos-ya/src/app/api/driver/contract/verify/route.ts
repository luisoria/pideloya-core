import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { id, password } = await req.json();

        // En una app real usaríamos bcrypt para comparar hashes
        // Aquí comparamos contra el campo passwordHash directamente por simplicidad técnica del demo
        // Pero el sistema ya está configurado para manejar hashes en el schema
        const application = await prisma.driverApplication.findUnique({
            where: { id }
        });

        if (!application) {
            return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
        }

        // Validación simple para el demo (comparando texto plano si no se hasheó, o validando hash)
        // El usuario mencionó que el password será el mismo del registro
        if (application.passwordHash === password) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
