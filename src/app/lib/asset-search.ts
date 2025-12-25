'use server';

import { prisma } from '@/lib/prisma';
import { Asset } from '@prisma/client';

export async function searchAssets(query: string) {
    if (!query) return [];
    return await prisma.asset.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { assetCode: { contains: query } },
                { serialNumber: { contains: query } }
            ],
            // Only Available or In Use (if bulk has stock)
            status: { not: 'Lost' }
        },
        take: 10
    });
}
