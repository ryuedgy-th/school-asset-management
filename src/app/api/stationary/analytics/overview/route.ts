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

        // Get date range from query params (default: current month)
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate')
            ? new Date(searchParams.get('startDate')!)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = searchParams.get('endDate')
            ? new Date(searchParams.get('endDate')!)
            : new Date();

        // Filter by department if user is not admin
        const isAdmin = user.userRole?.name === 'Admin' || user.userRole?.scope === 'global';
        const departmentFilter = isAdmin || !user.departmentId ? {} : { departmentId: user.departmentId };

        // 1. Total Active Items
        const totalItems = await prisma.stationaryItem.count({
            where: { isActive: true },
        });

        // 2. Total Inventory Value
        const stockValue = await prisma.stationaryStock.aggregate({
            _sum: {
                quantity: true,
            },
        });

        const items = await prisma.stationaryItem.findMany({
            where: { isActive: true },
            select: {
                unitCost: true,
                stock: {
                    select: {
                        quantity: true,
                    },
                },
            },
        });

        let totalInventoryValue = 0;
        items.forEach(item => {
            const totalQty = item.stock.reduce((sum, s) => sum + s.quantity, 0);
            totalInventoryValue += totalQty * (item.unitCost ? Number(item.unitCost) : 0);
        });

        // 3. Pending Requisitions
        const pendingRequisitions = await prisma.stationaryRequisition.count({
            where: {
                ...departmentFilter,
                status: {
                    in: ['draft', 'pending'],
                },
            },
        });

        // 4. Low Stock Items (items where total stock <= minStockLevel)
        const allItems = await prisma.stationaryItem.findMany({
            where: { isActive: true },
            select: {
                id: true,
                minStockLevel: true,
                stock: {
                    select: {
                        quantity: true,
                    },
                },
            },
        });

        const lowStockItems = allItems.filter(item => {
            const totalStock = item.stock.reduce((sum, s) => sum + s.quantity, 0);
            return totalStock <= item.minStockLevel;
        }).length;

        // 5. This Month's Expenditure
        const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const requisitionsThisMonth = await prisma.stationaryRequisition.findMany({
            where: {
                ...departmentFilter,
                status: 'approved',
                createdAt: {
                    gte: thisMonthStart,
                },
            },
            include: {
                items: {
                    select: {
                        estimatedUnitCost: true,
                        quantityRequested: true,
                    },
                },
            },
        });

        let thisMonthExpenditure = 0;
        requisitionsThisMonth.forEach(req => {
            req.items.forEach(item => {
                const cost = item.estimatedUnitCost ? Number(item.estimatedUnitCost) : 0;
                thisMonthExpenditure += cost * item.quantityRequested;
            });
        });

        // 6. Budget Utilization (if department has budget)
        let budgetUtilization = null;
        if (user.departmentId) {
            const currentYear = new Date().getFullYear();
            const budget = await prisma.departmentBudget.findFirst({
                where: {
                    departmentId: user.departmentId,
                    fiscalYear: currentYear,
                    isActive: true,
                },
            });

            if (budget) {
                const allocated = Number(budget.allocatedAmount);
                const spent = Number(budget.spentAmount);
                budgetUtilization = allocated > 0 ? (spent / allocated) * 100 : 0;
            }
        }

        // 7. Requisition Trend (last 7 days)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const recentRequisitions = await prisma.stationaryRequisition.count({
            where: {
                ...departmentFilter,
                createdAt: {
                    gte: last7Days,
                },
            },
        });

        const previousWeekStart = new Date();
        previousWeekStart.setDate(previousWeekStart.getDate() - 14);
        const previousWeekEnd = new Date();
        previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

        const previousWeekRequisitions = await prisma.stationaryRequisition.count({
            where: {
                ...departmentFilter,
                createdAt: {
                    gte: previousWeekStart,
                    lt: previousWeekEnd,
                },
            },
        });

        const requisitionTrend = previousWeekRequisitions > 0
            ? ((recentRequisitions - previousWeekRequisitions) / previousWeekRequisitions) * 100
            : 0;

        return NextResponse.json({
            totalItems,
            totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
            pendingRequisitions,
            lowStockItems,
            thisMonthExpenditure: Math.round(thisMonthExpenditure * 100) / 100,
            budgetUtilization: budgetUtilization ? Math.round(budgetUtilization * 100) / 100 : null,
            recentRequisitions,
            requisitionTrend: Math.round(requisitionTrend * 100) / 100,
        });
    } catch (error) {
        console.error('Error fetching analytics overview:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics overview' },
            { status: 500 }
        );
    }
}
