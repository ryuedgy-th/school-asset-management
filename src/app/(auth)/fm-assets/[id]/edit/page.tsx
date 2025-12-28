import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import EditFMAssetClient from './EditFMAssetClient';

export default async function EditFMAssetPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: {
            userRole: true,
            userDepartment: true,
        },
    });

    if (!user || !hasModuleAccess(user, 'fm_assets')) {
        redirect('/');
    }

    const resolvedParams = await params;
    const assetId = parseInt(resolvedParams.id);

    if (isNaN(assetId)) {
        notFound();
    }

    // Fetch FM asset
    const fmAssetRaw = await prisma.fMAsset.findUnique({
        where: { id: assetId },
        include: {
            category: true,
        },
    });

    if (!fmAssetRaw) {
        notFound();
    }

    // Convert Decimal to number and parse JSON
    const fmAsset = {
        ...fmAssetRaw,
        purchaseCost: fmAssetRaw.purchaseCost ? Number(fmAssetRaw.purchaseCost) : null,
        currentValue: fmAssetRaw.currentValue ? Number(fmAssetRaw.currentValue) : null,
        specifications: fmAssetRaw.specifications
            ? JSON.parse(fmAssetRaw.specifications as string)
            : null,
        images: fmAssetRaw.images ? JSON.parse(fmAssetRaw.images as string) : [],
    };

    // Fetch categories for dropdown
    const categories = await prisma.fMAssetCategory.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <EditFMAssetClient fmAsset={fmAsset} categories={categories} user={user} />
    );
}
