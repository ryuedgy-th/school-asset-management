import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import StationaryStockClient from './StationaryStockClient';

export default async function StationaryStockPage() {
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

    // Fetch stock with relations
    const stockRaw = await prisma.stationaryStock.findMany({
        include: {
            item: {
                include: {
                    category: true,
                },
            },
            location: true,
        },
        orderBy: [
            { locationId: 'asc' },
            { itemId: 'asc' },
        ],
    });

    // Convert Decimal to number for client component
    const stock = stockRaw.map(s => ({
        ...s,
        unitCost: s.unitCost ? Number(s.unitCost) : null,
        totalValue: s.totalValue ? Number(s.totalValue) : null,
        item: {
            ...s.item,
            unitCost: s.item.unitCost ? Number(s.item.unitCost) : null,
        },
    }));

    // Fetch items for stock adjustment
    const items = await prisma.stationaryItem.findMany({
        where: { isActive: true },
        select: {
            id: true,
            itemCode: true,
            name: true,
            uom: true,
        },
        orderBy: { name: 'asc' },
    });

    // Fetch locations
    const locations = await prisma.stationaryLocation.findMany({
        where: { isActive: true },
        select: {
            id: true,
            code: true,
            name: true,
            type: true,
        },
        orderBy: { code: 'asc' },
    });

    return (
        <StationaryStockClient
            stock={stock}
            items={items}
            locations={locations}
            user={user}
        />
    );
}
