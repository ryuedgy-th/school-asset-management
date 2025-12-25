import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { saveFile } from '@/lib/upload';

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = Number((await context.params).id);
        const formData = await req.formData();

        // Extract keys to build update object
        const updateData: any = {};

        // Handle Image
        const imageFile = formData.get('image') as File | null;
        if (imageFile && imageFile.size > 0) {
            const imagePath = await saveFile(imageFile, 'assets');
            if (imagePath) updateData.image = imagePath;
        }

        // Handle other fields - explicitly check for presence to allow partial updates
        const fields = ['name', 'category', 'serialNumber', 'totalStock', 'currentStock', 'status', 'assetCode', 'brand', 'model', 'location', 'vendor'];
        for (const field of fields) {
            if (formData.has(field)) {
                let value = formData.get(field);
                if (field === 'totalStock' || field === 'currentStock') {
                    updateData[field] = Number(value);
                } else if (field === 'serialNumber') {
                    updateData[field] = (value as string)?.trim() || null;
                } else {
                    updateData[field] = value;
                }
            }
        }

        if (formData.has('purchaseDate')) {
            const val = formData.get('purchaseDate') as string;
            updateData.purchaseDate = val ? new Date(val) : null;
        }
        if (formData.has('warrantyExp')) {
            const val = formData.get('warrantyExp') as string;
            updateData.warrantyExp = val ? new Date(val) : null;
        }

        const asset = await prisma.asset.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(asset);
    } catch (error) {
        console.error('Error updating asset:', error);
        return NextResponse.json(
            { error: 'Failed to update asset' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = Number((await context.params).id);

        // Optional: Check if asset has active borrows or history and prevent delete?
        // For now, we will allow delete but maybe wrap in transaction or check first.

        // Simple delete for now
        await prisma.asset.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting asset:', error);
        return NextResponse.json(
            { error: 'Failed to delete asset' },
            { status: 500 }
        );
    }
}
