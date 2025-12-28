import { NextRequest, NextResponse } from 'next/server';

import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/fm-assets - List all FM assets with filters
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permission
        const canView = await hasPermission(session.user as any, 'fm_assets', 'view');
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const categoryId = searchParams.get('categoryId');
        const status = searchParams.get('status');
        const location = searchParams.get('location');
        const requiresMaintenance = searchParams.get('requiresMaintenance');

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { assetCode: { contains: search } },
                { name: { contains: search } },
                { description: { contains: search } },
                { brand: { contains: search } },
                { model: { contains: search } },
            ];
        }

        if (categoryId) {
            where.categoryId = parseInt(categoryId);
        }

        if (status) {
            where.status = status;
        }

        if (location) {
            where.location = { contains: location };
        }

        if (requiresMaintenance !== null && requiresMaintenance !== undefined) {
            where.requiresMaintenance = requiresMaintenance === 'true';
        }

        // Get total count
        const total = await prisma.fMAsset.count({ where });

        // Get assets with pagination
        const assets = await prisma.fMAsset.findMany({
            where,
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        components: true,
                        pmSchedules: true,
                        tickets: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({
            assets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching FM assets:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/fm-assets - Create new FM asset
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permission
        const canCreate = await hasPermission(session.user as any, 'fm_assets', 'create');
        if (!canCreate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.assetCode || !body.name || !body.categoryId || !body.type || !body.location) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if asset code already exists
        const existing = await prisma.fMAsset.findUnique({
            where: { assetCode: body.assetCode },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Asset code already exists' },
                { status: 409 }
            );
        }

        // Generate QR code
        const qrCode = `FM-${body.assetCode}`;

        // Create asset
        const asset = await prisma.fMAsset.create({
            data: {
                assetCode: body.assetCode,
                name: body.name,
                description: body.description,
                categoryId: parseInt(body.categoryId),
                type: body.type,
                brand: body.brand,
                model: body.model,
                serialNumber: body.serialNumber,
                location: body.location,
                building: body.building,
                floor: body.floor,
                room: body.room,
                purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
                installDate: body.installDate ? new Date(body.installDate) : null,
                warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
                specifications: body.specifications ? JSON.stringify(body.specifications) : null,
                condition: body.condition || 'good',
                status: body.status || 'active',
                requiresMaintenance: body.requiresMaintenance || false,
                parentAssetId: body.parentAssetId ? parseInt(body.parentAssetId) : null,
                purchaseCost: body.purchaseCost,
                currentValue: body.currentValue,
                images: body.images ? JSON.stringify(body.images) : null,
                qrCode,
                createdById: parseInt(session.user.id),
            },
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id),
                action: 'CREATE',
                entity: 'FMAsset',
                entityId: asset.id.toString(),
                details: `Created FM Asset: ${asset.name} (${asset.assetCode})`,
            },
        });

        return NextResponse.json(asset, { status: 201 });
    } catch (error) {
        console.error('Error creating FM asset:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
