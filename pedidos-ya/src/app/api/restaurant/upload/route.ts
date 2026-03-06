import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const appId = formData.get('appId') as string
        const type = formData.get('type') as string // 'driver' or 'restaurant'

        if (!file || !appId) {
            return NextResponse.json({ error: 'Missing file or ID' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Path: public/uploads/[type]/[appId]/[filename]
        const relativeDir = `/uploads/${type || 'misc'}/${appId}`
        const uploadDir = join(process.cwd(), 'public', relativeDir)

        await mkdir(uploadDir, { recursive: true })

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
        const filePath = join(uploadDir, fileName)

        await writeFile(filePath, buffer)

        const url = `${relativeDir}/${fileName}`
        return NextResponse.json({ url })

    } catch (e: any) {
        console.error('[UPLOAD ERROR]', e)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
