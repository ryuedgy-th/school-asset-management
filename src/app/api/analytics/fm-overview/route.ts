import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/analytics/fm-overview - Get FM dashboard analytics
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canView = await hasPermission(session.user as any, 'fm_assets', 'view');
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all FM assets
        const allAssets = await prisma.fMAsset.findMany({
            include: {
                category: true,
                components: true,
                pmSchedules: true,
                tickets: {
                    where: {
                        status: { not: 'closed' }
                    }
                }
            }
        });

        // Get maintenance logs
        const maintenanceLogs = await prisma.maintenanceLog.findMany({
            orderBy: { date: 'desc' },
            take: 10,
            include: {
                asset: {
                    select: {
                        id: true,
                        name: true,
                        assetCode: true
                    }
                }
            }
        });

        // Get PM schedules
        const pmSchedules = await prisma.pMSchedule.findMany({
            where: {
                isActive: true
            },
            include: {
                asset: {
                    select: {
                        id: true,
                        name: true,
                        assetCode: true
                    }
                }
            },
            orderBy: { nextDueDate: 'asc' }
        });

        // Get spare parts with low stock
        const allSpareParts = await prisma.sparePart.findMany();
        const lowStockParts = allSpareParts.filter(part =>
            part.currentStock <= part.reorderPoint
        ).slice(0, 10);

        // Calculate KPIs
        const totalAssets = allAssets.length;
        const activeAssets = allAssets.filter(a => a.status === 'active').length;
        const inMaintenance = allAssets.filter(a => a.status === 'maintenance').length;
        const retiredAssets = allAssets.filter(a => a.status === 'retired').length;

        // Count PM schedules
        const now = new Date();
        const overduePMs = pmSchedules.filter(pm =>
            pm.nextDueDate && new Date(pm.nextDueDate) < now
        ).length;
        const upcomingPMs = pmSchedules.filter(pm =>
            pm.nextDueDate &&
            new Date(pm.nextDueDate) > now &&
            new Date(pm.nextDueDate) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        ).length;

        // Asset by category
        const assetsByCategory = allAssets.reduce((acc: any, asset) => {
            const catName = asset.category.name;
            acc[catName] = (acc[catName] || 0) + 1;
            return acc;
        }, {});

        // Asset by condition
        const assetsByCondition = allAssets.reduce((acc: any, asset) => {
            acc[asset.condition] = (acc[asset.condition] || 0) + 1;
            return acc;
        }, {});

        // Asset by status
        const assetsByStatus = allAssets.reduce((acc: any, asset) => {
            acc[asset.status] = (acc[asset.status] || 0) + 1;
            return acc;
        }, {});

        // Calculate total cost
        const totalPurchaseCost = allAssets.reduce((sum, asset) =>
            sum + (Number(asset.purchaseCost) || 0), 0
        );
        const totalCurrentValue = allAssets.reduce((sum, asset) =>
            sum + (Number(asset.currentValue) || 0), 0
        );

        // Top 5 assets by cost
        const topAssetsByCost = allAssets
            .filter(a => a.purchaseCost)
            .sort((a, b) => Number(b.purchaseCost) - Number(a.purchaseCost))
            .slice(0, 5)
            .map(a => ({
                id: a.id,
                name: a.name,
                assetCode: a.assetCode,
                cost: Number(a.purchaseCost)
            }));

        // Recent maintenance (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentMaintenance = maintenanceLogs.filter(log =>
            new Date(log.date) >= thirtyDaysAgo
        );

        // Maintenance cost trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const maintenanceCostByMonth = await prisma.maintenanceLog.findMany({
            where: {
                date: { gte: sixMonthsAgo }
            },
            select: {
                date: true,
                cost: true
            }
        });

        const costTrend = maintenanceCostByMonth.reduce((acc: any, log) => {
            const month = new Date(log.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += Number(log.cost) || 0;
            return acc;
        }, {});

        return NextResponse.json({
            kpis: {
                totalAssets,
                activeAssets,
                inMaintenance,
                retiredAssets,
                overduePMs,
                upcomingPMs,
                lowStockParts: lowStockParts.length,
                totalPurchaseCost,
                totalCurrentValue
            },
            charts: {
                assetsByCategory,
                assetsByCondition,
                assetsByStatus,
                costTrend
            },
            lists: {
                recentMaintenance: maintenanceLogs.slice(0, 5).map(log => ({
                    id: log.id,
                    date: log.date,
                    type: log.type,
                    description: log.description,
                    cost: log.cost,
                    asset: log.asset
                })),
                upcomingPMSchedules: pmSchedules
                    .filter(pm => pm.nextDueDate && new Date(pm.nextDueDate) > now)
                    .slice(0, 5)
                    .map(pm => ({
                        id: pm.id,
                        name: pm.name,
                        nextDueDate: pm.nextDueDate,
                        asset: pm.asset
                    })),
                lowStockParts: lowStockParts.map(part => ({
                    id: part.id,
                    name: part.name,
                    partNumber: part.partNumber,
                    currentStock: part.currentStock,
                    reorderPoint: part.reorderPoint
                })),
                topAssetsByCost
            }
        });
    } catch (error) {
        console.error('Error fetching FM overview analytics:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
