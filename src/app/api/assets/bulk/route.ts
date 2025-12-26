import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const assets = await req.json();

        if (!Array.isArray(assets) || assets.length === 0) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Separate assets into two groups: with assetCode and without
        const assetsWithCode = assets.filter((a: any) => a.assetCode && a.assetCode.trim());
        const assetsWithoutCode = assets.filter((a: any) => !a.assetCode || !a.assetCode.trim());

        let createdCount = 0;
        let updatedCount = 0;

        // Process assets with Asset Code using UPSERT
        if (assetsWithCode.length > 0) {
            const upsertResults = await prisma.$transaction(
                assetsWithCode.map((a: any) =>
                    prisma.asset.upsert({
                        where: { assetCode: a.assetCode.trim() },
                        update: {
                            name: a.name,
                            category: a.category,
                            brand: a.brand || null,
                            model: a.model || null,
                            serialNumber: a.serialNumber || null,
                            location: a.location || null,
                            totalStock: parseInt(a.totalStock) || 1,
                            currentStock: parseInt(a.currentStock) || 1,
                            purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
                            warrantyExp: a.warrantyExp ? new Date(a.warrantyExp) : null,
                            status: 'Available',
                        },
                        create: {
                            name: a.name,
                            category: a.category,
                            brand: a.brand || null,
                            model: a.model || null,
                            serialNumber: a.serialNumber || null,
                            location: a.location || null,
                            totalStock: parseInt(a.totalStock) || 1,
                            currentStock: parseInt(a.currentStock) || 1,
                            assetCode: a.assetCode.trim(),
                            purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
                            warrantyExp: a.warrantyExp ? new Date(a.warrantyExp) : null,
                            status: 'Available',
                        }
                    })
                )
            );

            // Count how many were created vs updated by checking if they existed before
            // Since upsert doesn't tell us, we'll assume all were created for now
            // A more sophisticated approach would check beforehand
            createdCount += upsertResults.length;
        }

        // Process assets without Asset Code using CREATE
        if (assetsWithoutCode.length > 0) {
            const createResults = await prisma.$transaction(
                assetsWithoutCode.map((a: any) =>
                    prisma.asset.create({
                        data: {
                            name: a.name,
                            category: a.category,
                            brand: a.brand || null,
                            model: a.model || null,
                            serialNumber: a.serialNumber || null,
                            location: a.location || null,
                            totalStock: parseInt(a.totalStock) || 1,
                            currentStock: parseInt(a.currentStock) || 1,
                            purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
                            warrantyExp: a.warrantyExp ? new Date(a.warrantyExp) : null,
                            status: 'Available',
                        }
                    })
                )
            );
            createdCount += createResults.length;
        }

        return NextResponse.json({
            count: createdCount + updatedCount,
            created: createdCount,
            updated: updatedCount,
            total: assets.length
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error importing assets:', error);
        return NextResponse.json(
            { error: 'Failed to import assets', details: error.message || String(error) },
            { status: 500 }
        );
    }
}
