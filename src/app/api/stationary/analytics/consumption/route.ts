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

        // Get parameters
        const searchParams = request.nextUrl.searchParams;
        const period = searchParams.get('period') || '30'; // days
        const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Filter by department if not admin
        const isAdmin = user.userRole?.name === 'Admin' || user.userRole?.scope === 'global';
        const departmentFilter = isAdmin || !user.departmentId ? {} : { departmentId: user.departmentId };

        // Get requisitions in period
        const requisitions = await prisma.stationaryRequisition.findMany({
            where: {
                ...departmentFilter,
                createdAt: {
                    gte: startDate,
                },
                status: {
                    in: ['approved', 'issued', 'completed'],
                },
            },
            include: {
                items: {
                    select: {
                        quantityRequested: true,
                        item: {
                            select: {
                                name: true,
                                itemCode: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Group by date
        const consumptionByDate: Record<string, number> = {};
        const itemConsumption: Record<string, { name: string; code: string; quantity: number }> = {};

        requisitions.forEach(req => {
            const date = new Date(req.createdAt);
            let dateKey: string;

            if (groupBy === 'day') {
                dateKey = date.toISOString().split('T')[0];
            } else if (groupBy === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                dateKey = weekStart.toISOString().split('T')[0];
            } else {
                // month
                dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            req.items.forEach(item => {
                // Track by date
                consumptionByDate[dateKey] = (consumptionByDate[dateKey] || 0) + item.quantityRequested;

                // Track by item
                const itemKey = item.item.itemCode;
                if (!itemConsumption[itemKey]) {
                    itemConsumption[itemKey] = {
                        name: item.item.name,
                        code: item.item.itemCode,
                        quantity: 0,
                    };
                }
                itemConsumption[itemKey].quantity += item.quantityRequested;
            });
        });

        // Convert to arrays and sort
        const timeline = Object.entries(consumptionByDate)
            .map(([date, quantity]) => ({ date, quantity }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const topItems = Object.values(itemConsumption)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return NextResponse.json({
            timeline,
            topItems,
            totalQuantity: Object.values(consumptionByDate).reduce((sum, q) => sum + q, 0),
            totalRequisitions: requisitions.length,
        });
    } catch (error) {
        console.error('Error fetching consumption analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch consumption analytics' },
            { status: 500 }
        );
    }
}
