import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch single purchase order
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ poNumber: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { poNumber } = params;

        const purchaseOrder = await prisma.stationaryPurchaseOrder.findUnique({
            where: { poNumber },
            include: {
                vendor: {
                    select: {
                        id: true,
                        vendorCode: true,
                        name: true,
                        contactPerson: true,
                        phone: true,
                        email: true,
                        address: true,
                        paymentTerms: true,
                    },
                },
                createdBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                receivedBy: { select: { id: true, name: true, email: true } },
                items: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                itemCode: true,
                                name: true,
                                uom: true,
                                unitCost: true,
                            },
                        },
                    },
                },
            },
        });

        if (!purchaseOrder) {
            return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
        }

        return NextResponse.json(purchaseOrder);
    } catch (error) {
        console.error('Error fetching purchase order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update purchase order or change status
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ poNumber: string }> }
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

        const params = await context.params;
        const { poNumber } = params;
        const body = await req.json();

        const purchaseOrder = await prisma.stationaryPurchaseOrder.findUnique({
            where: { poNumber },
            include: { items: true },
        });

        if (!purchaseOrder) {
            return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
        }

        const updateData: any = {};

        // Submit for approval
        if (body.action === 'submit') {
            if (purchaseOrder.status !== 'draft') {
                return NextResponse.json(
                    { error: 'Only draft POs can be submitted' },
                    { status: 400 }
                );
            }
            updateData.status = 'submitted';
        }

        // Approve PO
        if (body.action === 'approve') {
            const canApprove = await hasPermission(user, 'stationary', 'approve');
            if (!canApprove) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            updateData.approvedById = userId;
            updateData.approvedAt = new Date();
            updateData.status = 'approved';
        }

        // Send order to vendor
        if (body.action === 'send') {
            if (purchaseOrder.status !== 'approved') {
                return NextResponse.json(
                    { error: 'Only approved POs can be sent' },
                    { status: 400 }
                );
            }
            updateData.status = 'ordered';
        }

        // Receive items
        if (body.action === 'receive') {
            const canReceive = await hasPermission(user, 'stationary', 'receive');
            if (!canReceive) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const { locationId, receivedItems } = body;

            if (!locationId || !receivedItems) {
                return NextResponse.json(
                    { error: 'Location and received items are required' },
                    { status: 400 }
                );
            }

            // Use transaction to add stock
            await prisma.$transaction(async (tx) => {
                for (const receivedItem of receivedItems) {
                    const poItem = purchaseOrder.items.find(i => i.itemId === parseInt(receivedItem.itemId));
                    if (!poItem) continue;

                    const quantity = parseInt(receivedItem.quantity);

                    // Update PO item received quantity
                    await tx.stationaryPurchaseOrderItem.update({
                        where: { id: poItem.id },
                        data: {
                            quantityReceived: (poItem.quantityReceived || 0) + quantity,
                        },
                    });

                    // Add to stock
                    const stock = await tx.stationaryStock.findFirst({
                        where: {
                            itemId: parseInt(receivedItem.itemId),
                            locationId: parseInt(locationId),
                        },
                    });

                    if (stock) {
                        await tx.stationaryStock.update({
                            where: { id: stock.id },
                            data: {
                                quantity: stock.quantity + quantity,
                                unitCost: poItem.unitPrice,
                                totalValue: (stock.quantity + quantity) * Number(poItem.unitPrice),
                            },
                        });
                    } else {
                        await tx.stationaryStock.create({
                            data: {
                                itemId: parseInt(receivedItem.itemId),
                                locationId: parseInt(locationId),
                                quantity,
                                unitCost: poItem.unitPrice,
                                totalValue: quantity * Number(poItem.unitPrice),
                            },
                        });
                    }
                }
            });

            // Check if all items received
            const updatedPO = await prisma.stationaryPurchaseOrder.findUnique({
                where: { poNumber },
                include: { items: true },
            });

            const allReceived = updatedPO!.items.every(
                item => (item.quantityReceived || 0) >= item.quantityOrdered
            );

            updateData.receivedById = userId;
            updateData.receivedAt = new Date();
            updateData.status = allReceived ? 'received' : 'partially_received';
        }

        // Cancel PO
        if (body.action === 'cancel') {
            if (!['draft', 'submitted'].includes(purchaseOrder.status)) {
                return NextResponse.json(
                    { error: 'Cannot cancel PO in current status' },
                    { status: 400 }
                );
            }
            updateData.status = 'cancelled';
        }

        // Update general fields
        if (body.expectedDelivery !== undefined) {
            updateData.expectedDelivery = body.expectedDelivery ? new Date(body.expectedDelivery) : null;
        }
        if (body.notes !== undefined) {
            updateData.notes = body.notes;
        }
        if (body.termsConditions !== undefined) {
            updateData.termsConditions = body.termsConditions;
        }

        const updated = await prisma.stationaryPurchaseOrder.update({
            where: { poNumber },
            data: updateData,
            include: {
                vendor: true,
                createdBy: true,
                approvedBy: true,
                receivedBy: true,
                items: { include: { item: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryPurchaseOrder',
                entityId: purchaseOrder.id.toString(),
                details: JSON.stringify({
                    poNumber,
                    action: body.action || 'update',
                }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating purchase order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
