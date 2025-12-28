import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/components/[id] - Get single component
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { userRole: true, userDepartment: true },
        });

        if (!user || !hasPermission(user, 'fm_assets', 'view')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const componentId = parseInt(params.id);

        const component = await prisma.assetComponent.findUnique({
            where: { id: componentId },
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
                serviceHistory: {
                    orderBy: { serviceDate: 'desc' },
                    take: 10,
                },
                spareParts: {
                    include: {
                        sparePart: true,
                    },
                },
            },
        });

        if (!component) {
            return NextResponse.json(
                { error: 'Component not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(component);
    } catch (error) {
        console.error('Error fetching component:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/components/[id] - Update component
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { userRole: true, userDepartment: true },
        });

        if (!user || !hasPermission(user, 'fm_assets', 'edit')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const componentId = parseInt(params.id);
        const body = await request.json();

        const component = await prisma.assetComponent.update({
            where: { id: componentId },
            data: {
                ...(body.name && { name: body.name }),
                ...(body.componentType && { componentType: body.componentType }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber }),
                ...(body.partNumber !== undefined && { partNumber: body.partNumber }),
                ...(body.lastServiceDate && { lastServiceDate: new Date(body.lastServiceDate) }),
                ...(body.nextServiceDue && { nextServiceDue: new Date(body.nextServiceDue) }),
                ...(body.serviceInterval !== undefined && { serviceInterval: body.serviceInterval }),
                ...(body.expectedLifespan !== undefined && { expectedLifespan: body.expectedLifespan }),
                ...(body.replacementCost !== undefined && { replacementCost: body.replacementCost }),
                ...(body.installDate && { installDate: new Date(body.installDate) }),
                ...(body.installedBy !== undefined && { installedBy: body.installedBy }),
                ...(body.condition && { condition: body.condition }),
                ...(body.status && { status: body.status }),
                ...(body.notes !== undefined && { notes: body.notes }),
            },
            include: {
                asset: true,
                serviceHistory: {
                    orderBy: { serviceDate: 'desc' },
                    take: 5,
                },
                spareParts: {
                    include: { sparePart: true },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'AssetComponent',
                entityId: componentId.toString(),
                details: JSON.stringify({ componentName: component.name }),
                userId: user.id,
            },
        });

        return NextResponse.json(component);
    } catch (error) {
        console.error('Error updating component:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/components/[id] - Delete component
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { userRole: true, userDepartment: true },
        });

        if (!user || !hasPermission(user, 'fm_assets', 'delete')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const componentId = parseInt(params.id);

        const component = await prisma.assetComponent.findUnique({
            where: { id: componentId },
        });

        if (!component) {
            return NextResponse.json(
                { error: 'Component not found' },
                { status: 404 }
            );
        }

        // Delete component (cascade will handle service history and spare part links)
        await prisma.assetComponent.delete({
            where: { id: componentId },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'AssetComponent',
                entityId: componentId.toString(),
                details: JSON.stringify({ componentName: component.name }),
                userId: user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting component:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
