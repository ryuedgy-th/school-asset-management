import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

export async function saveFile(file: File | string, folder: string = 'uploads'): Promise<string | null> {
    if (!file) return null;

    try {
        let buffer: Buffer;
        let filename: string;

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
                buffer = Buffer.from(data, 'base64');
                const ext = '.' + type.split('/')[1];
                filename = `${randomUUID()}${ext}`;
            } else {
                // Fallback or raw base64
                buffer = Buffer.from(file, 'base64');
                filename = `${randomUUID()}.png`; // Default match for signatures
            }

        } else {
            // Handle File Object
            if (file.size === 0) return null;
            const bytes = await file.arrayBuffer();
            buffer = Buffer.from(bytes);
            const ext = extname(file.name) || '.jpg';
            filename = `${randomUUID()}${ext}`;
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        return `/${folder}/${filename}`;
    } catch (error) {
        console.error('Error saving file:', error);
        throw new Error('Failed to save file');
    }
}
