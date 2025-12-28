import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
];

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: images, PDF, Word, Excel, and text files' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const uniqueFilename = `${randomUUID()}.${fileExtension}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'tickets');
        const filePath = join(uploadDir, uniqueFilename);

        // Convert file to buffer and write
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Return file metadata
        const fileUrl = `/uploads/tickets/${uniqueFilename}`;

        return NextResponse.json({
            success: true,
            file: {
                filename: uniqueFilename,
                originalName: file.name,
                mimeType: file.type,
                size: file.size,
                url: fileUrl,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
