import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
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
        // Check permissions
        const userId = parseInt(session.user.id);
        const canAssign = await hasPermission({ id: userId }, 'tickets', 'edit');

        if (!canAssign) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Calculate SLA deadline if not already set
        let slaDeadline = existingTicket.slaDeadline;
        if (!slaDeadline) {
            slaDeadline = await calculateSLADeadline(existingTicket.priority, existingTicket.reportedAt);
        }

        // Check SLA status
        const slaStatus = await checkSLAStatus(slaDeadline, new Date(), existingTicket.reportedAt);

        // Update ticket
        const ticket = await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                assignedToId: parseInt(body.assignedToId),
                assignedAt: new Date(),
                status: existingTicket.status === 'open' ? 'assigned' : existingTicket.status,
                slaDeadline,
                slaStatus,
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

        // Send email notification using template system
        try {
            const { sendTemplatedEmail } = await import('@/lib/email');

            if (ticket.assignedTo?.email) {
                // Priority color mapping
                const priorityColors: Record<string, string> = {
                    urgent: '#dc2626',
                    high: '#ea580c',
                    medium: '#eab308',
                    low: '#3b82f6'
                };

                await sendTemplatedEmail({
                    category: 'ticket_assigned',
                    variables: {
                        ticketNumber: ticket.ticketNumber,
                        title: ticket.title,
                        priority: ticket.priority,
                        priorityColor: priorityColors[ticket.priority] || '#3b82f6',
                        type: ticket.type,
                        description: ticket.description || 'No description provided',
                        assignedToName: ticket.assignedTo.name || 'Technician',
                        reportedByName: ticket.reportedBy?.name || 'User',
                        slaDeadline: ticket.slaDeadline
                            ? new Date(ticket.slaDeadline).toLocaleString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })
                            : 'Not set',
                        ticketUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tickets/${ticket.id}`,
                    },
                    overrideRecipients: {
                        to: [ticket.assignedTo.email],
                    },
                });
            }
        } catch (emailError) {
            console.error('Error sending assignment notification email:', emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error assigning ticket:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
