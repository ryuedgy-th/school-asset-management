import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import SparePartsClient from './SparePartsClient';

export default async function SparePartsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { userRole: true, userDepartment: true },
    });

    if (!user || !hasModuleAccess(user, 'spare_parts')) redirect('/');

    const sparePartsRaw = await prisma.sparePart.findMany({
        orderBy: { name: 'asc' },
    });

    // Convert Decimal to number for client component
    const spareParts = sparePartsRaw.map((part) => ({
        ...part,
        unitCost: part.unitCost ? Number(part.unitCost) : null,
    }));

    // Calculate stats
    const totalParts = spareParts.length;
    const lowStockParts = spareParts.filter(
        (part) => part.currentStock <= part.reorderPoint
    ).length;
    const totalValue = spareParts.reduce((sum, part) => {
        const cost = part.unitCost || 0;
        return sum + part.currentStock * cost;
    }, 0);

    const stats = {
        totalParts,
        lowStockParts,
        totalValue,
        totalItems: spareParts.reduce((sum, part) => sum + part.currentStock, 0),
    };

    return <SparePartsClient spareParts={spareParts} user={user} stats={stats} />;
}
