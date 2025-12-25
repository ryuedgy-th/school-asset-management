'use server';

import { prisma } from '@/lib/prisma';

export async function getAssetWithLatestInspection(assetId: number) {
    const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
            inspections: {
                orderBy: { inspectionDate: 'desc' },
                take: 1,
                include: {
                    inspector: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    if (!asset) return null;

    return {
        ...asset,
        latestInspection: asset.inspections[0] || null
    };
}

export async function getAssetsWithInspections(assetIds: number[]) {
    const assets = await prisma.asset.findMany({
        where: { id: { in: assetIds } },
        include: {
            inspections: {
                orderBy: { inspectionDate: 'desc' },
                take: 1,
                include: {
                    inspector: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    return assets.map(asset => ({
        ...asset,
        latestInspection: asset.inspections[0] || null
    }));
}
