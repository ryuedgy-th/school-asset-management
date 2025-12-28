import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// POST /api/fm-assets/[id]/upload - Upload images/documents for FM asset
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { userRole: true, userDepartment: true },
        });

        if (!user || !hasPermission(user, 'fm_assets', 'edit')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const assetId = parseInt(params.id);

        // Verify FM asset exists
        const asset = await prisma.fMAsset.findUnique({
            where: { id: assetId },
        });

        if (!asset) {
            return NextResponse.json(
                { error: 'FM asset not found' },
                { status: 404 }
            );
        }

        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        // Limit to 10 files
        if (files.length > 10) {
            return NextResponse.json(
                { error: 'Maximum 10 files allowed per upload' },
                { status: 400 }
            );
        }

        const uploadDir = join(process.cwd(), 'public', 'fm-assets', assetId.toString());
        await mkdir(uploadDir, { recursive: true });

        const uploadedFiles: string[] = [];
        const failed: Array<{ filename: string; error: string }> = [];

        for (const file of files) {
            try {
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    failed.push({
                        filename: file.name,
                        error: 'File size exceeds 5MB limit',
                    });
                    continue;
                }

                // Validate file type
                const allowedTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/webp',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ];

                if (!allowedTypes.includes(file.type)) {
                    failed.push({
                        filename: file.name,
                        error: 'File type not allowed',
                    });
                    continue;
                }

                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Generate unique filename
                const ext = file.name.split('.').pop();
                const filename = `${randomUUID()}.${ext}`;
                const filepath = join(uploadDir, filename);

                await writeFile(filepath, buffer);

                // Store relative path
                const relativePath = `/fm-assets/${assetId}/${filename}`;
                uploadedFiles.push(relativePath);
            } catch (error) {
                console.error(`Error uploading file ${file.name}:`, error);
                failed.push({
                    filename: file.name,
                    error: 'Upload failed',
                });
            }
        }

        // Update FM asset images array
        if (uploadedFiles.length > 0) {
            const currentImages = asset.images ? JSON.parse(asset.images as string) : [];
            const updatedImages = [...currentImages, ...uploadedFiles];

            await prisma.fMAsset.update({
                where: { id: assetId },
                data: {
                    images: JSON.stringify(updatedImages),
                },
            });

            // Audit log
            await prisma.auditLog.create({
                data: {
                    action: 'UPDATE',
                    entity: 'FMAsset',
                    entityId: assetId.toString(),
                    details: JSON.stringify({
                        action: 'upload_files',
                        filesCount: uploadedFiles.length,
                    }),
                    userId: user.id,
                },
            });
        }

        return NextResponse.json({
            success: true,
            uploaded: uploadedFiles,
            failed,
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
