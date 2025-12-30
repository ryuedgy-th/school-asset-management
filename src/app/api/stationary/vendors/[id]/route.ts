import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch single vendor
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
        const vendorId = parseInt(params.id);

        const vendor = await prisma.stationaryVendor.findUnique({
            where: { id: vendorId },
            include: {
                items: {
                    select: {
                        id: true,
                        itemCode: true,
                        name: true,
                        unitCost: true,
                        isActive: true,
                    },
                },
                purchaseOrders: {
                    select: {
                        id: true,
                        poNumber: true,
                        orderDate: true,
                        expectedDelivery: true,
                        totalAmount: true,
                        status: true,
                    },
                    orderBy: { orderDate: 'desc' },
                    take: 10,
                },
            },
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        return NextResponse.json(vendor);
    } catch (error) {
        console.error('Error fetching vendor:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update vendor
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
        const vendorId = parseInt(params.id);
        const body = await req.json();

        // Check if vendor exists
        const existing = await prisma.stationaryVendor.findUnique({
            where: { id: vendorId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        // If vendor code is being changed, check for duplicates
        if (body.vendorCode && body.vendorCode !== existing.vendorCode) {
            const duplicate = await prisma.stationaryVendor.findUnique({
                where: { vendorCode: body.vendorCode.toUpperCase() },
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: 'Vendor code already exists' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (body.vendorCode) updateData.vendorCode = body.vendorCode.toUpperCase();
        if (body.name) updateData.name = body.name;
        if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.paymentTerms !== undefined) updateData.paymentTerms = body.paymentTerms;
        if (body.leadTimeDays !== undefined) updateData.leadTimeDays = parseInt(body.leadTimeDays);
        if (body.rating !== undefined) updateData.rating = parseInt(body.rating);
        if (body.isPreferred !== undefined) updateData.isPreferred = body.isPreferred;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        const vendor = await prisma.stationaryVendor.update({
            where: { id: vendorId },
            data: updateData,
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryVendor',
                entityId: vendor.id.toString(),
                details: JSON.stringify({ vendorCode: vendor.vendorCode, name: vendor.name }),
            },
        });

        return NextResponse.json(vendor);
    } catch (error) {
        console.error('Error updating vendor:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete vendor
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
        const vendorId = parseInt(params.id);

        // Check if vendor exists
        const vendor = await prisma.stationaryVendor.findUnique({
            where: { id: vendorId },
            include: {
                items: { select: { id: true } },
                purchaseOrders: { select: { id: true } },
            },
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        // Check if vendor has items
        if (vendor.items.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete vendor with associated items. Please reassign items first.' },
                { status: 409 }
            );
        }

        // Check if vendor has purchase orders
        if (vendor.purchaseOrders.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete vendor with purchase order history. Please set as inactive instead.' },
                { status: 409 }
            );
        }

        // Soft delete
        await prisma.stationaryVendor.update({
            where: { id: vendorId },
            data: { isActive: false },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE',
                entity: 'StationaryVendor',
                entityId: vendor.id.toString(),
                details: JSON.stringify({ vendorCode: vendor.vendorCode, name: vendor.name }),
            },
        });

        return NextResponse.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
