'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/logger';

/**
 * Confirm signature for a borrow transaction
 * This changes asset status from Reserved → Borrowed
 */
export async function confirmBorrowSignature(data: {
    transactionId: number;
    signaturePath: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get transaction with items
        const transaction = await prisma.borrowTransaction.findUnique({
            where: { id: data.transactionId },
            include: {
                items: {
                    include: {
                        asset: true
                    }
                },
                assignment: true
            }
        });

        if (!transaction) {
            return { success: false, error: 'Transaction not found' };
        }

        if (transaction.isSigned) {
            return { success: false, error: 'Transaction already signed' };
        }

        // Update transaction and assets in a single transaction
        await prisma.$transaction(async (tx) => {
            // 1. Update transaction as signed
            await tx.borrowTransaction.update({
                where: { id: data.transactionId },
                data: {
                    isSigned: true,
                    signedAt: new Date(),
                    borrowerSignature: data.signaturePath
                }
            });

            // 2. Update all Reserved assets to Borrowed
            for (const item of transaction.items) {
                const asset = item.asset;

                // Only update unique items (totalStock = 1) from Reserved to Borrowed
                if (asset.totalStock === 1 && asset.status === 'Reserved') {
                    await tx.asset.update({
                        where: { id: asset.id },
                        data: { status: 'Borrowed' }
                    });
                }
            }
        });

        await logAudit(
            'SIGN_TRANSACTION',
            'BorrowTransaction',
            data.transactionId,
            `Signed transaction ${transaction.transactionNumber}`,
            Number(session.user.id)
        );

        revalidatePath('/assignments');
        revalidatePath(`/assignments/${transaction.assignmentId}`);

        return {
            success: true,
            message: 'Transaction signed successfully'
        };
    } catch (error: any) {
        console.error('[confirmBorrowSignature] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to confirm signature'
        };
    }
}
