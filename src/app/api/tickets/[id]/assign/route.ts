import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ticketAssignedEmail } from '@/lib/ticket-notifications';
import { calculateSLADeadline, checkSLAStatus } from '@/lib/sla';

// POST /api/tickets/[id]/assign - Assign ticket to user
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

        if (!body.assignedToId) {
            return NextResponse.json(
                { error: 'assignedToId is required' },
                { status: 400 }
            );
        }

        // Check if ticket exists
        const existingTicket = await prisma.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!existingTicket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Check permissions
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { userRole: true },
        });

        const permissions = user?.userRole?.permissions
            ? JSON.parse(user.userRole.permissions as string)
            : {};

        const canAssign = permissions.tickets?.assign || permissions.tickets?.update;

        if (!canAssign) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Calculate SLA deadline if not already set
        let slaDeadline = existingTicket.slaDeadline;
        if (!slaDeadline) {
            slaDeadline = calculateSLADeadline(existingTicket.priority, existingTicket.reportedAt);
        }

        // Update ticket
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                assignedToId: parseInt(body.assignedToId),
                assignedAt: new Date(),
                status: existingTicket.status === 'open' ? 'assigned' : existingTicket.status,
                slaDeadline,
                slaStatus: checkSLAStatus(slaDeadline),
            },
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
                action: 'assigned',
                details: JSON.stringify({
                    assignedToId: body.assignedToId,
                    assignedToName: ticket.assignedTo?.name,
                }),
            },
        });

        // TODO: Send email notification
        // const emailData = ticketAssignedEmail(ticket as any);
        // await sendEmail(emailData);

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error assigning ticket:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
