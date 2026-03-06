import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const appId = formData.get('appId') as string;
        const field = formData.get('field') as string;

        if (!file || !appId || !field) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Path: public/uploads/driver/[appId]/[filename]
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'drivers', appId);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) { }

        const ext = file.name.split('.').pop();
        const filename = `${field}_${randomUUID().substring(0, 8)}.${ext}`;
        const path = join(uploadDir, filename);

        await writeFile(path, buffer);

        const url = `/uploads/drivers/${appId}/${filename}`;

        return NextResponse.json({ url });
    } catch (error) {
        console.error('[UPLOAD ERROR]', error);
        return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
    }
}
