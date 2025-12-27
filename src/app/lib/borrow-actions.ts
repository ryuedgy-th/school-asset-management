'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/logger';
import { auth } from '@/auth';

// --- Assignments ---

export async function createAssignment(data: {
    userId: number;
    academicYear: string;
    semester: number;
    signaturePath?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Generate Assignment Number e.g. AS-2024-001
    // Simple logic: Count existing for year and increment
    const count = await prisma.assignment.count({
        where: { academicYear: data.academicYear }
    });
    const seq = (count + 1).toString().padStart(4, '0');
    const assignmentNumber = `AS-${data.academicYear}-${seq}`;

    const assignment = await prisma.assignment.create({
        data: {
            assignmentNumber,
            userId: data.userId,
            academicYear: data.academicYear,
            semester: data.semester,
            status: 'Active'
        }
    });

    await logAudit(
        'CREATE_ASSIGNMENT',
        'Assignment',
        assignment.id,
        `Created assignment ${assignmentNumber} for user ${data.userId}`,
        Number(session.user.id)
    );

    revalidatePath('/assignments');
    return assignment;
}

export async function closeAssignment(id: number, signaturePath?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Verify all items are returned? Or just force close?
    // Usually we check if there are outstanding items.
    // For now, allow close, but maybe warn.

    const assignment = await prisma.assignment.update({
        where: { id },
        data: {
            status: 'Closed',
            closedAt: new Date(),
            itClosureSignature: signaturePath,
            closedById: Number(session.user.id)
        }
    });

    await logAudit(
        'CLOSE_ASSIGNMENT',
        'Assignment',
        id,
        `Closed assignment ${assignment.assignmentNumber}`,
        Number(session.user.id)
    );

    revalidatePath('/assignments');
    return assignment;
}

export async function deleteAssignment(id: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Permission Check: Only Admin/Technician
    const userRole = await prisma.user.findUnique({
        where: { id: Number(session.user.id) },
        include: { userRole: true }
    });
    if (!userRole || (userRole.userRole?.name !== 'Admin' && userRole.userRole?.name !== 'Technician')) {
        throw new Error('Insufficient permissions');
    }

    // Validation: Check if it has items
    const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: { borrowTransactions: { include: { items: true } } }
    });

    if (!assignment) throw new Error('Assignment not found');

    // Count only items that are still borrowed (not returned)
    const unreturnedItems = assignment.borrowTransactions.reduce((acc, tx) => {
        const borrowedItems = tx.items.filter(item => item.status === 'Borrowed');
        return acc + borrowedItems.length;
    }, 0);

    if (unreturnedItems > 0) {
        throw new Error('Cannot delete assignment with unreturned items. Please return all items first.');
    }

    // Manual cascade delete to avoid foreign key constraint errors
    // Delete in correct order: ReturnItems -> ReturnTransactions -> BorrowItems -> BorrowTransactions -> Assignment

    // 1. Delete return items
    await prisma.returnItem.deleteMany({
        where: {
            returnTransaction: {
                assignmentId: id
            }
        }
    });

    // 2. Delete return transactions
    await prisma.returnTransaction.deleteMany({
        where: { assignmentId: id }
    });

    // 3. Delete borrow items
    await prisma.borrowItem.deleteMany({
        where: {
            borrowTransaction: {
                assignmentId: id
            }
        }
    });

    // 4. Delete borrow transactions
    await prisma.borrowTransaction.deleteMany({
        where: { assignmentId: id }
    });

    // 5. Finally delete assignment
    await prisma.assignment.delete({ where: { id } });

    await logAudit(
        'DELETE_ASSIGNMENT',
        'Assignment',
        id,
        `Deleted assignment ${assignment.assignmentNumber}`,
        Number(session.user.id)
    );

    revalidatePath('/assignments');
    return { success: true };
}

// --- Borrowing ---

interface BorrowItemInput {
    assetId: number;
    quantity: number;
}

