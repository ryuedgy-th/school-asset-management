import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

//GET /api/tickets/[id] - Get ticket details
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt((await context.params).id);

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                reportedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                affectedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: true,
                        phoneNumber: true,
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
                        category: true,
                        location: true,
                        status: true,
                    },
                },
                fmAsset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        location: true,
                        status: true,
                    },
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                activities: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                inspection: {
                    include: {
                        inspector: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!ticket) {
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

        const canViewIT = permissions.tickets?.view_it || permissions.tickets?.view_all;
        const canViewFM = permissions.tickets?.view_fm || permissions.tickets?.view_all;

        // Check if user can view this ticket
        const isOwnTicket = ticket.reportedById === parseInt(session.user.id) ||
            ticket.assignedToId === parseInt(session.user.id) ||
            ticket.affectedUserId === parseInt(session.user.id);

        if (!isOwnTicket) {
            if (ticket.type === 'IT' && !canViewIT) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (ticket.type === 'FM' && !canViewFM) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/tickets/[id] - Update ticket
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt((await context.params).id);
        const body = await req.json();

        // Get existing ticket
        const existingTicket = await prisma.ticket.findUnique({
            where: { id },
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

        const canUpdate =
            permissions.tickets?.update ||
            existingTicket.reportedById === parseInt(session.user.id);

        if (!canUpdate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update ticket
        const ticket = await prisma.ticket.update({
            where: { id },
            data: {
                title: body.title || existingTicket.title,
                description: body.description || existingTicket.description,
                priority: body.priority || existingTicket.priority,
                category: body.category || existingTicket.category,
                subCategory: body.subCategory !== undefined ? body.subCategory : existingTicket.subCategory,
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
            },
        });

        // Create activity log
        await prisma.ticketActivity.create({
            data: {
                ticketId: id,
                userId: parseInt(session.user.id),
                action: 'updated',
                details: JSON.stringify({
                    changes: body,
                }),
            },
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error updating ticket:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/tickets/[id] - Soft delete (cancel) ticket
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt((await context.params).id);

        // Get existing ticket
        const existingTicket = await prisma.ticket.findUnique({
            where: { id },
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

        const canDelete =
            permissions.tickets?.delete ||
            existingTicket.reportedById === parseInt(session.user.id);

        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Soft delete by setting status to cancelled
        const ticket = await prisma.ticket.update({
            where: { id },
            data: {
                status: 'cancelled',
            },
        });

        // Create activity log
        await prisma.ticketActivity.create({
            data: {
                ticketId: id,
                userId: parseInt(session.user.id),
                action: 'cancelled',
                details: JSON.stringify({
                    reason: 'Ticket cancelled by user',
                }),
            },
        });

        return NextResponse.json({ message: 'Ticket cancelled successfully', ticket });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
