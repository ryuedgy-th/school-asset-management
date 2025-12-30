import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// POST: Approve requisition (L1 or L2)
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
        const { comments } = body;

        const requisition = await prisma.stationaryRequisition.findUnique({
            where: { requisitionNo },
            include: { items: true },
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

        let newStatus = requisition.status;
        let approvalDateField = {};

        if (requisition.status === 'pending_l1') {
            // L1 Approval
            if (requisition.approvedByL2Id) {
                newStatus = 'pending_l2'; // Move to L2 if L2 approver exists
            } else {
                newStatus = 'approved'; // Skip to approved if no L2
            }
            approvalDateField = { approvedByL1At: new Date() };
        } else if (requisition.status === 'pending_l2') {
            // L2 Approval
            newStatus = 'approved';
            approvalDateField = { approvedByL2At: new Date() };
        } else {
            return NextResponse.json(
                { error: 'Requisition is not pending approval' },
                { status: 400 }
            );
        }

        // Update requisition
        const updated = await prisma.stationaryRequisition.update({
            where: { requisitionNo },
            data: {
                status: newStatus,
                ...approvalDateField,
                ...(comments && { comments }),
            },
            include: {
                department: true,
                requestedBy: true,
                approvedByL1: true,
                approvedByL2: true,
                items: { include: { item: true } },
            },
        });

        // Reserve budget if approved
        if (newStatus === 'approved') {
            const budget = await prisma.departmentBudget.findFirst({
                where: {
                    departmentId: requisition.departmentId,
                    fiscalYear: new Date().getFullYear(),
                },
            });

            if (budget) {
                await prisma.departmentBudget.update({
                    where: { id: budget.id },
                    data: {
                        availableAmount: Number(budget.availableAmount) - Number(requisition.totalEstimatedCost),
                    },
                });
            }
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryRequisition',
                entityId: requisition.id.toString(),
                details: JSON.stringify({
                    requisitionNo,
                    action: 'approved',
                    level: requisition.status === 'pending_l1' ? 'L1' : 'L2',
                    newStatus,
                }),
            },
        });

        return NextResponse.json({
            success: true,
            message: `Requisition approved at ${requisition.status === 'pending_l1' ? 'Level 1' : 'Level 2'}`,
            requisition: updated,
        });
    } catch (error) {
        console.error('Error approving requisition:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
