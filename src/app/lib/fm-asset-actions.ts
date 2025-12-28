'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createFMAsset(data: {
    assetCode: string;
    name: string;
    description?: string;
    categoryId: number;
    type?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
    building?: string;
    floor?: string;
    room?: string;
    purchaseDate?: Date | string;
    installDate?: Date | string;
    warrantyExpiry?: Date | string;
    specifications?: string | Record<string, any>;
    condition?: string;
    status?: string;
    requiresMaintenance?: boolean;
    parentAssetId?: number;
    purchaseCost?: number;
    currentValue?: number;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    // Check if asset code already exists
    const existing = await prisma.fMAsset.findUnique({
        where: { assetCode: data.assetCode },
    });

    if (existing) {
        throw new Error('Asset code already exists');
    }

    // Generate QR code value
    const qrCode = `FM-${data.assetCode}`;

    const asset = await prisma.fMAsset.create({
        data: {
            assetCode: data.assetCode,
            name: data.name,
            ...(data.description && { description: data.description }),
            categoryId: data.categoryId,
            ...(data.type && { type: data.type }),
            ...(data.brand && { brand: data.brand }),
            ...(data.model && { model: data.model }),
            ...(data.serialNumber && { serialNumber: data.serialNumber }),
            ...(data.location && { location: data.location }),
            ...(data.building && { building: data.building }),
            ...(data.floor && { floor: data.floor }),
            ...(data.room && { room: data.room }),
            ...(data.purchaseDate && { purchaseDate: new Date(data.purchaseDate) }),
            ...(data.installDate && { installDate: new Date(data.installDate) }),
            ...(data.warrantyExpiry && { warrantyExpiry: new Date(data.warrantyExpiry) }),
            ...(data.specifications && { specifications: JSON.stringify(data.specifications) }),
            condition: (data.condition as any) || 'good',
            status: (data.status as any) || 'active',
            requiresMaintenance: data.requiresMaintenance ?? true,
            ...(data.parentAssetId && { parentAssetId: data.parentAssetId }),
            ...(data.purchaseCost && { purchaseCost: data.purchaseCost }),
            ...(data.currentValue && { currentValue: data.currentValue }),
            qrCode,
            createdById: userId,
        },
        include: {
            category: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entity: 'FMAsset',
            entityId: asset.id.toString(),
            details: JSON.stringify({ assetCode: data.assetCode, name: data.name }),
            userId,
        },
    });

    revalidatePath('/fm-assets');
    return asset;
}

export async function updateFMAsset(id: number, data: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    // Check if asset code is being changed and if it conflicts
    if (data.assetCode) {
        const existing = await prisma.fMAsset.findFirst({
            where: {
                assetCode: data.assetCode,
                id: { not: id },
            },
        });

        if (existing) {
            throw new Error('Asset code already exists');
        }
    }

    const asset = await prisma.fMAsset.update({
        where: { id },
        data: {
            ...(data.assetCode && { assetCode: data.assetCode }),
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.categoryId && { categoryId: data.categoryId }),
            ...(data.type && { type: data.type }),
            ...(data.brand !== undefined && { brand: data.brand }),
            ...(data.model !== undefined && { model: data.model }),
            ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
            ...(data.location && { location: data.location }),
            ...(data.building !== undefined && { building: data.building }),
            ...(data.floor !== undefined && { floor: data.floor }),
            ...(data.room !== undefined && { room: data.room }),
            ...(data.purchaseDate && { purchaseDate: new Date(data.purchaseDate) }),
            ...(data.installDate && { installDate: new Date(data.installDate) }),
            ...(data.warrantyExpiry && { warrantyExpiry: new Date(data.warrantyExpiry) }),
            ...(data.specifications && { specifications: JSON.stringify(data.specifications) }),
            ...(data.condition && { condition: data.condition }),
            ...(data.status && { status: data.status }),
            ...(data.requiresMaintenance !== undefined && { requiresMaintenance: data.requiresMaintenance }),
            ...(data.parentAssetId !== undefined && { parentAssetId: data.parentAssetId }),
            ...(data.purchaseCost !== undefined && { purchaseCost: data.purchaseCost }),
            ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
        },
        include: {
            category: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'UPDATE',
            entity: 'FMAsset',
            entityId: id.toString(),
            details: JSON.stringify({ assetCode: asset.assetCode }),
            userId,
        },
    });

    revalidatePath('/fm-assets');
    revalidatePath(`/fm-assets/${id}`);
    return asset;
}

export async function deleteFMAsset(id: number, soft: boolean = true) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    // Check if asset has child assets
    const childCount = await prisma.fMAsset.count({
        where: { parentAssetId: id },
    });

    if (childCount > 0) {
        throw new Error('Cannot delete asset with child assets');
    }

    if (soft) {
        // Soft delete - set status to retired
        await prisma.fMAsset.update({
            where: { id },
            data: { status: 'retired' },
        });

        await prisma.auditLog.create({
            data: {
                action: 'SOFT_DELETE',
                entity: 'FMAsset',
                entityId: id.toString(),
                details: JSON.stringify({ soft: true }),
                userId,
            },
        });
    } else {
        // Hard delete
        await prisma.fMAsset.delete({
            where: { id },
        });

        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'FMAsset',
                entityId: id.toString(),
                details: JSON.stringify({ soft: false }),
                userId,
            },
        });
    }

    revalidatePath('/fm-assets');
    return { success: true };
}

export async function cloneFMAsset(id: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    // Get original asset
    const original = await prisma.fMAsset.findUnique({
        where: { id },
    });

    if (!original) {
        throw new Error('Asset not found');
    }

    // Generate new asset code
    const timestamp = Date.now().toString().slice(-6);
    const newAssetCode = `${original.assetCode}-COPY-${timestamp}`;

    const cloned = await prisma.fMAsset.create({
        data: {
            assetCode: newAssetCode,
            name: `${original.name} (Copy)`,
            description: original.description,
            categoryId: original.categoryId,
            type: original.type,
            brand: original.brand,
            model: original.model,
            serialNumber: null, // Don't copy serial number
            location: original.location,
            building: original.building,
            floor: original.floor,
            room: original.room,
            purchaseDate: original.purchaseDate,
            installDate: null,
            warrantyExpiry: null,
            specifications: original.specifications,
            condition: 'good',
            status: 'inactive',
            requiresMaintenance: original.requiresMaintenance,
            parentAssetId: original.parentAssetId,
            purchaseCost: original.purchaseCost,
            currentValue: null,
            qrCode: `FM-${newAssetCode}`,
            createdById: userId,
        },
        include: {
            category: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entity: 'FMAsset',
            entityId: cloned.id.toString(),
            details: JSON.stringify({
                action: 'clone',
                originalId: id,
                assetCode: newAssetCode,
            }),
            userId,
        },
    });

    revalidatePath('/fm-assets');
    return cloned;
}

export async function generateAssetQR(assetCode: string) {
    return `FM-${assetCode}`;
}
