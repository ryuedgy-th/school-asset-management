import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import StationaryPurchaseOrderDetailClient from './StationaryPurchaseOrderDetailClient';

export default async function StationaryPurchaseOrderDetailPage({
    params,
}: {
    params: Promise<{ poNumber: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const userId = parseInt(session.user.id);
    const canView = await hasPermission({ id: userId }, 'stationary', 'view');
    if (!canView) {
        redirect('/');
    }

    const { poNumber } = await params;

    // Fetch PO with all related data
    const purchaseOrder = await prisma.stationaryPurchaseOrder.findUnique({
        where: { poNumber },
        include: {
            vendor: true,
            createdBy: {
                select: { id: true, name: true, email: true },
            },
            approvedBy: {
                select: { id: true, name: true, email: true },
            },
            receivedBy: {
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
                        },
                    },
                },
            },
        },
    });

    if (!purchaseOrder) {
        notFound();
    }

    // Convert Decimal to number for Client Component
    const poData = {
        ...purchaseOrder,
        subtotal: Number(purchaseOrder.subtotal),
        tax: purchaseOrder.tax ? Number(purchaseOrder.tax) : null,
        shippingCost: purchaseOrder.shippingCost ? Number(purchaseOrder.shippingCost) : null,
        totalAmount: Number(purchaseOrder.totalAmount),
        items: purchaseOrder.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
        })),
    };

    // Check permissions
    const canApprove = await hasPermission({ id: userId }, 'stationary', 'approve');
    const canReceive = await hasPermission({ id: userId }, 'stationary', 'receive');
    const isCreator = purchaseOrder.createdById === userId;

    return (
        <StationaryPurchaseOrderDetailClient
            purchaseOrder={poData}
            canApprove={canApprove && purchaseOrder.status === 'submitted'}
            canReceive={canReceive && (purchaseOrder.status === 'approved' || purchaseOrder.status === 'ordered')}
            canEdit={isCreator && (purchaseOrder.status === 'draft' || purchaseOrder.status === 'submitted')}
            isCreator={isCreator}
            currentUserId={userId}
        />
    );
}
