import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

// GET /api/fm-assets/[id]/qr - Generate QR code for FM asset
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const assetId = parseInt(id);

        // Fetch asset
        const asset = await prisma.fMAsset.findUnique({
            where: { id: assetId },
            include: {
                category: { select: { name: true } }
            }
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Generate QR code as data URL
        const qrCodeUrl = await QRCode.toDataURL(asset.assetCode, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return NextResponse.json({
            qrCode: qrCodeUrl,
            asset: {
                id: asset.id,
                assetCode: asset.assetCode,
                name: asset.name,
                category: asset.category.name,
                location: asset.location,
                building: asset.building,
                floor: asset.floor,
                room: asset.room
            }
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
