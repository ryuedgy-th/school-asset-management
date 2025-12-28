import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/components/[id]/service-history - List service records for a component
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

        // Verify component exists
        const component = await prisma.assetComponent.findUnique({
            where: { id: componentId },
        });

        if (!component) {
            return NextResponse.json(
                { error: 'Component not found' },
                { status: 404 }
            );
        }

        const serviceHistory = await prisma.componentService.findMany({
            where: { componentId },
            orderBy: { serviceDate: 'desc' },
        });

        return NextResponse.json(serviceHistory);
    } catch (error) {
        console.error('Error fetching service history:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/components/[id]/service-history - Add service record
export async function POST(
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

        if (!user || !hasPermission(user, 'fm_assets', 'create')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const componentId = parseInt(params.id);
        const body = await request.json();

        // Validate required fields
        if (!body.serviceDate || !body.serviceType || !body.performedBy) {
            return NextResponse.json(
                { error: 'Service date, type, and performed by are required' },
                { status: 400 }
            );
        }

        // Verify component exists
        const component = await prisma.assetComponent.findUnique({
            where: { id: componentId },
        });

        if (!component) {
            return NextResponse.json(
                { error: 'Component not found' },
                { status: 404 }
            );
        }

        const serviceRecord = await prisma.componentService.create({
            data: {
                componentId,
                serviceDate: new Date(body.serviceDate),
                serviceType: body.serviceType,
                description: body.description,
                performedBy: body.performedBy,
                cost: body.cost,
                partsReplaced: body.partsReplaced,
                nextServiceDue: body.nextServiceDue ? new Date(body.nextServiceDue) : null,
            },
        });

        // Update component's last service date and next service due
        await prisma.assetComponent.update({
            where: { id: componentId },
            data: {
                lastServiceDate: new Date(body.serviceDate),
                ...(body.nextServiceDue && { nextServiceDue: new Date(body.nextServiceDue) }),
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'ComponentService',
                entityId: serviceRecord.id.toString(),
                details: JSON.stringify({
                    componentId,
                    serviceType: body.serviceType,
                }),
                userId: user.id,
            },
        });

        return NextResponse.json(serviceRecord, { status: 201 });
    } catch (error) {
        console.error('Error creating service record:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
