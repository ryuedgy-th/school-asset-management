import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { fileUploadSchema } from '@/lib/validation';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

export async function saveFile(file: File | string, folder: string = 'uploads'): Promise<string | null> {
    if (!file) return null;

    try {
        let buffer: Buffer;
        let filename: string;
        let mimeType: string;

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', folder);
        await mkdir(uploadDir, { recursive: true });

        if (typeof file === 'string') {
            // Handle Base64 Data URI
            // Format: data:image/png;base64,iVBORw0KGgo...
            const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

            if (matches && matches.length === 3) {
                const type = matches[1];
                const data = matches[2];

                // Validate MIME type
                if (!ALLOWED_MIME_TYPES.includes(type)) {
                    throw new Error(`Invalid file type: ${type}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
                }

                buffer = Buffer.from(data, 'base64');
                mimeType = type;
                const ext = '.' + type.split('/')[1];
                filename = `${randomUUID()}${ext}`;
            } else {
                // Fallback or raw base64
                buffer = Buffer.from(file, 'base64');
                mimeType = 'image/png'; // Default for signatures
                filename = `${randomUUID()}.png`;
            }

        } else {
            // Handle File Object
            if (file.size === 0) return null;

            // Validate file using Zod schema
            const validation = fileUploadSchema.safeParse({
                filename: file.name,
                mimetype: file.type,
                size: file.size
            });

            if (!validation.success) {
                const errors = validation.error.issues.map((e) => e.message).join(', ');
                throw new Error(`File validation failed: ${errors}`);
            }

            const bytes = await file.arrayBuffer();
            buffer = Buffer.from(bytes);
            mimeType = file.type;
            const ext = extname(file.name) || '.jpg';
            filename = `${randomUUID()}${ext}`;
        }

        // Additional size check
        if (buffer.length > MAX_FILE_SIZE) {
            throw new Error(`File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        return `/${folder}/${filename}`;
    } catch (error) {
        console.error('Error saving file:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to save file');
    }
}
