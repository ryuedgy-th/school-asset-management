import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build filter conditions
        const where: any = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        if (priority && priority !== 'all') {
            where.priority = priority;
        }

        if (type && type !== 'all') {
            where.type = type;
        }

        if (category && category !== 'all') {
            where.category = category;
        }

        if (dateFrom || dateTo) {
            where.reportedAt = {};
            if (dateFrom) {
                where.reportedAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.reportedAt.lte = endDate;
            }
        }

        // Fetch tickets
        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                reportedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                affectedUser: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                assignedTo: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                itAsset: {
                    select: {
                        assetCode: true,
                        name: true,
                    },
                },
                fmAsset: {
                    select: {
                        assetCode: true,
                        name: true,
                    },
                },
            },
            orderBy: { reportedAt: 'desc' },
        });

        // Generate CSV
        const headers = [
            'Ticket Number',
            'Type',
            'Title',
            'Description',
            'Category',
            'Sub Category',
            'Priority',
            'Status',
            'Reported By',
            'Reported By Email',
            'Affected User',
            'Affected User Email',
            'Assigned To',
            'Assigned To Email',
            'IT Asset',
            'FM Asset',
            'Reported Date',
            'Assigned Date',
            'Resolved Date',
            'Closed Date',
            'SLA Deadline',
            'SLA Status',
            'Resolution',
            'Resolution Notes',
            'Actual Cost',
        ];

        const rows = tickets.map(ticket => [
            ticket.ticketNumber,
            ticket.type,
            ticket.title,
            `"${(ticket.description || '').replace(/"/g, '""')}"`,
            ticket.category,
            ticket.subCategory || '',
            ticket.priority,
            ticket.status,
            ticket.reportedBy?.name || '',
            ticket.reportedBy?.email || '',
            ticket.affectedUser?.name || '',
            ticket.affectedUser?.email || '',
            ticket.assignedTo?.name || '',
            ticket.assignedTo?.email || '',
            ticket.itAsset ? `${ticket.itAsset.assetCode} - ${ticket.itAsset.name}` : '',
            ticket.fmAsset ? `${ticket.fmAsset.assetCode} - ${ticket.fmAsset.name}` : '',
            ticket.reportedAt.toISOString(),
            ticket.assignedAt ? ticket.assignedAt.toISOString() : '',
            ticket.resolvedAt ? ticket.resolvedAt.toISOString() : '',
            ticket.closedAt ? ticket.closedAt.toISOString() : '',
            ticket.slaDeadline ? ticket.slaDeadline.toISOString() : '',
            ticket.slaStatus || '',
            `"${(ticket.resolution || '').replace(/"/g, '""')}"`,
            `"${(ticket.resolutionNotes || '').replace(/"/g, '""')}"`,
            ticket.actualCost ? ticket.actualCost.toString() : '',
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

        // Return CSV file
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="tickets-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Error exporting tickets:', error);
        return NextResponse.json(
            { error: 'Failed to export tickets' },
            { status: 500 }
        );
    }
}
