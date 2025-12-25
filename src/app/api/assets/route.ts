import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { saveFile } from '@/lib/upload';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();

        // Extract File
        const imageFile = formData.get('image') as File | null;
        let imagePath = null;
        if (imageFile) {
            imagePath = await saveFile(imageFile, 'assets');
        }

        // Extract Fields
        const name = formData.get('name') as string;
        const category = formData.get('category') as string;
        const serialNumber = formData.get('serialNumber') as string;
        const totalStock = Number(formData.get('totalStock'));
        const currentStock = Number(formData.get('currentStock'));
        const status = formData.get('status') as string;
        // Enterprise fields
        const assetCode = formData.get('assetCode') as string;
        const brand = formData.get('brand') as string;
        const model = formData.get('model') as string;
        const location = formData.get('location') as string;
        const purchaseDateStr = formData.get('purchaseDate') as string;
        const warrantyExpStr = formData.get('warrantyExp') as string;
        const vendor = formData.get('vendor') as string;
        const costStr = formData.get('cost') as string;


        const asset = await prisma.asset.create({
            data: {
                name,
                category,
                // Convert empty string to null to avoid unique constraint violation
                serialNumber: serialNumber && serialNumber.trim() !== '' ? serialNumber : null,
                totalStock: isNaN(totalStock) ? 1 : totalStock,
                currentStock: isNaN(currentStock) ? 1 : currentStock,
                status: status || 'Available',
                image: imagePath,
                // Enterprise fields
                assetCode: assetCode || undefined, // Use default CUID if empty
                brand: brand || null,
                model: model || null,
                location: location || null,
                vendor: vendor || null,
                // Dates need parsing if string
                purchaseDate: purchaseDateStr ? new Date(purchaseDateStr) : null,
                warrantyExp: warrantyExpStr ? new Date(warrantyExpStr) : null,
                cost: costStr ? parseFloat(costStr) : null,
            },
        });

        return NextResponse.json(asset, { status: 201 });
    } catch (error) {
        console.error('Error creating asset:', error);
        return NextResponse.json(
            { error: 'Failed to create asset' },
            { status: 500 }
        );
    }
}
