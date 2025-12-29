'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function createSparePart(data: {
    partNumber: string;
    name: string;
    description?: string;
    category: string;
    supplier?: string;
    supplierPartNumber?: string;
    currentStock?: number;
    minStock?: number;
    maxStock?: number;
    reorderPoint?: number;
    unitCost?: number;
    storageLocation?: string;
    unit: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { userRole: true, userDepartment: true },
    });

    if (!user || !hasModuleAccess(user, 'spare_parts')) {
        throw new Error('Forbidden');
    }

    // Check for duplicate part number
    const existing = await prisma.sparePart.findUnique({
        where: { partNumber: data.partNumber },
    });

    if (existing) {
        throw new Error('Part number already exists');
    }

    const sparePart = await prisma.sparePart.create({
        data: {
            partNumber: data.partNumber,
            name: data.name,
            category: data.category,
            unit: data.unit,
            ...(data.description && { description: data.description }),
            ...(data.supplier && { supplier: data.supplier }),
            ...(data.supplierPartNumber && { supplierPartNumber: data.supplierPartNumber }),
            currentStock: data.currentStock || 0,
            minStock: data.minStock || 0,
            ...(data.maxStock && { maxStock: data.maxStock }),
            reorderPoint: data.reorderPoint || 0,
            ...(data.unitCost && { unitCost: data.unitCost }),
            ...(data.storageLocation && { storageLocation: data.storageLocation }),
        },
    });

    // Create audit log
    await prisma.auditLog.create({
        data: {
            userId: parseInt(session.user.id),
            action: 'CREATE',
            entity: 'SparePart',
            entityId: sparePart.id.toString(),
            details: `Created spare part: ${sparePart.name} (${sparePart.partNumber})`,
        },
    });

    revalidatePath('/spare-parts');
    return sparePart;
}

export async function updateSparePart(
    id: number,
    data: {
        partNumber?: string;
        name?: string;
        description?: string;
        category?: string;
        supplier?: string;
        supplierPartNumber?: string;
        minStock?: number;
        maxStock?: number;
        reorderPoint?: number;
        unitCost?: number;
        storageLocation?: string;
        unit?: string;
    }
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { userRole: true, userDepartment: true },
    });

    if (!user || !hasModuleAccess(user, 'spare_parts')) {
        throw new Error('Forbidden');
    }

    // Check if part number is being changed and if it already exists
    if (data.partNumber) {
        const existing = await prisma.sparePart.findFirst({
            where: {
                partNumber: data.partNumber,
                NOT: { id },
            },
        });

        if (existing) {
            throw new Error('Part number already exists');
        }
    }

    const sparePart = await prisma.sparePart.update({
        where: { id },
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

    revalidatePath('/spare-parts');
    revalidatePath(`/spare-parts/${id}`);
    return sparePart;
}

export async function deleteSparePart(id: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { userRole: true, userDepartment: true },
    });

    if (!user || !hasModuleAccess(user, 'spare_parts')) {
        throw new Error('Forbidden');
    }

    const sparePart = await prisma.sparePart.findUnique({
        where: { id },
    });

    if (!sparePart) {
        throw new Error('Spare part not found');
    }

    await prisma.sparePart.delete({
        where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
        data: {
            userId: parseInt(session.user.id),
            action: 'DELETE',
            entity: 'SparePart',
            entityId: id.toString(),
            details: `Deleted spare part: ${sparePart.name} (${sparePart.partNumber})`,
        },
    });

    revalidatePath('/spare-parts');
    return { success: true };
}

export async function recordTransaction(data: {
    sparePartId: number;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    unitCost?: number;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { userRole: true, userDepartment: true },
    });

    if (!user || !hasModuleAccess(user, 'spare_parts')) {
        throw new Error('Forbidden');
    }

    // Get current spare part
    const sparePart = await prisma.sparePart.findUnique({
        where: { id: data.sparePartId },
    });

    if (!sparePart) {
        throw new Error('Spare part not found');
    }

    // Calculate new stock level
    let newStock = sparePart.currentStock;
    if (data.type === 'in') {
        newStock += data.quantity;
    } else if (data.type === 'out') {
        if (sparePart.currentStock < data.quantity) {
            throw new Error('Insufficient stock');
        }
        newStock -= data.quantity;
    } else if (data.type === 'adjustment') {
        newStock = data.quantity;
    }

    // Create transaction
    const transaction = await prisma.inventoryTransaction.create({
        data: {
            sparePartId: data.sparePartId,
            type: data.type,
            quantity: data.quantity,
            stockAfter: newStock,
            ...(data.notes && { notes: data.notes }),
            performedById: parseInt(session.user.id),
        },
    });

    // Update spare part stock
    await prisma.sparePart.update({
        where: { id: data.sparePartId },
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

    revalidatePath('/spare-parts');
    revalidatePath(`/spare-parts/${data.sparePartId}`);
    return transaction;
}

export async function getLowStockParts() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { userRole: true, userDepartment: true },
    });

    if (!user || !hasModuleAccess(user, 'spare_parts')) {
        throw new Error('Forbidden');
    }

    const lowStockParts = await prisma.$queryRaw<any[]>`
        SELECT * FROM SparePart
        WHERE currentStock <= reorderPoint
        ORDER BY currentStock ASC
    `;

    return lowStockParts;
}

export async function getInventoryValue() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { userRole: true, userDepartment: true },
    });

    if (!user || !hasModuleAccess(user, 'spare_parts')) {
        throw new Error('Forbidden');
    }

    const parts = await prisma.sparePart.findMany({
        select: {
            currentStock: true,
            unitCost: true,
        },
    });

    const totalValue = parts.reduce((sum, part) => {
        const cost = part.unitCost ? Number(part.unitCost) : 0;
        return sum + (part.currentStock * cost);
    }, 0);

    return totalValue;
}
