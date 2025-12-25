import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const assets = await req.json();

        if (!Array.isArray(assets) || assets.length === 0) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // We use a transaction to ensure either all succeed or fail, 
        // OR we can use createMany. 
        // createMany is faster but doesn't return generated IDs in some DBs.
        // For import, we just want to know it succeeded.
        // However, we need to handle "Asset Code" uniqueness. 
        // If Asset Code is missing, we let Prisma default (CUID).

        // Let's filter out assets that might conflict first? 
        // Or just let it fail?
        // Bulk import is tricky with constraints.
        // Best approach for simplicity: standard createMany.

        // Note: SQLite supports createMany!

        // Use transaction to ensure all or nothing, and compatibility with all Prisma providers
        const result = await prisma.$transaction(
            assets.map((a: any) =>
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
                        assetCode: a.assetCode || undefined,
                        purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
                        warrantyExp: a.warrantyExp ? new Date(a.warrantyExp) : null,
                        status: 'Available',
                    }
                })
            )
        );

        return NextResponse.json({ count: result.length }, { status: 201 });

    } catch (error: any) {
        console.error('Error importing assets:', error);
        return NextResponse.json(
            { error: 'Failed to import assets', details: error.message || String(error) },
            { status: 500 }
        );
    }
}
