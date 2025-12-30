import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch single location
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const locationId = parseInt(params.id);

        const location = await prisma.stationaryLocation.findUnique({
            where: { id: locationId },
            include: {
                department: { select: { id: true, code: true, name: true } },
                managedBy: { select: { id: true, name: true, email: true } },
                stock: {
                    include: {
                        item: { select: { id: true, itemCode: true, name: true, uom: true } },
                    },
                },
            },
        });

        if (!location) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        // Calculate total items and value
        const totalItems = location.stock.reduce((sum, s) => sum + s.quantity, 0);
        const totalValue = location.stock.reduce((sum, s) => sum + Number(s.totalValue || 0), 0);

        return NextResponse.json({
            ...location,
            totalItems,
            totalValue,
        });
    } catch (error) {
        console.error('Error fetching location:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update location
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRole: true, userDepartment: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check edit permission
        const canEdit = await hasPermission(user, 'stationary', 'edit');
        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const locationId = parseInt(params.id);
        const body = await req.json();

        // Check if location exists
        const existing = await prisma.stationaryLocation.findUnique({
            where: { id: locationId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        // If code is being changed, check for duplicates
        if (body.code && body.code !== existing.code) {
            const duplicate = await prisma.stationaryLocation.findUnique({
                where: { code: body.code.toUpperCase() },
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: 'Location code already exists' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (body.code) updateData.code = body.code.toUpperCase();
        if (body.name) updateData.name = body.name;
        if (body.type) updateData.type = body.type;
        if (body.departmentId !== undefined) updateData.departmentId = body.departmentId ? parseInt(body.departmentId) : null;
        if (body.managedById !== undefined) updateData.managedById = body.managedById ? parseInt(body.managedById) : null;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.capacity !== undefined) updateData.capacity = body.capacity;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        const location = await prisma.stationaryLocation.update({
            where: { id: locationId },
            data: updateData,
            include: {
                department: { select: { id: true, code: true, name: true } },
                managedBy: { select: { id: true, name: true, email: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryLocation',
                entityId: location.id.toString(),
                details: JSON.stringify({ code: location.code, name: location.name }),
            },
        });

        return NextResponse.json(location);
    } catch (error) {
        console.error('Error updating location:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete location
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRole: true, userDepartment: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check delete permission
        const canDelete = await hasPermission(user, 'stationary', 'delete');
        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const locationId = parseInt(params.id);

        // Check if location exists
        const location = await prisma.stationaryLocation.findUnique({
            where: { id: locationId },
            include: {
                stock: { select: { id: true, quantity: true } },
            },
        });

        if (!location) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        // Check if location has stock
        const hasStock = location.stock.some(s => s.quantity > 0);
        if (hasStock) {
            return NextResponse.json(
                { error: 'Cannot delete location with existing stock. Please transfer stock first.' },
                { status: 409 }
            );
        }

        // Soft delete
        await prisma.stationaryLocation.update({
            where: { id: locationId },
            data: { isActive: false },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE',
                entity: 'StationaryLocation',
                entityId: location.id.toString(),
                details: JSON.stringify({ code: location.code, name: location.name }),
            },
        });

        return NextResponse.json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Error deleting location:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
