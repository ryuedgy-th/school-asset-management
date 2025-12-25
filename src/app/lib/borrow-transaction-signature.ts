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

    // Verify permissions
    const userRole = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { userRole: true }
    });

    if (!userRole || !['Admin', 'Technician'].includes(userRole.userRole?.name || '')) {
        throw new Error('Insufficient permissions');
    }

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
            transaction.assignment.user.name,
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
            assignment: { include: { user: true } },
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
        notes: item.asset.brand + " " + (item.asset.model || ""),
        inspection: item.checkoutInspection ? {
            condition: item.checkoutInspection.overallCondition,
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
                : [],
            date: item.checkoutInspection.inspectionDate
        } : null
    }));

    return {
        success: true,
        data: {
            id: transaction.id,
            transactionNumber: transaction.transactionNumber,
            assignmentNumber: transaction.assignment.assignmentNumber,
            teacherName: transaction.assignment.user.name,
            teacherEmail: transaction.assignment.user.email,
            department: transaction.assignment.user.department || "N/A",
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
        console.log('[Server] Verifying transaction token:', data.token);

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

        console.log('[Server] Transaction found:', transaction.transactionNumber);

        if (transaction.signatureTokenExpiry && new Date() > transaction.signatureTokenExpiry) {
            console.error('[Server] Token expired');
            return { success: false, error: 'Signature link has expired' };
        }

        if (transaction.isSigned) {
            console.error('[Server] Already signed');
            return { success: false, error: 'This transaction has already been signed' };
        }

        // Save signature
        console.log('[Server] Saving signature file...');
        const signaturePath = await saveFile(
            data.signatureData,
            `signatures/transaction-${transaction.id}-${Date.now()}.png`
        );
        console.log('[Server] Signature saved:', signaturePath);

        // Update transaction
        console.log('[Server] Updating transaction...');
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
        console.log('[Server] Transaction updated successfully');

        return {
            success: true,
            transactionNumber: transaction.transactionNumber,
            assignmentNumber: transaction.assignment.assignmentNumber,
            signedAt: new Date()
        };
    } catch (error: any) {
        console.error('[Server] Error in signBorrowTransaction:', error);
        return {
            success: false,
            error: error.message || 'Failed to process signature'
        };
    }
}

