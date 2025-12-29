import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ code: string }> }
) {
    try {
        const code = (await context.params).code;

        // Try to find IT Asset first
        const itAsset = await prisma.asset.findUnique({
            where: { assetCode: code },
            include: {
                inspections: {
                    include: {
                        inspector: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        inspectionDate: 'desc'
                    },
                    take: 5
                }
            }
        });

        // If IT asset found, return it
        if (itAsset) {
            // Get borrow history
            const borrowHistory = await prisma.borrowItem.findMany({
                where: { assetId: itAsset.id },
                include: {
                    borrowTransaction: {
                        include: {
                            assignment: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                            userDepartment: { select: { name: true, code: true } }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    returnItems: true
                },
                orderBy: {
                    id: 'desc'
                },
                take: 3
            });

            // Serialize Decimal fields
            const serializedAsset = {
                ...itAsset,
                type: 'it_asset' as const,
                cost: itAsset.cost ? Number(itAsset.cost) : null,
                inspections: itAsset.inspections.map(inspection => ({
                    ...inspection,
                    estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null
                })),
                borrowHistory: borrowHistory.map(item => ({
                    ...item,
                    returnItems: item.returnItems.map((returnItem: any) => ({
                        ...returnItem,
                        damageCharge: returnItem.damageCharge ? Number(returnItem.damageCharge) : null
                    }))
                }))
            };

            return NextResponse.json(serializedAsset);
        }

        // If not found as IT asset, try FM Asset
        const fmAsset = await prisma.fMAsset.findUnique({
            where: { assetCode: code },
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                components: {
                    where: { status: 'active' },
                    select: {
                        id: true,
                        name: true,
                        componentType: true,
                        status: true
                    },
                    take: 5
                },
                maintenanceLogs: {
                    orderBy: { date: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        date: true,
                        type: true,
                        performedBy: true,
                        description: true,
                        cost: true
                    }
                },
                pmSchedules: {
                    where: { isActive: true },
                    orderBy: { nextDueDate: 'asc' },
                    take: 3,
                    select: {
                        id: true,
                        name: true,
                        frequency: true,
                        nextDueDate: true
                    }
                },
                tickets: {
                    where: {
                        status: { not: 'closed' }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                    select: {
                        id: true,
                        ticketNumber: true,
                        title: true,
                        status: true,
                        priority: true,
                        createdAt: true
                    }
                }
            }
        });

        if (fmAsset) {
            // Serialize Decimal fields
            const serializedAsset = {
                ...fmAsset,
                type: 'fm_asset' as const,
                purchaseCost: fmAsset.purchaseCost ? Number(fmAsset.purchaseCost) : null,
                currentValue: fmAsset.currentValue ? Number(fmAsset.currentValue) : null,
                maintenanceLogs: fmAsset.maintenanceLogs.map(log => ({
                    ...log,
                    cost: log.cost ? Number(log.cost) : null
                }))
            };

            return NextResponse.json(serializedAsset);
        }

        // Neither IT nor FM asset found
        return NextResponse.json(
            { error: 'Asset not found' },
            { status: 404 }
        );
    } catch (error) {
        console.error('Error fetching asset by code:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
