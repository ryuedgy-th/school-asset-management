import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ code: string }> }
) {
    try {
        const code = (await context.params).code;

        const asset = await prisma.asset.findUnique({
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
                    take: 5 // Last 5 inspections
                }
            }
        });

        if (!asset) {
            return NextResponse.json(
                { error: 'Asset not found' },
                { status: 404 }
            );
        }

        // Get borrow history
        const borrowHistory = await prisma.borrowItem.findMany({
            where: { assetId: asset.id },
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
                                        department: true
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
            take: 3 // Last 3 borrows
        });

        // Serialize Decimal fields
        const serializedAsset = {
            ...asset,
            cost: asset.cost ? Number(asset.cost) : null,
            inspections: asset.inspections.map(inspection => ({
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
    } catch (error) {
        console.error('Error fetching asset by code:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
