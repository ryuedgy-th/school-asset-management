'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { logAudit } from '@/lib/logger';

export async function createCategory(formData: FormData) {
    const session = await auth();
    // if (!session?.user) throw new Error('Unauthorized'); // Add RBAC later

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name) {
        throw new Error('Name is required');
    }

    try {
        const category = await prisma.category.create({
            data: {
                name,
                description,
            },
        });

        await logAudit(session?.user?.id, 'CREATE_CATEGORY', 'Category', category.id.toString(), JSON.stringify({ name }));
        revalidatePath('/assets/categories');
        return { success: true, category };
    } catch (error) {
        console.error('Failed to create category:', error);
        return { success: false, error: 'Failed to create category' };
    }
}

export async function updateCategory(id: number, formData: FormData) {
    const session = await auth();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                description,
            },
        });

        await logAudit(session?.user?.id, 'UPDATE_CATEGORY', 'Category', category.id.toString(), JSON.stringify({ name }));
        revalidatePath('/assets/categories');
        return { success: true, category };
    } catch (error) {
        console.error('Failed to update category:', error);
        return { success: false, error: 'Failed to update category' };
    }
}

export async function deleteCategory(id: number) {
    const session = await auth();

    try {
        await prisma.category.delete({
            where: { id },
        });

        await logAudit(session?.user?.id, 'DELETE_CATEGORY', 'Category', id.toString(), null);
        revalidatePath('/assets/categories');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete category:', error);
        return { success: false, error: 'Failed to delete category' };
    }
}

export async function syncCategoriesFromAssets() {
    const session = await auth();
    try {
        // 1. Get distinct categories from Assets
        const distinctCategories = await prisma.asset.findMany({
            select: { category: true },
            distinct: ['category'],
        });

        const createdStats = {
            count: 0,
            names: [] as string[]
        };

        // 2. Upsert into Category model
        for (const item of distinctCategories) {
            if (!item.category) continue;

            const exists = await prisma.category.findUnique({
                where: { name: item.category }
            });

            if (!exists) {
                await prisma.category.create({
                    data: {
                        name: item.category,
                        description: 'Imported from existing assets'
                    }
                });
                createdStats.count++;
                createdStats.names.push(item.category);
            }
        }

        if (createdStats.count > 0) {
            await logAudit(
                session?.user?.id,
                'SYNC_CATEGORIES',
                'Category',
                'BATCH',
                JSON.stringify(createdStats)
            );
        }

        revalidatePath('/assets/categories');
        return { success: true, count: createdStats.count };
    } catch (error) {
        console.error('Sync failed:', error);
        return { success: false, error: 'Failed to sync categories' };
    }
}
