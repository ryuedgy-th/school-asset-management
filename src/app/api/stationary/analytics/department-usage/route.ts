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

        // Get all departments with their requisitions
        const departments = await prisma.department.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                code: true,
            },
        });

        const departmentStats = await Promise.all(
            departments.map(async (dept) => {
                const requisitions = await prisma.stationaryRequisition.findMany({
                    where: {
                        departmentId: dept.id,
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
                                estimatedUnitCost: true,
                            },
                        },
                    },
                });

                let totalCost = 0;
                let totalQuantity = 0;

                requisitions.forEach(req => {
                    req.items.forEach(item => {
                        totalQuantity += item.quantityRequested;
                        const cost = item.estimatedUnitCost ? Number(item.estimatedUnitCost) : 0;
                        totalCost += cost * item.quantityRequested;
                    });
                });

                return {
                    department: dept.name,
                    departmentCode: dept.code,
                    requisitionCount: requisitions.length,
                    totalQuantity,
                    totalCost: Math.round(totalCost * 100) / 100,
                };
            })
        );

        // Sort by total cost descending
        const sortedStats = departmentStats.sort((a, b) => b.totalCost - a.totalCost);

        return NextResponse.json({
            departments: sortedStats,
            totalDepartments: departments.length,
        });
    } catch (error) {
        console.error('Error fetching department usage analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch department usage analytics' },
            { status: 500 }
        );
    }
}
