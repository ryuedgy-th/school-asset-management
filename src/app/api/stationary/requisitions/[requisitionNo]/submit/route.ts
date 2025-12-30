import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST: Submit requisition for approval
export async function POST(
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

        const { approvedByL1Id, approvedByL2Id } = body;

        // Validate approvers
        if (!approvedByL1Id) {
            return NextResponse.json(
                { error: 'Level 1 approver is required' },
                { status: 400 }
            );
        }

        const requisition = await prisma.stationaryRequisition.findUnique({
            where: { requisitionNo },
            include: { items: true },
        });

        if (!requisition) {
            return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
        }

        if (requisition.requestedById !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (requisition.status !== 'draft') {
            return NextResponse.json(
                { error: 'Only draft requisitions can be submitted' },
                { status: 400 }
            );
        }

        if (requisition.items.length === 0) {
            return NextResponse.json(
                { error: 'Cannot submit requisition with no items' },
                { status: 400 }
            );
        }

        // Update requisition status
        const updated = await prisma.stationaryRequisition.update({
            where: { requisitionNo },
            data: {
                status: 'pending_l1',
                approvedByL1Id: parseInt(approvedByL1Id),
                approvedByL2Id: approvedByL2Id ? parseInt(approvedByL2Id) : null,
            },
            include: {
                department: true,
                requestedBy: true,
                approvedByL1: true,
                approvedByL2: true,
                items: { include: { item: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryRequisition',
                entityId: requisition.id.toString(),
                details: JSON.stringify({
                    requisitionNo,
                    action: 'submitted',
                    approvedByL1Id,
                    approvedByL2Id,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Requisition submitted for approval',
            requisition: updated,
        });
    } catch (error) {
        console.error('Error submitting requisition:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
