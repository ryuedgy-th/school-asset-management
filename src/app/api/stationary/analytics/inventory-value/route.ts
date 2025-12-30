import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user || !hasModuleAccess(user, 'stationary')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all items with stock
        const items = await prisma.stationaryItem.findMany({
            where: { isActive: true },
            select: {
                id: true,
                itemCode: true,
                name: true,
                unitCost: true,
                category: {
                    select: {
                        name: true,
                    },
                },
                stock: {
                    select: {
                        quantity: true,
                        location: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        // Calculate totals
        let totalValue = 0;
        const byLocation: Record<string, { quantity: number; value: number }> = {};
        const byCategory: Record<string, { quantity: number; value: number }> = {};

        items.forEach(item => {
            const unitCost = item.unitCost ? Number(item.unitCost) : 0;
            const categoryName = item.category?.name || 'Uncategorized';

            item.stock.forEach(stock => {
                const locationName = stock.location.name;
                const value = stock.quantity * unitCost;

                totalValue += value;

                // By location
                if (!byLocation[locationName]) {
                    byLocation[locationName] = { quantity: 0, value: 0 };
                }
                byLocation[locationName].quantity += stock.quantity;
                byLocation[locationName].value += value;

                // By category
                if (!byCategory[categoryName]) {
                    byCategory[categoryName] = { quantity: 0, value: 0 };
                }
                byCategory[categoryName].quantity += stock.quantity;
                byCategory[categoryName].value += value;
            });
        });

        // Convert to arrays
        const locationBreakdown = Object.entries(byLocation).map(([location, data]) => ({
            location,
            quantity: data.quantity,
            value: Math.round(data.value * 100) / 100,
        }));

        const categoryBreakdown = Object.entries(byCategory).map(([category, data]) => ({
            category,
            quantity: data.quantity,
            value: Math.round(data.value * 100) / 100,
        }));

        return NextResponse.json({
            totalValue: Math.round(totalValue * 100) / 100,
            totalItems: items.length,
            byLocation: locationBreakdown.sort((a, b) => b.value - a.value),
            byCategory: categoryBreakdown.sort((a, b) => b.value - a.value),
        });
    } catch (error) {
        console.error('Error fetching inventory value:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory value' },
            { status: 500 }
        );
    }
}
