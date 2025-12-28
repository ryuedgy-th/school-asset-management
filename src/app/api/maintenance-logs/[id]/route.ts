import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';

// GET /api/maintenance-logs/[id] - Get single maintenance log
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user || !hasModuleAccess(user, 'fm_assets')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const log = await prisma.maintenanceLog.findUnique({
            where: { id },
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
            },
        });

        if (!log) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }

        // Parse JSON fields and convert Decimal
        const logWithParsedData = {
            ...log,
            cost: log.cost ? Number(log.cost) : null,
            readings: log.readings ? JSON.parse(log.readings as string) : null,
            images: log.images ? JSON.parse(log.images as string) : [],
        };

        return NextResponse.json(logWithParsedData);
    } catch (error: any) {
        console.error('Error fetching maintenance log:', error);
        return NextResponse.json(
            { error: 'Failed to fetch maintenance log' },
            { status: 500 }
        );
    }
}

// PUT /api/maintenance-logs/[id] - Update maintenance log
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user || !hasModuleAccess(user, 'fm_assets')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const {
            date,
            type,
            performedBy,
            description,
            readings,
            cost,
            partsChanged,
            nextServiceDue,
            images,
        } = body;

        const log = await prisma.maintenanceLog.update({
            where: { id },
            data: {
                ...(date && { date: new Date(date) }),
                ...(type && { type }),
                ...(performedBy && { performedBy }),
                ...(description && { description }),
                ...(readings !== undefined && {
                    readings: readings ? JSON.stringify(readings) : null,
                }),
                ...(cost !== undefined && { cost }),
                ...(partsChanged !== undefined && { partsChanged }),
                ...(nextServiceDue !== undefined && {
                    nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
                }),
                ...(images !== undefined && {
                    images: images ? JSON.stringify(images) : null,
                }),
            },
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'MaintenanceLog',
                entityId: id.toString(),
                details: JSON.stringify({ type, description }),
                userId: user.id,
            },
        });

        // Parse JSON for response
        const logWithParsedData = {
            ...log,
            cost: log.cost ? Number(log.cost) : null,
            readings: log.readings ? JSON.parse(log.readings as string) : null,
            images: log.images ? JSON.parse(log.images as string) : [],
        };

        return NextResponse.json(logWithParsedData);
    } catch (error: any) {
        console.error('Error updating maintenance log:', error);
        return NextResponse.json(
            { error: 'Failed to update maintenance log' },
            { status: 500 }
        );
    }
}

// DELETE /api/maintenance-logs/[id] - Delete maintenance log
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user || !hasModuleAccess(user, 'fm_assets')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await prisma.maintenanceLog.delete({
            where: { id },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'MaintenanceLog',
                entityId: id.toString(),
                details: null,
                userId: user.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Maintenance log deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting maintenance log:', error);
        return NextResponse.json(
            { error: 'Failed to delete maintenance log' },
            { status: 500 }
        );
    }
}
