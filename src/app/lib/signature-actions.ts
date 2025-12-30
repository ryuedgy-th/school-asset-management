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

            // 2. Update all Reserved assets and BorrowItems to Borrowed
            for (const item of transaction.items) {
                const asset = item.asset;

                // Only update unique items (totalStock = 1) from Reserved to Borrowed
                if (asset.totalStock === 1 && asset.status === 'Reserved') {
                    // Update Asset status
                    await tx.asset.update({
                        where: { id: asset.id },
                        data: { status: 'Borrowed' }
                    });

                    // Update BorrowItem status to match (Reserved → Borrowed)
                    await tx.borrowItem.update({
                        where: { id: item.id },
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
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[confirmBorrowSignature] Error:', error);
        return {
            success: false,
            error: message || 'Failed to confirm signature'
        };
    }
}

/**
 * Verify assignment token for public signature page
 */
export async function verifyAssignmentToken(token: string) {
    try {
        const assignment = await prisma.assignment.findFirst({
            where: {
                signatureToken: token,
                signatureTokenExpiry: {
                    gt: new Date()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        userDepartment: true
                    }
                },
                borrowTransactions: {
                    include: {
                        items: {
                            include: {
                                asset: true
                            }
                        }
                    }
                }
            }
        });

        if (!assignment) {
            return { success: false, error: 'Invalid or expired token' };
        }

        return {
            success: true,
            data: {
                id: assignment.id,
                assignmentNumber: assignment.assignmentNumber,
                teacherName: assignment.user.name || 'Unknown',
                teacherEmail: assignment.user.email || 'no-email@example.com',
                department: assignment.user.userDepartment?.name || 'Unknown',
                createdAt: assignment.createdAt,
                items: assignment.borrowTransactions.flatMap(transaction =>
                    transaction.items.map(item => ({
                        id: item.id,
                        assetTag: item.asset.assetCode,
                        name: item.asset.name,
                        category: item.asset.category,
                        serialNumber: item.asset.serialNumber
                    }))
                )
            }
        };
    } catch (error: any) {
        console.error('[verifyAssignmentToken] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to verify token'
        };
    }
}

/**
 * Sign public assignment (from public link)
 */
export async function signPublicAssignment(data: {
    token: string;
    signatureData: string;
}) {
    try {
        // Verify token first
        const assignment = await prisma.assignment.findFirst({
            where: {
                signatureToken: data.token,
                signatureTokenExpiry: {
                    gt: new Date()
                }
            },
            include: {
                borrowTransactions: {
                    include: {
                        items: {
                            include: {
                                asset: true
                            }
                        }
                    }
                }
            }
        });

        if (!assignment) {
            return { success: false, error: 'Invalid or expired token' };
        }

        if (assignment.signedPdfPath) {
            return { success: false, error: 'Assignment already signed' };
        }

        // Save signature (in real implementation, save to file system)
        const signaturePath = `/signatures/assignment-${assignment.id}-${Date.now()}.png`;

        // Update assignment
        await prisma.assignment.update({
            where: { id: assignment.id },
            data: {
                signedPdfPath: signaturePath,
                signatureToken: null, // Invalidate token
                signatureTokenExpiry: null
            }
        });

        // Update assets to Borrowed status
        const allItems = assignment.borrowTransactions.flatMap(t => t.items);
        for (const item of allItems) {
            if (item.asset.totalStock === 1 && item.asset.status === 'Reserved') {
                await prisma.asset.update({
                    where: { id: item.asset.id },
                    data: { status: 'Borrowed' }
                });
            }
        }

        await logAudit(
            'SIGN_ASSIGNMENT',
            'Assignment',
            assignment.id,
            `Signed assignment ${assignment.assignmentNumber} via public link`,
            assignment.userId
        );

        revalidatePath('/assignments');

        return {
            success: true,
            message: 'Assignment signed successfully'
        };
    } catch (error: any) {
        console.error('[signPublicAssignment] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sign assignment'
        };
    }
}
