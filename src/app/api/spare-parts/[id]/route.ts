import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';

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

        if (!user || !hasModuleAccess(user, 'spare_parts')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const partId = parseInt(params.id);

        if (isNaN(partId)) {
            return NextResponse.json({ error: 'Invalid part ID' }, { status: 400 });
        }

        const sparePart = await prisma.sparePart.findUnique({
            where: { id: partId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!sparePart) {
            return NextResponse.json({ error: 'Spare part not found' }, { status: 404 });
        }

        return NextResponse.json(sparePart);
    } catch (error: any) {
        console.error('Spare part fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch spare part', message: error.message },
            { status: 500 }
        );
    }
}

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

        if (!user || !hasModuleAccess(user, 'spare_parts')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const partId = parseInt(params.id);

        if (isNaN(partId)) {
            return NextResponse.json({ error: 'Invalid part ID' }, { status: 400 });
        }

        const data = await request.json();

        // Check if part number is being changed and if it already exists
        if (data.partNumber) {
            const existing = await prisma.sparePart.findFirst({
                where: {
                    partNumber: data.partNumber,
                    NOT: { id: partId },
                },
            });

            if (existing) {
                return NextResponse.json(
                    { error: 'Part number already exists' },
                    { status: 400 }
                );
            }
        }

        const sparePart = await prisma.sparePart.update({
            where: { id: partId },
            data: {
                ...(data.partNumber && { partNumber: data.partNumber }),
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.category !== undefined && { category: data.category }),
                ...(data.supplier !== undefined && { supplier: data.supplier }),
                ...(data.supplierPartNumber !== undefined && { supplierPartNumber: data.supplierPartNumber }),
                ...(data.minStock !== undefined && { minStock: data.minStock }),
                ...(data.maxStock !== undefined && { maxStock: data.maxStock }),
                ...(data.reorderPoint !== undefined && { reorderPoint: data.reorderPoint }),
                ...(data.unitCost !== undefined && { unitCost: data.unitCost }),
                ...(data.storageLocation !== undefined && { storageLocation: data.storageLocation }),
                ...(data.unit !== undefined && { unit: data.unit }),
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id),
                action: 'UPDATE',
                entity: 'SparePart',
                entityId: sparePart.id.toString(),
                details: `Updated spare part: ${sparePart.name} (${sparePart.partNumber})`,
            },
        });

        return NextResponse.json(sparePart);
    } catch (error: any) {
        console.error('Spare part update error:', error);
        return NextResponse.json(
            { error: 'Failed to update spare part', message: error.message },
            { status: 500 }
        );
    }
}

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

        if (!user || !hasModuleAccess(user, 'spare_parts')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const partId = parseInt(params.id);

        if (isNaN(partId)) {
            return NextResponse.json({ error: 'Invalid part ID' }, { status: 400 });
        }

        const sparePart = await prisma.sparePart.findUnique({
            where: { id: partId },
        });

        if (!sparePart) {
            return NextResponse.json({ error: 'Spare part not found' }, { status: 404 });
        }

        await prisma.sparePart.delete({
            where: { id: partId },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id),
                action: 'DELETE',
                entity: 'SparePart',
                entityId: partId.toString(),
                details: `Deleted spare part: ${sparePart.name} (${sparePart.partNumber})`,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Spare part deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete spare part', message: error.message },
            { status: 500 }
        );
    }
}
