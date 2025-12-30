import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { unlink } from 'fs/promises';
import { join } from 'path';

// DELETE /api/fm-assets/[assetCode]/upload/[filename] - Delete uploaded file
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ assetCode: string; filename: string }> }
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
        const { assetCode, filename } = params;

        // Verify FM asset exists
        const asset = await prisma.fMAsset.findUnique({
            where: { assetCode },
        });

        if (!asset) {
            return NextResponse.json(
                { error: 'FM asset not found' },
                { status: 404 }
            );
        }

        // Remove from database
        const currentImages = asset.images ? JSON.parse(asset.images as string) : [];
        const filePathToRemove = `/fm-assets/${asset.id}/${filename}`;
        const updatedImages = currentImages.filter((img: string) => img !== filePathToRemove);

        await prisma.fMAsset.update({
            where: { assetCode },
            data: {
                images: JSON.stringify(updatedImages),
            },
        });

        // Delete file from disk
        try {
            const filepath = join(process.cwd(), 'public', 'fm-assets', asset.id.toString(), filename);
            await unlink(filepath);
        } catch (error) {
            console.error('Error deleting file from disk:', error);
            // Continue even if file deletion fails
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'FMAsset',
                entityId: asset.id.toString(),
                details: JSON.stringify({
                    action: 'delete_file',
                    filename,
                }),
                userId: user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
