import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToStream } from '@react-pdf/renderer';
import BorrowReceiptPDF from '@/components/PDF/BorrowReceiptPDF';
import React from 'react';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const transactionId = parseInt(id);

        // Get base URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Fetch transaction with all related data
        const transaction = await prisma.borrowTransaction.findUnique({
            where: { id: transactionId },
            include: {
                assignment: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                userDepartment: { select: { name: true, code: true } }
                            }
                        }
                    }
                },
                items: {
                    include: {
                        asset: {
                            select: {
                                assetCode: true,
                                name: true,
                                category: true
                            }
                        },
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
                                photoUrls: true
                            }
                        }
                    }
                },
            }
        });

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        // Convert signature path to absolute URL
        const signaturePath = transaction.borrowerSignature
            ? (transaction.borrowerSignature.startsWith('http')
                ? transaction.borrowerSignature
                : `${baseUrl}${transaction.borrowerSignature}`)
            : null;

        // Serialize items with their inspections and absolute photo URLs
        const serializedItems = transaction.items.map(item => {
            let photoUrls: string[] = [];
            if (item.checkoutInspection?.photoUrls) {
                try {
                    const parsed = JSON.parse(item.checkoutInspection.photoUrls);
                    photoUrls = parsed.map((url: string) => {
                        if (url.startsWith('http')) return url;
                        return `${baseUrl}${url}`;
                    });
                } catch (e) {
                    // Silent error - continue without photos
                }
            }

            return {
                ...item,
                checkoutInspection: item.checkoutInspection ? {
                    overallCondition: item.checkoutInspection.overallCondition,
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
                    photoUrls: photoUrls
                } : null
            };
        });

        // Serialize transaction with absolute URLs
        const serializedTransaction = {
            ...transaction,
            borrowerSignature: signaturePath,
            items: serializedItems
        };



        // Generate PDF using stream
        const pdfDoc = React.createElement(BorrowReceiptPDF, {
            transaction: serializedTransaction as any
        });

        const stream = await renderToStream(pdfDoc as any);

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(Buffer.from(chunk)));
        }
        const buffer = Buffer.concat(chunks);

        // Return PDF
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="borrow-receipt-${transaction.transactionNumber}.pdf"`
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
