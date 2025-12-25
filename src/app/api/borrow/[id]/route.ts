import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin/Technician can update status
        const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) } });
        if (user?.role !== 'Admin' && user?.role !== 'Technician') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status } = body; // Approved, Rejected, Returned

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const requestId = parseInt(params.id);
        const borrowRequest = await prisma.borrowRequest.findUnique({
            where: { id: requestId },
            include: { asset: true },
        });

        if (!borrowRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // Transactional update
        const result = await prisma.$transaction(async (tx) => {
            // 1. Approve Logic
            if (status === 'Approved' && borrowRequest.status !== 'Approved') {
                if (borrowRequest.asset.status !== 'Available' && borrowRequest.asset.currentStock <= 0) {
                    throw new Error('Asset is not available for approval (Out of stock or Status unavailable)');
                }

                // Decrement stock
                await tx.asset.update({
                    where: { id: borrowRequest.assetId },
                    data: {
                        currentStock: { decrement: 1 },
                        // If stock hits 0, make it Borrowed (or unavailable).
                        // If it's a unique item (totalStock=1), status becomes 'Borrowed'.
                        // If bulk, status might stay 'Available' if stock > 0, but if stock=0 it becomes 'Borrowed' (or 'Out of Stock')
                        // Let's use 'Borrowed' if stock becomes 0.
                        status: (borrowRequest.asset.currentStock - 1) <= 0 ? 'Borrowed' : borrowRequest.asset.status
                    }
                });
            }

            // 2. Return Logic
            if (status === 'Returned' && borrowRequest.status === 'Approved') {
                await tx.asset.update({
                    where: { id: borrowRequest.assetId },
                    data: {
                        currentStock: { increment: 1 },
                        status: 'Available' // Back to available
                    }
                });
            }

            // 3. Reject Logic (No stock change, just status)

            // Update Request
            return await tx.borrowRequest.update({
                where: { id: requestId },
                data: { status }
            });
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error updating borrow request:', error);
        return NextResponse.json({ error: error.message || 'Failed to update request' }, { status: 500 });
    }
}
