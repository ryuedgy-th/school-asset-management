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

        // Get user permissions
        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const permissions = user.userRole?.permissions ? JSON.parse(user.userRole.permissions as string) : {};
        const canViewIT = permissions.tickets?.view_it || permissions.tickets?.view_all;
        const canViewFM = permissions.tickets?.view_fm || permissions.tickets?.view_all;

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
            where.reportedById = user.id;
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

        // Create ticket
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

        // TODO: Send notification to assigned user

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
