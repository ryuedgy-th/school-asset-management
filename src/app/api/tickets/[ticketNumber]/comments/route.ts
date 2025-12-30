import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/tickets/[ticketNumber]/comments - Get all comments for a ticket
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ ticketNumber: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ticketNumber } = await context.params;

        const ticket = await prisma.ticket.findUnique({
            where: { ticketNumber },
            select: { id: true },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const comments = await prisma.ticketComment.findMany({
            where: { ticketId: ticket.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/tickets/[ticketNumber]/comments - Add comment to ticket
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ ticketNumber: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ticketNumber } = await context.params;
        const body = await req.json();

        if (!body.content || body.content.trim() === '') {
            return NextResponse.json(
                { error: 'Comment content is required' },
                { status: 400 }
            );
        }

        // Check if ticket exists
        const ticket = await prisma.ticket.findUnique({
            where: { ticketNumber },
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
            },
        });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Create comment
        const comment = await prisma.ticketComment.create({
            data: {
                ticketId: ticket.id,
                comment: body.content.trim(),
                userId: parseInt(session.user.id),
                images: body.images ? JSON.stringify(body.images) : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Create activity log
        await prisma.ticketActivity.create({
            data: {
                ticketId: ticket.id,
                userId: parseInt(session.user.id),
                action: 'commented',
                details: JSON.stringify({
                    commentId: comment.id,
                }),
            },
        });

        // TODO: Send email notification
        // import { ticketCommentAddedEmail } from '@/lib/ticket-notifications';
        // const emailData = ticketCommentAddedEmail(ticket, comment);
        // await sendEmail(emailData);

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
