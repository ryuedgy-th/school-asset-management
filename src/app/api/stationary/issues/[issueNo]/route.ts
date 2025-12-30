import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch single issue
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ issueNo: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const { issueNo } = params;

        const issue = await prisma.stationaryIssue.findUnique({
            where: { issueNo },
            include: {
                requisition: {
                    select: {
                        id: true,
                        requisitionNo: true,
                        purpose: true,
                    },
                },
                issuedBy: { select: { id: true, name: true, email: true } },
                issuedTo: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, code: true, name: true } },
                location: { select: { id: true, code: true, name: true } },
                acknowledgedBy: { select: { id: true, name: true, email: true } },
                items: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                itemCode: true,
                                name: true,
                                uom: true,
                                unitCost: true,
                            },
                        },
                    },
                },
            },
        });

        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        return NextResponse.json(issue);
    } catch (error) {
        console.error('Error fetching issue:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update issue status or acknowledge
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ issueNo: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const params = await context.params;
        const { issueNo } = params;
        const body = await req.json();

        const issue = await prisma.stationaryIssue.findUnique({
            where: { issueNo },
        });

        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        const updateData: any = {};

        // Acknowledge receipt
        if (body.action === 'acknowledge') {
            if (issue.issuedToId !== userId) {
                return NextResponse.json(
                    { error: 'Only the recipient can acknowledge receipt' },
                    { status: 403 }
                );
            }

            updateData.acknowledgedById = userId;
            updateData.acknowledgedAt = new Date();
            updateData.status = 'completed';
        }

        // Update status
        if (body.status) {
            updateData.status = body.status;
        }

        // Update delivery details
        if (body.deliveryDate !== undefined) {
            updateData.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : null;
        }
        if (body.deliveryNotes !== undefined) {
            updateData.deliveryNotes = body.deliveryNotes;
        }

        const updated = await prisma.stationaryIssue.update({
            where: { issueNo },
            data: updateData,
            include: {
                requisition: true,
                issuedBy: true,
                issuedTo: true,
                department: true,
                location: true,
                acknowledgedBy: true,
                items: { include: { item: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryIssue',
                entityId: issue.id.toString(),
                details: JSON.stringify({
                    issueNo,
                    action: body.action || 'update',
                }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating issue:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
