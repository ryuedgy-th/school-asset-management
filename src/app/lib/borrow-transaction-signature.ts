'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/upload';
import crypto from 'crypto';
import { sendSignatureRequest } from '@/lib/email';

/**
 * Generate signature token for a borrow transaction
 * Used when adding assets to existing assignment
 */
export async function generateBorrowTransactionToken(
    transactionId: number,
    sendEmail: boolean = false
) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('Unauthorized');
    }

    // Get current user with role
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { userRole: true }
    });

    if (!currentUser) {
        throw new Error('User not found');
    }

    // Get transaction with assignment
    const transaction = await prisma.borrowTransaction.findUnique({
        where: { id: transactionId },
        include: {
            assignment: { include: { user: true } },
            items: { include: { asset: true } }
        }
    });

    if (!transaction) {
        throw new Error('Transaction not found');
    }

    // Check permissions:
    // - Admin/Technician can generate for any transaction
    // - Regular user can only generate for their own assignments
    const isAdmin = ['Admin', 'Technician'].includes(currentUser.userRole?.name || '');
    const isOwner = transaction.assignment.userId === currentUser.id;

    if (!isAdmin && !isOwner) {
        throw new Error('Insufficient permissions - you can only sign your own assignments');
    }

    if (transaction.isSigned) {
        return {
            success: false,
            error: 'This transaction has already been signed'
        };
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    await prisma.borrowTransaction.update({
        where: { id: transactionId },
        data: {
            signatureToken: token,
            signatureTokenExpiry: expiry,
            isSigned: false
        }
    });

    const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign/transaction/${token}`;

    let emailResult = null;
    if (sendEmail && transaction.assignment.user.email) {
        // Use existing email function for now
        emailResult = await sendSignatureRequest(
            transaction.assignment.user.email,
            transaction.assignment.user.name || 'User',
            signatureUrl
        );
    }

    return {
        success: true,
        token,
        url: signatureUrl,
        transactionNumber: transaction.transactionNumber,
        emailSent: emailResult?.success || false
    };
}

/**
 * Verify transaction token and return transaction details
 */
export async function verifyBorrowTransactionToken(token: string) {
    const transaction = await prisma.borrowTransaction.findUnique({
        where: { signatureToken: token },
        include: {
            assignment: {
                include: {
                    user: {
                        include: {
                            userDepartment: true
                        }
                    }
                }
            },
            items: {
                include: {
                    asset: true,
                    checkoutInspection: {
                        select: {
                            overallCondition: true,
                            exteriorCondition: true,
                            exteriorNotes: true,
                            screenCondition: true,
                            screenNotes: true,
                            buttonPortCondition: true,
                            buttonPortNotes: true,
                            keyboardCondition: true,
                            keyboardNotes: true,
                            touchpadCondition: true,
                            batteryHealth: true,
                            photoUrls: true,
                            inspectionDate: true
                        }
                    }
                }
            }
        }
    });

    if (!transaction) {
        return { error: "Invalid token" };
    }

    if (transaction.signatureTokenExpiry && new Date() > transaction.signatureTokenExpiry) {
        return { error: "Link expired" };
    }

    if (transaction.isSigned) {
        return { error: "Already signed", signedAt: transaction.signedAt };
    }

    // Map items with their inspections
    const items = transaction.items.map(item => ({
        assetCode: item.asset.assetCode,
        name: item.asset.name,
        category: item.asset.category,
        serialNumber: item.asset.serialNumber,
        condition: item.checkoutInspection?.overallCondition || 'Good',
        notes: item.asset.brand + " " + (item.asset.model || ""),
        inspection: item.checkoutInspection ? {
            exteriorCondition: item.checkoutInspection.exteriorCondition,
            exteriorNotes: item.checkoutInspection.exteriorNotes,
            screenCondition: item.checkoutInspection.screenCondition,
            screenNotes: item.checkoutInspection.screenNotes,
            buttonPortCondition: item.checkoutInspection.buttonPortCondition,
            buttonPortNotes: item.checkoutInspection.buttonPortNotes,
            keyboardCondition: item.checkoutInspection.keyboardCondition,
            keyboardNotes: item.checkoutInspection.keyboardNotes,
            touchpadCondition: item.checkoutInspection.touchpadCondition,
            batteryHealth: item.checkoutInspection.batteryHealth,
            photos: item.checkoutInspection.photoUrls
                ? JSON.parse(item.checkoutInspection.photoUrls)
                : []
        } : null
    }));

    return {
        success: true,
        data: {
            id: transaction.id,
            transactionNumber: transaction.transactionNumber,
            assignmentNumber: transaction.assignment.assignmentNumber,
            teacherName: transaction.assignment.user.name || 'User',
            teacherEmail: transaction.assignment.user.email || 'no-email@example.com',
            department: transaction.assignment.user.userDepartment?.name || "N/A",
            borrowDate: transaction.borrowDate,
            items: items
        }
    };
}

/**
 * Sign a borrow transaction
 */
export async function signBorrowTransaction(data: {
    token: string;
    signatureData: string;
}) {
    try {


        const transaction = await prisma.borrowTransaction.findUnique({
            where: { signatureToken: data.token },
            include: {
                assignment: { include: { user: true } },
                items: { include: { asset: true } }
            }
        });

        if (!transaction) {
            console.error('[Server] Transaction token not found');
            return { success: false, error: 'Invalid signature link' };
        }



        if (transaction.signatureTokenExpiry && new Date() > transaction.signatureTokenExpiry) {
            console.error('[Server] Token expired');
            return { success: false, error: 'Signature link has expired' };
        }

        if (transaction.isSigned) {
            console.error('[Server] Already signed');
            return { success: false, error: 'This transaction has already been signed' };
        }

        // Save signature

        const signaturePath = await saveFile(
            data.signatureData,
            `signatures/transaction-${transaction.id}-${Date.now()}.png`
        );


        // Update transaction

        await prisma.borrowTransaction.update({
            where: { id: transaction.id },
            data: {
                isSigned: true,
                signedAt: new Date(),
                borrowerSignature: signaturePath,
                signatureToken: null,
                signatureTokenExpiry: null
            }
        });


        return {
            success: true,
            transactionNumber: transaction.transactionNumber,
            assignmentNumber: transaction.assignment.assignmentNumber,
            signedAt: new Date()
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Server] Error in signBorrowTransaction:', error);
        return {
            success: false,
            error: message || 'Failed to process signature'
        };
    }
}
