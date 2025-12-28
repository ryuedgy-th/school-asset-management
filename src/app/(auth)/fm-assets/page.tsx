import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import FMAssetsClient from './FMAssetsClient';

export default async function FMAssetsPage() {
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

    // Fetch FM assets with relations
    const fmAssetsRaw = await prisma.fMAsset.findMany({
        include: {
            category: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    components: true,
                    pmSchedules: true,
                    maintenanceLogs: true,
                    tickets: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Convert Decimal to number for client component
    const fmAssets = fmAssetsRaw.map(asset => ({
        ...asset,
        purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null,
        currentValue: asset.currentValue ? Number(asset.currentValue) : null,
    }));

    // Fetch categories for filters
    const categories = await prisma.fMAssetCategory.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <FMAssetsClient
            fmAssets={fmAssets}
            categories={categories}
            user={user}
        />
    );
}
