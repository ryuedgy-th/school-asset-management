import { NextRequest, NextResponse } from 'next/server';

import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/fm-assets/[id]/components - List asset components
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
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
        const assetId = parseInt(params.id);

        const components = await prisma.assetComponent.findMany({
            where: { assetId },
            include: {
                serviceHistory: {
                    orderBy: {
                        serviceDate: 'desc',
                    },
                    take: 5,
                },
                spareParts: {
                    include: {
                        sparePart: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(components);
    } catch (error) {
        console.error('Error fetching components:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/fm-assets/[id]/components - Add component to asset
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
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
        const assetId = parseInt(params.id);
        const body = await request.json();

        // Validate required fields
        if (!body.name || !body.componentType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if asset exists
        const asset = await prisma.fMAsset.findUnique({
            where: { id: assetId },
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Create component
        const component = await prisma.assetComponent.create({
            data: {
                assetId,
                name: body.name,
                componentType: body.componentType,
                description: body.description,
                serialNumber: body.serialNumber,
                partNumber: body.partNumber,
                manufacturer: body.manufacturer,
                model: body.model,
                installDate: body.installDate ? new Date(body.installDate) : null,
                installedBy: body.installedBy,
                lastServiceDate: body.lastServiceDate ? new Date(body.lastServiceDate) : null,
                nextServiceDue: body.nextServiceDue ? new Date(body.nextServiceDue) : null,
                serviceInterval: body.serviceInterval,
                expectedLifespan: body.expectedLifespan,
                replacementCost: body.replacementCost,
                condition: body.condition || 'good',
                status: body.status || 'active',
                notes: body.notes,
            },
            include: {
                serviceHistory: true,
                spareParts: {
                    include: {
                        sparePart: true,
                    },
                },
            },
        });

        // Link spare parts if provided
        if (body.sparePartIds && Array.isArray(body.sparePartIds)) {
            for (const sparePartId of body.sparePartIds) {
                await prisma.componentSparePart.create({
                    data: {
                        componentId: component.id,
                        sparePartId: parseInt(sparePartId),
                        quantity: 1,
                        isRecommended: true,
                    },
                });
            }
        }

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id),
                action: 'CREATE',
                entity: 'AssetComponent',
                entityId: component.id.toString(),
                details: `Added component ${component.name} to asset ${asset.name}`,
            },
        });

        return NextResponse.json(component, { status: 201 });
    } catch (error) {
        console.error('Error creating component:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
