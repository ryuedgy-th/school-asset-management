import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import FMAssetFormClient from './FMAssetFormClient';

export default async function NewFMAssetPage() {
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

    // Fetch categories for dropdown
    const categories = await prisma.fMAssetCategory.findMany({
        orderBy: { name: 'asc' },
    });

    // Get next available asset code
    const lastAsset = await prisma.fMAsset.findFirst({
        orderBy: { assetCode: 'desc' },
        select: { assetCode: true },
    });

    // Generate suggested asset code
    let suggestedCode = 'FM-0001';
    if (lastAsset?.assetCode) {
        const match = lastAsset.assetCode.match(/FM-(\d+)/);
        if (match) {
            const nextNum = parseInt(match[1]) + 1;
            suggestedCode = `FM-${nextNum.toString().padStart(4, '0')}`;
        }
    }

    return (
        <FMAssetFormClient
            categories={categories}
            suggestedCode={suggestedCode}
            user={user}
        />
    );
}