export async function createBorrowTransaction(data: {
    assignmentId: number;
    items: BorrowItemInput[];
    signaturePath?: string;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const staffId = Number(session.user.id);

    // Generate Transaction Number TR-YYYY-SEQ
    const year = new Date().getFullYear();
    const count = await prisma.borrowTransaction.count({
        where: {
            borrowDate: {
                gte: new Date(year, 0, 1),
                lt: new Date(year + 1, 0, 1)
            }
        }
    });
    const seq = (count + 1).toString().padStart(5, '0');
    const transactionNumber = `TR-${year}-${seq}`;

    // Transactional creation
    return await prisma.$transaction(async (tx) => {
        // 1. Create Transaction
        const transaction = await tx.borrowTransaction.create({
            data: {
                assignmentId: data.assignmentId,
                transactionNumber,
                createdById: staffId,
                borrowerSignature: data.signaturePath,
                notes: data.notes
            }
        });

        // 2. Process Items
        for (const item of data.items) {
            const asset = await tx.asset.findUnique({ where: { id: item.assetId } });
            if (!asset) throw new Error(`Asset ${item.assetId} not found`);

            if (asset.currentStock < item.quantity) {
                throw new Error(`Insufficient stock for ${asset.name}`);
            }

            // Fetch latest inspection for this asset
            const latestInspection = await tx.inspection.findFirst({
                where: { assetId: item.assetId },
                orderBy: { inspectionDate: 'desc' }
            });

            // Create BorrowItem with inspection
            await tx.borrowItem.create({
                data: {
                    borrowTransactionId: transaction.id,
                    assetId: item.assetId,
                    quantity: item.quantity,
                    status: 'Borrowed',
                    checkoutInspectionId: latestInspection?.id
                }
            });

            // Update Asset Stock/Status
            // For unique items (stock=1), set status to Reserved (pending signature)
            // For bulk items, just decrement stock.
            // Reserved status indicates the asset is allocated but not yet confirmed

            let newStatus = asset.status;
            if (asset.totalStock === 1 && item.quantity === 1) {
                newStatus = 'Reserved'; // Changed from 'Borrowed' - will change to 'Borrowed' after signature
            }

            await tx.asset.update({
                where: { id: item.assetId },
                data: {
                    currentStock: { decrement: item.quantity },
                    status: newStatus
                }
            });
        }

        await logAudit(
            'CREATE_BORROW',
            'BorrowTransaction',
            transaction.id,
            `Created transaction ${transactionNumber} with ${data.items.length} items`,
            staffId
        );

        return transaction;
    });
}

// --- Returning ---

interface ReturnItemInput {
    borrowItemId: number;
    condition: 'Good' | 'Damaged' | 'Lost';
    damageNotes?: string;
    damageCharge?: number;
    quantity: number; // in case partial return of bulk item
}

export async function createReturnTransaction(data: {
    assignmentId: number;
    items: ReturnItemInput[];
    signaturePath?: string;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const staffId = Number(session.user.id);

    return await prisma.$transaction(async (tx) => {
        // 1. Create Return Transaction
        const transaction = await tx.returnTransaction.create({
            data: {
                assignmentId: data.assignmentId,
                checkedById: staffId,
                checkerSignature: data.signaturePath,
                notes: data.notes
            }
        });

        // 2. Process Return Items
        for (const item of data.items) {
            const borrowItem = await tx.borrowItem.findUnique({
                where: { id: item.borrowItemId },
                include: { asset: true }
            });
            if (!borrowItem) throw new Error(`BorrowItem ${item.borrowItemId} not found`);

            // Create ReturnItem
            await tx.returnItem.create({
                data: {
                    returnTransactionId: transaction.id,
                    borrowItemId: item.borrowItemId,
                    condition: item.condition,
                    damageNotes: item.damageNotes,
                    damageCharge: item.damageCharge,
                    quantity: item.quantity
                }
            });

            // Update BorrowItem status
            // If full return, set to Returned.
            // Simplified: Assume full return for now or handle quantity logic later.
            // For now, set to Returned.
            await tx.borrowItem.update({
                where: { id: item.borrowItemId },
                data: { status: 'Returned' }
            });

            // Update Asset Stock/Status
            const asset = borrowItem.asset;
            let newStatus = asset.status;

            if (item.condition === 'Good') {
                // If unique item returned good, Available.
                // If bulk, just increment.
                if (asset.totalStock === 1) {
                    newStatus = 'Available';
                }
            } else if (item.condition === 'Damaged') {
                newStatus = 'Maintenance'; // Or Broken
            } else if (item.condition === 'Lost') {
                newStatus = 'Lost';
            }

            // Increment stock if Good or Damaged (physically returned)
            // If Lost, do not increment stock? Or increment but status is Lost?
            // Usually stock = available physical count.
            // If Lost, it's gone.

            if (item.condition !== 'Lost') {
                await tx.asset.update({
                    where: { id: asset.id },
                    data: {
                        currentStock: { increment: item.quantity },
                        status: newStatus === 'Borrowed' ? 'Available' : newStatus // Reset Borrowed to Available/Maint
                    }
                });
            } else {
                // If lost, we might need to decrement totalStock or keep it but status Lost?
                // For now, just update status.
                await tx.asset.update({
                    where: { id: asset.id },
                    data: {
                        status: 'Lost'
                    }
                });
            }
        }

        // 3. Auto-close assignment if all items returned?
        // Logic: Check if any BorrowItems in this assignment are still "Borrowed".
        // This is complex, maybe leave for manual close or separate check.

        await logAudit(
            'CREATE_RETURN',
            'ReturnTransaction',
            transaction.id,
            `Processed return for ${data.items.length} items`,
            staffId
        );

        return transaction;
    });
}

export async function searchAvailableAssets(query: string) {
    if (!query) return [];

    // Check Auth
    const session = await auth();
    if (!session) return [];

    // Search for assets, excluding Reserved, Borrowed, and unavailable statuses
    return await prisma.asset.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { name: { contains: query } },
                        { assetCode: { contains: query } }
                    ]
                },
                {
                    status: {
                        notIn: ['Reserved', 'Borrowed', 'Maintenance', 'Broken', 'Lost', 'Retired']
                    }
                },
                {
                    currentStock: { gt: 0 }
                }
            ]
        },
        take: 10,
        select: {
            id: true,
            name: true,
            assetCode: true,
            status: true,
            currentStock: true
        }
    });
}

