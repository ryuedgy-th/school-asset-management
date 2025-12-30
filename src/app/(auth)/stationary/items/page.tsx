import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import StationaryItemsClient from './StationaryItemsClient';

export default async function StationaryItemsPage() {
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

    if (!user || !hasModuleAccess(user, 'stationary')) {
        redirect('/');
    }

    // Fetch items with relations
    const itemsRaw = await prisma.stationaryItem.findMany({
        include: {
            category: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
            stock: {
                include: {
                    location: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    requisitionItems: true,
                    issueItems: true,
                    returnItems: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Convert Decimal to number for client component
    const items = itemsRaw.map(item => ({
        ...item,
        unitCost: item.unitCost ? Number(item.unitCost) : null,
        stock: item.stock.map(s => ({
            ...s,
            unitCost: s.unitCost ? Number(s.unitCost) : null,
            totalValue: s.totalValue ? Number(s.totalValue) : null,
        })),
    }));

    // Fetch categories for filters
    const categories = await prisma.stationaryCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });

    return (
        <StationaryItemsClient
            items={items}
            categories={categories}
            user={user}
        />
    );
}
