import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// POST: Reject requisition
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
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRole: true, userDepartment: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const params = await context.params;
        const { requisitionNo } = params;
        const body = await req.json();
        const { reason } = body;

        if (!reason) {
            return NextResponse.json(
                { error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        const requisition = await prisma.stationaryRequisition.findUnique({
            where: { requisitionNo },
        });

        if (!requisition) {
            return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
        }

        // Check if user is the assigned approver
        const isL1Approver = requisition.approvedByL1Id === userId && requisition.status === 'pending_l1';
        const isL2Approver = requisition.approvedByL2Id === userId && requisition.status === 'pending_l2';

        if (!isL1Approver && !isL2Approver) {
            // Check if user has general approve permission
            const canApprove = await hasPermission(user, 'stationary', 'approve');
            if (!canApprove) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        if (!['pending_l1', 'pending_l2'].includes(requisition.status)) {
            return NextResponse.json(
                { error: 'Requisition is not pending approval' },
                { status: 400 }
            );
        }

        // Update requisition
        const updated = await prisma.stationaryRequisition.update({
            where: { requisitionNo },
            data: {
                status: 'rejected',
                rejectedById: userId,
                rejectedAt: new Date(),
                rejectionReason: reason,
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
                    action: 'rejected',
                    reason,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Requisition rejected',
            requisition: updated,
        });
    } catch (error) {
        console.error('Error rejecting requisition:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
