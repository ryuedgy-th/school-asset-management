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
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Filter by department if not admin
        const isAdmin = user.userRole?.name === 'Admin' || user.userRole?.scope === 'global';
        const departmentFilter = isAdmin || !user.departmentId ? {} : { departmentId: user.departmentId };

        // Get categories with their items
        const categories = await prisma.stationaryCategory.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                code: true,
            },
        });

        const categoryStats = await Promise.all(
            categories.map(async (category) => {
                // Get items in this category
                const items = await prisma.stationaryItem.findMany({
                    where: {
                        categoryId: category.id,
                        isActive: true,
                    },
                    select: {
                        id: true,
                    },
                });

                const itemIds = items.map(i => i.id);

                // Get requisition items for these items
                const requisitionItems = await prisma.stationaryRequisitionItem.findMany({
                    where: {
                        itemId: {
                            in: itemIds,
                        },
                        requisition: {
                            ...departmentFilter,
                            createdAt: {
                                gte: startDate,
                            },
                            status: {
                                in: ['approved', 'issued', 'completed'],
                            },
                        },
                    },
                    select: {
                        quantityRequested: true,
                        estimatedUnitCost: true,
                    },
                });

                let totalCost = 0;
                let totalQuantity = 0;

                requisitionItems.forEach(item => {
                    totalQuantity += item.quantityRequested;
                    const cost = item.estimatedUnitCost ? Number(item.estimatedUnitCost) : 0;
                    totalCost += cost * item.quantityRequested;
                });

                return {
                    category: category.name,
                    categoryCode: category.code,
                    totalQuantity,
                    totalCost: Math.round(totalCost * 100) / 100,
                    itemCount: items.length,
                };
            })
        );

        // Filter out categories with no usage and sort by cost
        const sortedStats = categoryStats
            .filter(s => s.totalCost > 0 || s.totalQuantity > 0)
            .sort((a, b) => b.totalCost - a.totalCost);

        const totalCost = sortedStats.reduce((sum, s) => sum + s.totalCost, 0);

        return NextResponse.json({
            categories: sortedStats,
            totalCategories: sortedStats.length,
            totalCost: Math.round(totalCost * 100) / 100,
        });
    } catch (error) {
        console.error('Error fetching cost analysis:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cost analysis' },
            { status: 500 }
        );
    }
}
