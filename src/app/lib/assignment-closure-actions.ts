'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { saveFile } from '@/lib/upload';

/**
 * Close an assignment with IT signature
 * Only accessible by Admin/Technician
 */
export async function closeAssignment(data: {
    assignmentId: number;
    signatureData: string;
    notes?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify user is admin/technician
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { userRole: true }
        });

        if (!user || (user.userRole?.name !== 'Admin' && user.userRole?.name !== 'Technician')) {
            return { success: false, error: 'Insufficient permissions' };
        }

        // Get assignment with all related data
        const assignment = await prisma.assignment.findUnique({
            where: { id: data.assignmentId },
            include: {
                borrowTransactions: {
                    include: {
                        items: true
                    }
                },
                returnTransactions: {
                    include: {
                        items: true
                    }
                }
            }
        });

        if (!assignment) {
            return { success: false, error: 'Assignment not found' };
        }

        if (assignment.status === 'Closed') {
            return { success: false, error: 'Assignment is already closed' };
        }

        // Check if all items are returned
        const allBorrowedItems = assignment.borrowTransactions.flatMap(tx => tx.items);
        const returnedItemIds = assignment.returnTransactions.flatMap(tx =>
            tx.items.map(ri => ri.borrowItemId)
        );
        const unreturned = allBorrowedItems.filter(item => !returnedItemIds.includes(item.id));

        if (unreturned.length > 0) {
            return {
                success: false,
                error: `Cannot close assignment: ${unreturned.length} item(s) not yet returned`
            };
        }

        // Save IT signature
        const signaturePath = await saveFile(
            data.signatureData,
            `signatures/closure-${assignment.id}-${Date.now()}.png`
        );

        // Update assignment
        await prisma.assignment.update({
            where: { id: data.assignmentId },
            data: {
                status: 'Closed',
                closedAt: new Date(),
                itClosureSignature: signaturePath,
                closedById: user.id,
                closureNotes: data.notes || null
            }
        });

        revalidatePath(`/dashboard/borrowing/${data.assignmentId}`);
        revalidatePath('/dashboard/borrowing');

        return {
            success: true,
            message: 'Assignment closed successfully'
        };
    } catch (error: any) {
        console.error('[closeAssignment] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to close assignment'
        };
    }
}

/**
 * Reopen a closed assignment (Admin only)
 */
export async function reopenAssignment(assignmentId: number) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { userRole: true }
        });

        if (!user || user.userRole?.name !== 'Admin') {
            return { success: false, error: 'Only admins can reopen assignments' };
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId }
        });

        if (!assignment) {
            return { success: false, error: 'Assignment not found' };
        }

        if (assignment.status !== 'Closed') {
            return { success: false, error: 'Assignment is not closed' };
        }

        await prisma.assignment.update({
            where: { id: assignmentId },
            data: {
                status: 'Active',
                closedAt: null,
                itClosureSignature: null,
                closedById: null,
                closureNotes: null
            }
        });

        revalidatePath(`/dashboard/borrowing/${assignmentId}`);
        revalidatePath('/dashboard/borrowing');

        return { success: true, message: 'Assignment reopened successfully' };
    } catch (error: any) {
        console.error('[reopenAssignment] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to reopen assignment'
        };
    }
}
