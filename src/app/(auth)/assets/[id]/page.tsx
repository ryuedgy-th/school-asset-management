import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import AssetDetailClient from './AssetDetailClient';

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
        where: { id: parseInt(id) },
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
                }
            }
        }
    });

    if (!asset) {
        notFound();
    }

    // Get borrow history through borrowItems
    const borrowHistory = await prisma.borrowItem.findMany({
        where: { assetId: parseInt(id) },
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
                                    userDepartment: {
                                        select: {
                                            name: true,
                                            code: true
                                        }
                                    }
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
        take: 3 // Current + 2 recent
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

    return <AssetDetailClient asset={serializedAsset} />;
}
