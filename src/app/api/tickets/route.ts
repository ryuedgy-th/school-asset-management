import { NextRequest, NextResponse } from 'next/server';

import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/tickets - List all tickets with role-based filtering
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const canViewIT = await hasPermission({ id: userId }, 'tickets', 'view_it') || await hasPermission({ id: userId }, 'tickets', 'view_all');
        const canViewFM = await hasPermission({ id: userId }, 'tickets', 'view_fm') || await hasPermission({ id: userId }, 'tickets', 'view_all');

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type'); // 'IT' or 'FM'
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const assignedToId = searchParams.get('assignedToId');
        const reportedById = searchParams.get('reportedById');

        // Build where clause with role-based filtering
        const where: any = {};

        // Role-based type filtering
        if (!canViewIT && !canViewFM) {
            // User can only see their own tickets
            where.reportedById = userId;
        } else if (canViewIT && !canViewFM) {
            where.type = 'IT';
        } else if (!canViewIT && canViewFM) {
            where.type = 'FM';
        }
        // If canViewIT && canViewFM, no type restriction

        // Apply additional filters
        if (type && (type === 'IT' || type === 'FM')) {
            where.type = type;
        }

        if (status) {
            where.status = status;
        }

        if (priority) {
            where.priority = priority;
        }

        if (assignedToId) {
            where.assignedToId = parseInt(assignedToId);
        }

        if (reportedById) {
            where.reportedById = parseInt(reportedById);
        }

        // Get total count
        const total = await prisma.ticket.count({ where });

        // Get tickets
        const tickets = await prisma.ticket.findMany({
            where,
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
                _count: {
                    select: {
                        comments: true,
                        activities: true,
                    },
                },
            },
            orderBy: {
                reportedAt: 'desc',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({
            tickets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/tickets - Create new ticket
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.type || !body.title || !body.description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (body.type !== 'IT' && body.type !== 'FM') {
            return NextResponse.json(
                { error: 'Invalid ticket type' },
                { status: 400 }
            );
        }

        // Generate ticket number
        const year = new Date().getFullYear();
        const lastTicket = await prisma.ticket.findFirst({
            where: {
                ticketNumber: {
                    startsWith: `${body.type}-${year}-`,
                },
            },
            orderBy: {
                ticketNumber: 'desc',
            },
        });

        let ticketNumber;
        if (lastTicket) {
            const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[2]);
            ticketNumber = `${body.type}-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
        } else {
            ticketNumber = `${body.type}-${year}-001`;
        }

        // Create ticket with attachments
        const ticket = await prisma.ticket.create({
            data: {
                ticketNumber,
                type: body.type,
                category: body.category,
                subCategory: body.subCategory,
                itAssetId: body.itAssetId ? parseInt(body.itAssetId) : null,
                fmAssetId: body.fmAssetId ? parseInt(body.fmAssetId) : null,
                title: body.title,
                description: body.description,
                priority: body.priority || 'medium',
                status: 'open',
                reportedById: parseInt(session.user.id),
                affectedUserId: body.affectedUserId ? parseInt(body.affectedUserId) : null,
                assignedToId: body.assignedToId ? parseInt(body.assignedToId) : null,
                images: body.images ? JSON.stringify(body.images) : null,
                documents: body.documents ? JSON.stringify(body.documents) : null,
            },
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

        // Create attachments if provided (using loop because SQLite doesn't support createMany)
        if (body.attachments && body.attachments.length > 0) {
            for (const att of body.attachments) {
                await prisma.ticketAttachment.create({
                    data: {
                        ticketId: ticket.id,
                        filename: att.filename,
                        originalName: att.originalName,
                        mimeType: att.mimeType,
                        size: att.size,
                        url: att.url,
                        uploadedById: parseInt(session.user.id),
                    },
                });
            }
        }

        // Create activity log
        await prisma.ticketActivity.create({
            data: {
                ticketId: ticket.id,
                userId: parseInt(session.user.id),
                action: 'created',
                details: JSON.stringify({
                    ticketNumber: ticket.ticketNumber,
                    type: ticket.type,
                    priority: ticket.priority,
                }),
            },
        });

        // If assigned, create assignment activity
        if (body.assignedToId) {
            await prisma.ticketActivity.create({
                data: {
                    ticketId: ticket.id,
                    userId: parseInt(session.user.id),
                    action: 'assigned',
                    details: JSON.stringify({
                        assignedToId: body.assignedToId,
                    }),
                },
            });
        }

        // Send email notifications using template system
        try {
            const { sendTemplatedEmail } = await import('@/lib/email');

            // Fetch full ticket data for email
            const fullTicket = await prisma.ticket.findUnique({
                where: { id: ticket.id },
                include: {
                    reportedBy: { select: { name: true, email: true } },
                    affectedUser: { select: { name: true, email: true } },
                    assignedTo: { select: { name: true, email: true } },
                    itAsset: { select: { assetCode: true, name: true } },
                    fmAsset: { select: { assetCode: true, name: true } },
                },
            });

            if (fullTicket && fullTicket.reportedBy?.email) {
                // Priority color mapping
                const priorityColors: Record<string, string> = {
                    urgent: '#dc2626',
                    high: '#ea580c',
                    medium: '#eab308',
                    low: '#3b82f6'
                };

                // Send ticket created email
                await sendTemplatedEmail({
                    category: 'ticket_created',
                    variables: {
                        ticketNumber: fullTicket.ticketNumber,
                        title: fullTicket.title,
                        priority: fullTicket.priority,
                        priorityColor: priorityColors[fullTicket.priority] || '#3b82f6',
                        type: fullTicket.type,
                        category: fullTicket.category,
                        description: fullTicket.description || 'No description provided',
                        reportedByName: fullTicket.reportedBy.name || 'User',
                        ticketUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tickets/${fullTicket.id}`,
                    },
                    overrideRecipients: {
                        to: [fullTicket.reportedBy.email],
                    },
                });

                // If assigned, send assignment email
                if (fullTicket.assignedTo?.email) {
                    await sendTemplatedEmail({
                        category: 'ticket_assigned',
                        variables: {
                            ticketNumber: fullTicket.ticketNumber,
                            title: fullTicket.title,
                            priority: fullTicket.priority,
                            priorityColor: priorityColors[fullTicket.priority] || '#3b82f6',
                            type: fullTicket.type,
                            description: fullTicket.description || 'No description provided',
                            assignedToName: fullTicket.assignedTo.name || 'Technician',
                            reportedByName: fullTicket.reportedBy.name || 'User',
                            slaDeadline: fullTicket.slaDeadline
                                ? new Date(fullTicket.slaDeadline).toLocaleString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })
                                : 'Not set',
                            ticketUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tickets/${fullTicket.id}`,
                        },
                        overrideRecipients: {
                            to: [fullTicket.assignedTo.email],
                        },
                    });
                }
            }
        } catch (emailError) {
            console.error('Error sending ticket notification emails:', emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
