'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function createFMCategory(data: { name: string; description: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await prisma.fMAssetCategory.create({
        data: {
            name: data.name,
            description: data.description || null,
        },
    });

    revalidatePath('/fm-assets/categories');
    return { success: true };
}

export async function updateFMCategory(id: number, data: { name: string; description: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await prisma.fMAssetCategory.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description || null,
        },
    });

    revalidatePath('/fm-assets/categories');
    return { success: true };
}

export async function deleteFMCategory(id: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Check if category is in use
    const assetsCount = await prisma.fMAsset.count({
        where: { categoryId: id },
    });

    if (assetsCount > 0) {
        throw new Error(`Cannot delete category. ${assetsCount} FM assets are using this category.`);
    }

    await prisma.fMAssetCategory.delete({
        where: { id },
    });

    revalidatePath('/fm-assets/categories');
    return { success: true };
}
