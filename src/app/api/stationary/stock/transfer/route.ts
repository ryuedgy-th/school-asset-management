import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// POST: Transfer stock between locations
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

        // Check issue permission for transfers
        const canIssue = await hasPermission(user, 'stationary', 'issue');
        if (!canIssue) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const {
            itemId,
            fromLocationId,
            toLocationId,
            quantity,
            batchNumber,
            reason,
        } = body;

        // Validate required fields
        if (!itemId || !fromLocationId || !toLocationId || !quantity) {
            return NextResponse.json(
                { error: 'Item ID, from location, to location, and quantity are required' },
                { status: 400 }
            );
        }

        if (fromLocationId === toLocationId) {
            return NextResponse.json(
                { error: 'From and to locations must be different' },
                { status: 400 }
            );
        }

        const transferQuantity = parseInt(quantity);

        // Get source stock
        const sourceWhere: any = {
            itemId: parseInt(itemId),
            locationId: parseInt(fromLocationId),
        };

        if (batchNumber) {
            sourceWhere.batchNumber = batchNumber;
        }

        const sourceStock = await prisma.stationaryStock.findFirst({
            where: sourceWhere,
            include: { item: true, location: true },
        });

        if (!sourceStock) {
            return NextResponse.json(
                { error: 'Source stock not found' },
                { status: 404 }
            );
        }

        if (sourceStock.quantity < transferQuantity) {
            return NextResponse.json(
                { error: 'Insufficient stock in source location' },
                { status: 400 }
            );
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Reduce quantity at source
            const updatedSource = await tx.stationaryStock.update({
                where: { id: sourceStock.id },
                data: {
                    quantity: sourceStock.quantity - transferQuantity,
                    totalValue: sourceStock.unitCost
                        ? (sourceStock.quantity - transferQuantity) * Number(sourceStock.unitCost)
                        : null,
                },
            });

            // Check if destination stock exists
            const destWhere: any = {
                itemId: parseInt(itemId),
                locationId: parseInt(toLocationId),
            };

            if (batchNumber) {
                destWhere.batchNumber = batchNumber;
            }

            const destStock = await tx.stationaryStock.findFirst({
                where: destWhere,
            });

            let updatedDest;

            if (destStock) {
                // Update existing destination stock
                updatedDest = await tx.stationaryStock.update({
                    where: { id: destStock.id },
                    data: {
                        quantity: destStock.quantity + transferQuantity,
                        totalValue: destStock.unitCost
                            ? (destStock.quantity + transferQuantity) * Number(destStock.unitCost)
                            : null,
                    },
                });
            } else {
                // Create new destination stock
                updatedDest = await tx.stationaryStock.create({
                    data: {
                        itemId: parseInt(itemId),
                        locationId: parseInt(toLocationId),
                        quantity: transferQuantity,
                        unitCost: sourceStock.unitCost,
                        totalValue: sourceStock.unitCost ? transferQuantity * Number(sourceStock.unitCost) : null,
                        batchNumber: batchNumber || null,
                        expiryDate: sourceStock.expiryDate,
                    },
                });
            }

            return { updatedSource, updatedDest };
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryStock',
                entityId: sourceStock.id.toString(),
                details: JSON.stringify({
                    itemCode: sourceStock.item.itemCode,
                    fromLocation: sourceStock.location.code,
                    toLocationId,
                    quantity: transferQuantity,
                    reason,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Stock transferred successfully',
            transfer: {
                itemCode: sourceStock.item.itemCode,
                quantity: transferQuantity,
                fromLocation: sourceStock.location.code,
                toLocationId,
            },
        });
    } catch (error) {
        console.error('Error transferring stock:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
