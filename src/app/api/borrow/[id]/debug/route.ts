import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const transactionId = parseInt(id);

        const transaction = await prisma.borrowTransaction.findUnique({
            where: { id: transactionId },
            include: {
                assignment: {
                    include: {
                        user: true
                    }
                },
                items: {
                    include: {
                        asset: true
                    }
                }
            }
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Return debug info
        return NextResponse.json({
            transactionId: transaction.id,
            transactionNumber: transaction.transactionNumber,
            signature: transaction.borrowerSignature,
            isSigned: transaction.isSigned
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
