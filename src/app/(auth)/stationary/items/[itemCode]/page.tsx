import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import StationaryItemDetailClient from './StationaryItemDetailClient';

export default async function StationaryItemDetailPage({
    params,
}: {
    params: Promise<{ itemCode: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const userId = parseInt(session.user.id);
    const canView = await hasPermission({ id: userId }, 'stationary', 'view');
    if (!canView) {
        redirect('/');
    }

    const { itemCode } = await params;

    // Fetch item with all related data
    const item = await prisma.stationaryItem.findUnique({
        where: { itemCode },
        include: {
            category: true,
            defaultVendor: true,
            createdBy: {
                select: { id: true, name: true, email: true },
            },
            stock: {
                include: {
                    location: true,
                },
                orderBy: {
                    quantity: 'desc',
                },
            },
        },
    });

    if (!item) {
        notFound();
    }

    // Convert Decimal to number for Client Component
    const itemData = {
        ...item,
        unitCost: item.unitCost ? Number(item.unitCost) : null,
        stock: item.stock.map(s => ({
            ...s,
            unitCost: s.unitCost ? Number(s.unitCost) : null,
            totalValue: s.totalValue ? Number(s.totalValue) : null,
        })),
    };

    // Get total stock quantity across all locations
    const totalStock = item.stock.reduce((sum, s) => sum + s.quantity, 0);

    // Check permissions for actions
    const canEdit = await hasPermission({ id: userId }, 'stationary', 'edit');
    const canDelete = await hasPermission({ id: userId }, 'stationary', 'delete');

    return (
        <StationaryItemDetailClient
            item={itemData}
            totalStock={totalStock}
            canEdit={canEdit}
            canDelete={canDelete}
        />
    );
}
