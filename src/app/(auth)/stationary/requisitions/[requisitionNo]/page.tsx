import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import StationaryRequisitionDetailClient from './StationaryRequisitionDetailClient';

export default async function StationaryRequisitionDetailPage({
    params,
}: {
    params: Promise<{ requisitionNo: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const userId = parseInt(session.user.id);
    const canView = await hasPermission({ id: userId }, 'stationary', 'view');
    if (!canView) {
        redirect('/');
    }

    const { requisitionNo } = await params;

    // Fetch requisition with all related data
    const requisition = await prisma.stationaryRequisition.findUnique({
        where: { requisitionNo },
        include: {
            requestedBy: {
                select: { id: true, name: true, email: true },
            },
            requestedForUser: {
                select: { id: true, name: true, email: true },
            },
            department: {
                select: { id: true, code: true, name: true },
            },
            approvedByL1: {
                select: { id: true, name: true, email: true },
            },
            approvedByL2: {
                select: { id: true, name: true, email: true },
            },
            rejectedBy: {
                select: { id: true, name: true, email: true },
            },
            issuedBy: {
                select: { id: true, name: true, email: true },
            },
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
        notFound();
    }

    // Convert Decimal to number for Client Component
    const requisitionData = {
        ...requisition,
        totalEstimatedCost: requisition.totalEstimatedCost ? Number(requisition.totalEstimatedCost) : null,
        totalActualCost: requisition.totalActualCost ? Number(requisition.totalActualCost) : null,
        items: requisition.items.map(item => ({
            ...item,
            estimatedUnitCost: item.estimatedUnitCost ? Number(item.estimatedUnitCost) : null,
            estimatedTotal: item.estimatedTotal ? Number(item.estimatedTotal) : null,
            item: {
                ...item.item,
                unitCost: item.item.unitCost ? Number(item.item.unitCost) : null,
            },
        })),
    };

    // Get user details for permission checks
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            departmentId: true,
            roleId: true,
        },
    });

    // Check permissions
    const canApprove = await hasPermission({ id: userId }, 'stationary', 'approve');
    const canEdit = await hasPermission({ id: userId }, 'stationary', 'edit');
    const canDelete = await hasPermission({ id: userId }, 'stationary', 'delete');

    // Determine if user can approve this specific requisition
    const canApproveL1 = canApprove &&
        requisition.status === 'pending' &&
        user?.departmentId === requisition.departmentId &&
        requisition.requestedById !== userId;

    const canApproveL2 = canApprove &&
        requisition.status === 'approved_l1';

    const canReject = canApprove &&
        (requisition.status === 'pending' || requisition.status === 'approved_l1');

    const isOwner = requisition.requestedById === userId;
    const canEditReq = (canEdit || isOwner) && requisition.status === 'draft';
    const canDeleteReq = (canDelete || isOwner) && requisition.status === 'draft';

    return (
        <StationaryRequisitionDetailClient
            requisition={requisitionData}
            canApproveL1={canApproveL1}
            canApproveL2={canApproveL2}
            canReject={canReject}
            canEdit={canEditReq}
            canDelete={canDeleteReq}
            isOwner={isOwner}
            currentUserId={userId}
        />
    );
}
