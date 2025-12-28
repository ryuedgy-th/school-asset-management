import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import QRCode from 'qrcode';

// POST /api/fm-assets/bulk-qr - Generate QR codes for multiple FM assets
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canView = await hasPermission(session.user as any, 'fm_assets', 'view');
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { assetIds } = body;

        if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request - assetIds array required' },
                { status: 400 }
            );
        }

        // Fetch assets
        const assets = await prisma.fMAsset.findMany({
            where: {
                id: { in: assetIds.map(id => parseInt(id)) }
            },
            include: {
                category: { select: { name: true } }
            },
            orderBy: { assetCode: 'asc' }
        });

        // Generate QR codes for all assets
        const qrCodes = await Promise.all(
            assets.map(async (asset) => {
                const qrCodeUrl = await QRCode.toDataURL(asset.assetCode, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                return {
                    id: asset.id,
                    assetCode: asset.assetCode,
                    name: asset.name,
                    category: asset.category.name,
                    location: asset.location,
                    building: asset.building,
                    floor: asset.floor,
                    room: asset.room,
                    qrCode: qrCodeUrl
                };
            })
        );

        return NextResponse.json({ qrCodes });
    } catch (error) {
        console.error('Error generating bulk QR codes:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
