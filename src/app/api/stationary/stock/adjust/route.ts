import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// POST: Adjust stock (add/remove quantity)
export async function POST(req: NextRequest) {
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

        // Check receive permission for adding stock
        const canReceive = await hasPermission(user, 'stationary', 'receive');
        if (!canReceive) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const {
            itemId,
            locationId,
            quantity,
            adjustmentType, // 'add' or 'remove' or 'set'
            unitCost,
            batchNumber,
            expiryDate,
            reason,
            referenceType,
            referenceId,
        } = body;

        // Validate required fields
        if (!itemId || !locationId || quantity === undefined || !adjustmentType) {
            return NextResponse.json(
                { error: 'Item ID, location ID, quantity, and adjustment type are required' },
                { status: 400 }
            );
        }

        // Get current stock
        const stockWhere: any = {
            itemId: parseInt(itemId),
            locationId: parseInt(locationId),
        };

        if (batchNumber) {
            stockWhere.batchNumber = batchNumber;
        }

        const currentStock = await prisma.stationaryStock.findFirst({
            where: stockWhere,
            include: { item: true },
        });

        let newQuantity = 0;
        let oldQuantity = currentStock?.quantity || 0;

        // Calculate new quantity based on adjustment type
        switch (adjustmentType) {
            case 'add':
                newQuantity = oldQuantity + parseInt(quantity);
                break;
            case 'remove':
                newQuantity = oldQuantity - parseInt(quantity);
                if (newQuantity < 0) {
                    return NextResponse.json(
                        { error: 'Insufficient stock' },
                        { status: 400 }
                    );
                }
                break;
            case 'set':
                newQuantity = parseInt(quantity);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid adjustment type' },
                    { status: 400 }
                );
        }

        const actualUnitCost = unitCost ? parseFloat(unitCost) : (currentStock?.unitCost ? Number(currentStock.unitCost) : null);
        const totalValue = actualUnitCost ? newQuantity * actualUnitCost : null;

        let updatedStock;

        if (currentStock) {
            // Update existing stock
            updatedStock = await prisma.stationaryStock.update({
                where: { id: currentStock.id },
                data: {
                    quantity: newQuantity,
                    unitCost: actualUnitCost,
                    totalValue: totalValue,
                    ...(expiryDate && { expiryDate: new Date(expiryDate) }),
                },
                include: {
                    item: true,
                    location: true,
                },
            });
        } else {
            // Create new stock record
            updatedStock = await prisma.stationaryStock.create({
                data: {
                    itemId: parseInt(itemId),
                    locationId: parseInt(locationId),
                    quantity: newQuantity,
                    unitCost: actualUnitCost,
                    totalValue: totalValue,
                    batchNumber: batchNumber || null,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                },
                include: {
                    item: true,
                    location: true,
                },
            });
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryStock',
                entityId: updatedStock.id.toString(),
                details: JSON.stringify({
                    itemCode: updatedStock.item.itemCode,
                    location: updatedStock.location.code,
                    adjustmentType,
                    oldQuantity,
                    newQuantity,
                    reason,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            stock: updatedStock,
            oldQuantity,
            newQuantity,
        });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