export async function getAllAvailableAssets() {
    const session = await auth();
    if (!session) return [];

    return await prisma.asset.findMany({
        select: {
            id: true,
            name: true,
            assetCode: true,
            category: true,
            status: true,
            currentStock: true,
            brand: true,
            model: true,
            image: true
        },
        orderBy: { name: 'asc' }
    });
}

/**
 * Delete a borrow transaction (only if not signed)
 */
export async function deleteBorrowTransaction(transactionId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Check if transaction exists and is not signed
        const transaction = await prisma.borrowTransaction.findUnique({
            where: { id: transactionId },
            select: {
                id: true,
                isSigned: true,
                transactionNumber: true,
                assignmentId: true
            }
        });

        if (!transaction) {
            return { success: false, error: 'Transaction not found' };
        }

        if (transaction.isSigned) {
            return { success: false, error: 'Cannot delete signed transaction' };
        }

        // Delete in transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Get all items to restore asset status and stock
            const items = await tx.borrowItem.findMany({
                where: { borrowTransactionId: transactionId },
                select: { assetId: true, quantity: true }
            });

            // Restore asset status and stock
            for (const item of items) {
                // Determine if we should set status to Available. 
                // For unique items (totalStock=1), yes.
                // For bulk items, always Available unless total stock was 0? 
                // Simplest logic: If we increment stock, it effectively becomes available.
                // But specifically for unique items that were "Borrowed", we must flip back to "Available".

                // Let's check the asset first to see if it's unique
                const asset = await tx.asset.findUnique({
                    where: { id: item.assetId },
                    select: { totalStock: true }
                });

                const dataToUpdate: any = {
                    currentStock: { increment: item.quantity }
                };

                // If asset was Reserved or Borrowed (unique item), set back to Available
                if (asset && asset.totalStock === 1) {
                    dataToUpdate.status = 'Available';
                }

                await tx.asset.update({
                    where: { id: item.assetId },
                    data: dataToUpdate
                });
            }

            // Delete all BorrowItems (due to foreign key)
            await tx.borrowItem.deleteMany({
                where: { borrowTransactionId: transactionId }
            });

            // Delete the transaction
            await tx.borrowTransaction.delete({
                where: { id: transactionId }
            });
        });

        await logAudit(
            'DELETE_TRANSACTION',
            'BorrowTransaction',
            transactionId,
            `Deleted transaction ${transaction.transactionNumber}`,
            Number(session.user.id)
        );

        revalidatePath('/assignments');
        revalidatePath(`/assignments/${transaction.assignmentId}`);

        return {
            success: true,
            message: `Transaction ${transaction.transactionNumber} deleted successfully`
        };
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return { success: false, error: 'Failed to delete transaction' };
    }
}
