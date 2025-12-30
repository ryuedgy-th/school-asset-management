import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch single requisition
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ requisitionNo: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { requisitionNo } = params;

        const requisition = await prisma.stationaryRequisition.findUnique({
            where: { requisitionNo },
            include: {
                department: { select: { id: true, code: true, name: true } },
                requestedBy: { select: { id: true, name: true, email: true } },
                approvedByL1: { select: { id: true, name: true, email: true } },
                approvedByL2: { select: { id: true, name: true, email: true } },
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

        if (!requisition) {
            return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
        }

        return NextResponse.json(requisition);
    } catch (error) {
        console.error('Error fetching requisition:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update requisition (draft only)
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ requisitionNo: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const params = await context.params;
        const { requisitionNo } = params;
        const body = await req.json();

        // Check if requisition exists and is in draft status
        const existing = await prisma.stationaryRequisition.findUnique({
            where: { requisitionNo },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
        }

        if (existing.status !== 'draft') {
            return NextResponse.json(
                { error: 'Only draft requisitions can be edited' },
                { status: 400 }
            );
        }

        // Only allow requester to edit their own draft
        if (existing.requestedById !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updateData: any = {};
        if (body.purpose) updateData.purpose = body.purpose;
        if (body.urgency) updateData.urgency = body.urgency;
        if (body.comments !== undefined) updateData.comments = body.comments;

        const requisition = await prisma.stationaryRequisition.update({
            where: { requisitionNo },
            data: updateData,
            include: {
                department: true,
                requestedBy: true,
                items: { include: { item: true } },
            },
        });

        return NextResponse.json(requisition);
    } catch (error) {
        console.error('Error updating requisition:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Cancel requisition
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ requisitionNo: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const params = await context.params;
        const { requisitionNo } = params;

        const requisition = await prisma.stationaryRequisition.findUnique({
            where: { requisitionNo },
        });

        if (!requisition) {
            return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
        }

        // Only allow requester to cancel their own requisition if not yet approved
        if (requisition.requestedById !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (['approved', 'issued', 'completed', 'cancelled'].includes(requisition.status)) {
            return NextResponse.json(
                { error: 'Cannot cancel requisition in current status' },
                { status: 400 }
            );
        }

        await prisma.stationaryRequisition.update({
            where: { requisitionNo },
            data: { status: 'cancelled' },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE',
                entity: 'StationaryRequisition',
                entityId: requisition.id.toString(),
                details: JSON.stringify({ requisitionNo }),
            },
        });

        return NextResponse.json({ message: 'Requisition cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling requisition:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
