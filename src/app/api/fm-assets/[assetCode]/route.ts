import { NextRequest, NextResponse } from 'next/server';

import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/fm-assets/[assetCode] - Get single FM asset
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ assetCode: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canView = await hasPermission(session.user as any, 'fm_assets', 'view');
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const { assetCode } = params;

        const asset = await prisma.fMAsset.findUnique({
            where: { assetCode },
            include: {
                category: true,
                parentAsset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
                childAssets: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                        type: true,
                        status: true,
                    },
                },
                components: {
                    include: {
                        serviceHistory: {
                            orderBy: {
                                serviceDate: 'desc',
                            },
                            take: 5,
                        },
                    },
                },
                pmSchedules: {
                    where: {
                        isActive: true,
                    },
                    orderBy: {
                        nextDueDate: 'asc',
                    },
                },
                maintenanceLogs: {
                    orderBy: {
                        date: 'desc',
                    },
                    take: 10,
                },
                tickets: {
                    where: {
                        status: {
                            not: 'closed',
                        },
                    },
                    orderBy: {
                        reportedAt: 'desc',
                    },
                },
                inspectionRecords: {
                    include: {
                        template: true,
                        inspectedBy: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        inspectionDate: 'desc',
                    },
                    take: 12, // Last 12 months
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Parse JSON fields
        const assetWithParsedData = {
            ...asset,
            specifications: asset.specifications ? JSON.parse(asset.specifications) : null,
            images: asset.images ? JSON.parse(asset.images) : [],
        };

        return NextResponse.json(assetWithParsedData);
    } catch (error) {
        console.error('Error fetching FM asset:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/fm-assets/[assetCode] - Update FM asset
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ assetCode: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canEdit = await hasPermission(session.user as any, 'fm_assets', 'edit');
        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const { assetCode } = params;
        const body = await request.json();

        // Check if asset exists
        const existing = await prisma.fMAsset.findUnique({
            where: { assetCode },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // If asset code is being changed, check for duplicates
        if (body.assetCode && body.assetCode !== existing.assetCode) {
            const duplicate = await prisma.fMAsset.findUnique({
                where: { assetCode: body.assetCode },
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: 'Asset code already exists' },
                    { status: 409 }
                );
            }
        }

        // Update asset
        const asset = await prisma.fMAsset.update({
            where: { assetCode },
            data: {
                assetCode: body.assetCode,
                name: body.name,
                description: body.description,
                categoryId: body.categoryId ? parseInt(body.categoryId) : undefined,
                type: body.type,
                brand: body.brand,
                model: body.model,
                serialNumber: body.serialNumber,
                location: body.location,
                building: body.building,
                floor: body.floor,
                room: body.room,
                purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
                installDate: body.installDate ? new Date(body.installDate) : undefined,
                warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
                specifications: body.specifications ? JSON.stringify(body.specifications) : undefined,
                condition: body.condition,
                status: body.status,
                requiresMaintenance: body.requiresMaintenance,
                parentAssetId: body.parentAssetId ? parseInt(body.parentAssetId) : null,
                purchaseCost: body.purchaseCost,
                currentValue: body.currentValue,
                images: body.images ? JSON.stringify(body.images) : undefined,
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
                action: 'UPDATE',
                entity: 'FMAsset',
                entityId: asset.id.toString(),
                details: `Updated FM Asset: ${asset.name} (${asset.assetCode})`,
            },
        });

        return NextResponse.json(asset);
    } catch (error) {
        console.error('Error updating FM asset:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/fm-assets/[assetCode] - Delete FM asset
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ assetCode: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canDelete = await hasPermission(session.user as any, 'fm_assets', 'delete');
        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const { assetCode } = params;

        // Check if asset exists
        const asset = await prisma.fMAsset.findUnique({
            where: { assetCode },
            include: {
                _count: {
                    select: {
                        components: true,
                        pmSchedules: true,
                        tickets: true,
                        childAssets: true,
                    },
                },
            },
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Check for dependencies
        if (asset._count.childAssets > 0) {
            return NextResponse.json(
                { error: 'Cannot delete asset with child assets' },
                { status: 409 }
            );
        }

        // Soft delete option: just update status to 'retired'
        const searchParams = request.nextUrl.searchParams;
        const softDelete = searchParams.get('soft') === 'true';

        if (softDelete) {
            const updated = await prisma.fMAsset.update({
                where: { assetCode },
                data: {
                    status: 'retired',
                },
            });

            await prisma.auditLog.create({
                data: {
                    userId: parseInt(session.user.id),
                    action: 'SOFT_DELETE',
                    entity: 'FMAsset',
                    entityId: asset.id.toString(),
                    details: `Retired FM Asset: ${asset.name} (${asset.assetCode})`,
                },
            });

            return NextResponse.json({ message: 'Asset retired successfully', asset: updated });
        }

        // Hard delete
        await prisma.fMAsset.delete({
            where: { assetCode },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id),
                action: 'DELETE',
                entity: 'FMAsset',
                entityId: asset.id.toString(),
                details: `Deleted FM Asset: ${asset.name} (${asset.assetCode})`,
            },
        });

        return NextResponse.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting FM asset:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
