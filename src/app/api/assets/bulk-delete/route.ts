import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: ids must be a non-empty array' },
                { status: 400 }
            );
        }

        // Check if any assets are currently borrowed
        const borrowedAssets = await prisma.asset.findMany({
            where: {
                id: { in: ids },
                status: 'Borrowed'
            },
            select: { id: true, name: true, assetCode: true }
        });

        if (borrowedAssets.length > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete borrowed assets',
                    borrowedAssets: borrowedAssets.map(a => ({
                        id: a.id,
                        name: a.name,
                        code: a.assetCode
                    }))
                },
                { status: 400 }
            );
        }

        // Delete all assets
        const result = await prisma.asset.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.count
        });
    } catch (error) {
        console.error('Error bulk deleting assets:', error);
        return NextResponse.json(
            { error: 'Failed to delete assets' },
            { status: 500 }
        );
    }
}
