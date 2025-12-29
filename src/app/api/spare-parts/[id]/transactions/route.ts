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

        const transactions = await prisma.inventoryTransaction.findMany({
            where: { sparePartId: partId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error('Transactions fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions', message: error.message },
            { status: 500 }
        );
    }
}

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

        if (!user || !hasModuleAccess(user, 'spare_parts')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const partId = parseInt(params.id);

        if (isNaN(partId)) {
            return NextResponse.json({ error: 'Invalid part ID' }, { status: 400 });
        }

        const data = await request.json();

        // Get current spare part
        const sparePart = await prisma.sparePart.findUnique({
            where: { id: partId },
        });

        if (!sparePart) {
            return NextResponse.json({ error: 'Spare part not found' }, { status: 404 });
        }

        // Calculate new stock level
        let newStock = sparePart.currentStock;
        if (data.type === 'in') {
            newStock += data.quantity;
        } else if (data.type === 'out') {
            if (sparePart.currentStock < data.quantity) {
                return NextResponse.json(
                    { error: 'Insufficient stock' },
                    { status: 400 }
                );
            }
            newStock -= data.quantity;
        } else if (data.type === 'adjustment') {
            newStock = data.quantity;
        }

        // Create transaction
        const transaction = await prisma.inventoryTransaction.create({
            data: {
                sparePartId: partId,
                type: data.type,
                quantity: data.quantity,
                stockAfter: newStock,
                unitCost: data.unitCost || null,
                ...(data.notes && { notes: data.notes }),
                performedById: parseInt(session.user.id),
            },
        });

        // Update spare part stock
        await prisma.sparePart.update({
            where: { id: partId },
            data: { currentStock: newStock },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id),
                action: 'CREATE',
                entity: 'InventoryTransaction',
                entityId: transaction.id.toString(),
                details: `${data.type.toUpperCase()} transaction for ${sparePart.name}: ${data.quantity} units (new stock: ${newStock})`,
            },
        });

        // Check if reorder point is reached
        if (newStock <= sparePart.reorderPoint) {

            // TODO: Send low stock notification
        }

        return NextResponse.json(transaction, { status: 201 });
    } catch (error: any) {
        console.error('Transaction creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction', message: error.message },
            { status: 500 }
        );
    }
}
