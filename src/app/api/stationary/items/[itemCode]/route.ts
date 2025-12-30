import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch single item by itemCode
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ itemCode: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { itemCode } = params;

        const item = await prisma.stationaryItem.findUnique({
            where: { itemCode },
            include: {
                category: { select: { id: true, code: true, name: true } },
                defaultVendor: { select: { id: true, vendorCode: true, name: true, phone: true, email: true } },
                stock: {
                    include: {
                        location: { select: { id: true, code: true, name: true, type: true } },
                    },
                },
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Calculate total stock
        const totalStock = item.stock.reduce((sum, s) => sum + s.quantity, 0);

        return NextResponse.json({
            ...item,
            totalStock,
            isLowStock: totalStock < item.minStockLevel,
        });
    } catch (error) {
        console.error('Error fetching item:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update item
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ itemCode: string }> }
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
        const { itemCode } = params;
        const body = await req.json();

        // Check if item exists
        const existing = await prisma.stationaryItem.findUnique({
            where: { itemCode },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // If barcode is being changed, check for duplicates
        if (body.barcode && body.barcode !== existing.barcode) {
            const barcodeExists = await prisma.stationaryItem.findUnique({
                where: { barcode: body.barcode },
            });

            if (barcodeExists) {
                return NextResponse.json(
                    { error: 'Barcode already exists' },
                    { status: 409 }
                );
            }
        }

        const updateData: any = {};
        if (body.name) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.categoryId) updateData.categoryId = parseInt(body.categoryId);
        if (body.uom) updateData.uom = body.uom;
        if (body.minStockLevel !== undefined) updateData.minStockLevel = parseInt(body.minStockLevel);
        if (body.maxStockLevel !== undefined) updateData.maxStockLevel = body.maxStockLevel ? parseInt(body.maxStockLevel) : null;
        if (body.reorderPoint !== undefined) updateData.reorderPoint = parseInt(body.reorderPoint);
        if (body.reorderQuantity !== undefined) updateData.reorderQuantity = parseInt(body.reorderQuantity);
        if (body.unitCost !== undefined) updateData.unitCost = body.unitCost ? parseFloat(body.unitCost) : null;
        if (body.defaultVendorId !== undefined) updateData.defaultVendorId = body.defaultVendorId ? parseInt(body.defaultVendorId) : null;
        if (body.isRestricted !== undefined) updateData.isRestricted = body.isRestricted;
        if (body.expiryTracking !== undefined) updateData.expiryTracking = body.expiryTracking;
        if (body.barcodeEnabled !== undefined) updateData.barcodeEnabled = body.barcodeEnabled;
        if (body.barcode !== undefined) updateData.barcode = body.barcode || null;
        if (body.tags !== undefined) updateData.tags = body.tags;
        if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.isArchived !== undefined) updateData.isArchived = body.isArchived;

        const item = await prisma.stationaryItem.update({
            where: { itemCode },
            data: updateData,
            include: {
                category: { select: { id: true, code: true, name: true } },
                defaultVendor: { select: { id: true, vendorCode: true, name: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryItem',
                entityId: item.id.toString(),
                details: JSON.stringify({ itemCode: item.itemCode, name: item.name }),
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error('Error updating item:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete (archive) item
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ itemCode: string }> }
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
        const { itemCode } = params;

        // Check if item exists
        const item = await prisma.stationaryItem.findUnique({
            where: { itemCode },
            include: {
                stock: { select: { quantity: true } },
            },
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Check if item has stock
        const totalStock = item.stock.reduce((sum, s) => sum + s.quantity, 0);
        if (totalStock > 0) {
            return NextResponse.json(
                { error: 'Cannot delete item with existing stock. Please remove stock first.' },
                { status: 409 }
            );
        }

        // Soft delete by archiving
        await prisma.stationaryItem.update({
            where: { itemCode },
            data: { isActive: false, isArchived: true },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE',
                entity: 'StationaryItem',
                entityId: item.id.toString(),
                details: JSON.stringify({ itemCode: item.itemCode, name: item.name }),
            },
        });

        return NextResponse.json({ message: 'Item archived successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
