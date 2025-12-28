import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ticketStatusChangedEmail, ticketResolvedEmail } from '@/lib/ticket-notifications';

// Allowed status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    open: ['assigned', 'in_progress', 'cancelled'],
    assigned: ['in_progress', 'resolved', 'cancelled'],
    in_progress: ['assigned', 'resolved', 'cancelled'],
    resolved: ['closed', 'in_progress'], // Can reopen
    closed: [],
    cancelled: [],
};

// POST /api/tickets/[id]/status - Change ticket status
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ticketId = parseInt((await context.params).id);
        const body = await req.json();

        if (!body.status) {
            return NextResponse.json(
                { error: 'status is required' },
                { status: 400 }
            );
        }

        // Get existing ticket
        const existingTicket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
                reportedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                itAsset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
                fmAsset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
            },
        });

        if (!existingTicket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Check if transition is allowed
        const allowedStatuses = ALLOWED_TRANSITIONS[existingTicket.status] || [];
        if (!allowedStatuses.includes(body.status)) {
            return NextResponse.json(
                {
                    error: `Cannot transition from ${existingTicket.status} to ${body.status}`,
                    allowedStatuses,
                },
                { status: 400 }
            );
        }

        // Check if resolution notes required for closed status
        if (body.status === 'closed' && !body.resolutionNotes) {
            return NextResponse.json(
                { error: 'Resolution notes are required when closing a ticket' },
                { status: 400 }
            );
        }

        // Check permissions
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { userRole: true },
        });

        const permissions = user?.userRole?.permissions
            ? JSON.parse(user.userRole.permissions as string)
            : {};

        const canUpdate =
            permissions.tickets?.update ||
            existingTicket.assignedToId === parseInt(session.user.id);

        if (!canUpdate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prepare update data
        const updateData: any = {
            status: body.status,
        };

        if (body.status === 'resolved') {
            if (!body.resolutionNotes) {
                return NextResponse.json(
                    { error: 'Resolution notes are required when resolving a ticket' },
                    { status: 400 }
                );
            }
            updateData.resolvedAt = new Date();
            updateData.resolution = body.resolution || 'fixed';
            updateData.resolutionNotes = body.resolutionNotes;
        }

        if (body.status === 'closed') {
            updateData.closedAt = new Date();
            if (body.resolutionNotes) {
                updateData.resolutionNotes = body.resolutionNotes;
            }
        }

        // Update ticket
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: updateData,
            include: {
                reportedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                itAsset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
                fmAsset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
            },
        });

        // Create activity log
        await prisma.ticketActivity.create({
            data: {
                ticketId,
                userId: parseInt(session.user.id),
                action: 'status_changed',
                details: JSON.stringify({
                    oldStatus: existingTicket.status,
                    newStatus: body.status,
                    ...(body.resolution && { resolution: body.resolution }),
                    ...(body.resolutionNotes && { resolutionNotes: body.resolutionNotes }),
                }),
            },
        });

        // TODO: Send email notifications
        // if (body.status === 'resolved' || body.status === 'closed') {
        //     const emailData = ticketResolvedEmail(ticket as any);
        //     await sendEmail(emailData);
        // } else {
        //     const emailData = ticketStatusChangedEmail(ticket as any, existingTicket.status, body.status);
        //     await sendEmail(emailData);
        // }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error changing ticket status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
