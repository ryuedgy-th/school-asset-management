import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch stock levels
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRole: true, userDepartment: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check view permission
        const canView = await hasPermission(user, 'stationary', 'view');
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('itemId');
        const locationId = searchParams.get('locationId');
        const lowStock = searchParams.get('lowStock');
        const expiringSoon = searchParams.get('expiringSoon');

        const where: any = {};

        if (itemId) where.itemId = parseInt(itemId);
        if (locationId) where.locationId = parseInt(locationId);

        const stock = await prisma.stationaryStock.findMany({
            where,
            include: {
                item: {
                    select: {
                        id: true,
                        itemCode: true,
                        name: true,
                        uom: true,
                        minStockLevel: true,
                        unitCost: true,
                    },
                },
                location: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: [
                { item: { itemCode: 'asc' } },
                { location: { code: 'asc' } },
            ],
        });

        // Apply filters
        let filteredStock = stock;

        // Low stock filter - check if total stock across all locations is below min
        if (lowStock === 'true') {
            const itemStockMap = new Map<number, number>();
            stock.forEach(s => {
                const current = itemStockMap.get(s.itemId) || 0;
                itemStockMap.set(s.itemId, current + s.quantity);
            });

            filteredStock = stock.filter(s => {
                const totalStock = itemStockMap.get(s.itemId) || 0;
                return totalStock < s.item.minStockLevel;
            });
        }

        // Expiring soon filter (within 30 days)
        if (expiringSoon === 'true') {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            filteredStock = filteredStock.filter(s => {
                return s.expiryDate && s.expiryDate <= thirtyDaysFromNow;
            });
        }

        // Add calculated fields
        const enrichedStock = filteredStock.map(s => ({
            ...s,
            isLowStock: s.quantity < s.item.minStockLevel,
            isExpiringSoon: s.expiryDate && s.expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isExpired: s.expiryDate && s.expiryDate < new Date(),
        }));

        return NextResponse.json(enrichedStock);
    } catch (error) {
        console.error('Error fetching stock:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
