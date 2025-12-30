import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch single return
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ returnNo: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { returnNo } = params;

        const returnRecord = await prisma.stationaryReturn.findUnique({
            where: { returnNo },
            include: {
                returnedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, code: true, name: true } },
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

        if (!returnRecord) {
            return NextResponse.json({ error: 'Return not found' }, { status: 404 });
        }

        return NextResponse.json(returnRecord);
    } catch (error) {
        console.error('Error fetching return:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Approve or receive return
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ returnNo: string }> }
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
        const { returnNo } = params;
        const body = await req.json();

        const returnRecord = await prisma.stationaryReturn.findUnique({
            where: { returnNo },
            include: {
                items: true,
            },
        });

        if (!returnRecord) {
            return NextResponse.json({ error: 'Return not found' }, { status: 404 });
        }

        const updateData: any = {};

        // Approve return
        if (body.action === 'approve') {
            const canApprove = await hasPermission(user, 'stationary', 'approve');
            if (!canApprove) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            updateData.approvedById = userId;
            updateData.approvedAt = new Date();
            updateData.status = 'approved';
        }

        // Receive return and add back to stock
        if (body.action === 'receive') {
            const canReceive = await hasPermission(user, 'stationary', 'receive');
            if (!canReceive) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const { locationId } = body;
            if (!locationId) {
                return NextResponse.json(
                    { error: 'Location ID is required for receiving returns' },
                    { status: 400 }
                );
            }

            // Use transaction to add stock back
            await prisma.$transaction(async (tx) => {
                for (const item of returnRecord.items) {
                    const stock = await tx.stationaryStock.findFirst({
                        where: {
                            itemId: item.itemId,
                            locationId: parseInt(locationId),
                        },
                    });

                    if (stock) {
                        await tx.stationaryStock.update({
                            where: { id: stock.id },
                            data: {
                                quantity: stock.quantity + item.quantity,
                                totalValue: stock.unitCost
                                    ? (stock.quantity + item.quantity) * Number(stock.unitCost)
                                    : null,
                            },
                        });
                    } else {
                        // Create new stock record
                        await tx.stationaryStock.create({
                            data: {
                                itemId: item.itemId,
                                locationId: parseInt(locationId),
                                quantity: item.quantity,
                            },
                        });
                    }
                }
            });

            updateData.status = 'completed';
        }

        // Reject return
        if (body.action === 'reject') {
            const canApprove = await hasPermission(user, 'stationary', 'approve');
            if (!canApprove) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            updateData.status = 'rejected';
        }

        const updated = await prisma.stationaryReturn.update({
            where: { returnNo },
            data: updateData,
            include: {
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryReturn',
                entityId: returnRecord.id.toString(),
                details: JSON.stringify({
                    returnNo,
                    action: body.action,
                }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating return:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
