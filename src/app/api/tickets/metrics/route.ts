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
        const dateRange = searchParams.get('range') || '30'; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // 1. Status Distribution
        const statusCounts = await prisma.ticket.groupBy({
            by: ['status'],
            _count: true,
        });

        // 2. Priority Distribution
        const priorityCounts = await prisma.ticket.groupBy({
            by: ['priority'],
            _count: true,
        });

        // 3. SLA Status Distribution
        const slaCounts = await prisma.ticket.groupBy({
            by: ['slaStatus'],
            _count: true,
            where: {
                slaStatus: { not: null },
            },
        });

        // 4. Category Distribution
        const categoryCounts = await prisma.ticket.groupBy({
            by: ['category'],
            _count: true,
            orderBy: {
                _count: {
                    category: 'desc',
                },
            },
            take: 10,
        });

        // 5. Type Distribution (IT vs FM)
        const typeCounts = await prisma.ticket.groupBy({
            by: ['type'],
            _count: true,
        });

        // 6. Average Resolution Time (in hours)
        const resolvedTickets = await prisma.ticket.findMany({
            where: {
                status: { in: ['resolved', 'closed'] },
                resolvedAt: { not: null },
                reportedAt: { gte: startDate },
            },
            select: {
                reportedAt: true,
                resolvedAt: true,
            },
        });

        let avgResolutionTime = 0;
        if (resolvedTickets.length > 0) {
            const totalTime = resolvedTickets.reduce((sum, ticket) => {
                const diff = ticket.resolvedAt!.getTime() - ticket.reportedAt.getTime();
                return sum + diff;
            }, 0);
            avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60); // Convert to hours
        }

        // 7. SLA Compliance Rate
        const totalWithSLA = await prisma.ticket.count({
            where: {
                slaDeadline: { not: null },
                reportedAt: { gte: startDate },
            },
        });

        const slaCompliant = await prisma.ticket.count({
            where: {
                slaStatus: 'within_sla',
                reportedAt: { gte: startDate },
            },
        });

        const slaComplianceRate = totalWithSLA > 0 ? (slaCompliant / totalWithSLA) * 100 : 0;

        // 8. Tickets Over Time (last 30 days, grouped by day)
        const ticketsOverTime = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
            SELECT
                DATE(reportedAt) as date,
                COUNT(*) as count
            FROM Ticket
            WHERE reportedAt >= ${startDate}
            GROUP BY DATE(reportedAt)
            ORDER BY DATE(reportedAt) ASC
        `;

        // 9. Top Assignees by Ticket Count
        const topAssignees = await prisma.ticket.groupBy({
            by: ['assignedToId'],
            _count: true,
            where: {
                assignedToId: { not: null },
                reportedAt: { gte: startDate },
            },
            orderBy: {
                _count: {
                    assignedToId: 'desc',
                },
            },
            take: 5,
        });

        // Fetch assignee details
        const assigneeIds = topAssignees.map(a => a.assignedToId!);
        const assignees = await prisma.user.findMany({
            where: { id: { in: assigneeIds } },
            select: { id: true, name: true },
        });

        const topAssigneesWithNames = topAssignees.map(ta => ({
            assigneeId: ta.assignedToId,
            assigneeName: assignees.find(a => a.id === ta.assignedToId)?.name || 'Unknown',
            count: ta._count,
        }));

        // 10. Recent Activity Summary
        const totalTickets = await prisma.ticket.count();
        const openTickets = await prisma.ticket.count({ where: { status: 'open' } });
        const inProgressTickets = await prisma.ticket.count({ where: { status: 'in_progress' } });
        const resolvedToday = await prisma.ticket.count({
            where: {
                resolvedAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        });

        return NextResponse.json({
            statusDistribution: statusCounts.map(s => ({ status: s.status, count: s._count })),
            priorityDistribution: priorityCounts.map(p => ({ priority: p.priority, count: p._count })),
            slaDistribution: slaCounts.map(s => ({ status: s.slaStatus, count: s._count })),
            categoryDistribution: categoryCounts.map(c => ({ category: c.category, count: c._count })),
            typeDistribution: typeCounts.map(t => ({ type: t.type, count: t._count })),
            avgResolutionTime: Math.round(avgResolutionTime * 10) / 10, // Round to 1 decimal
            slaComplianceRate: Math.round(slaComplianceRate * 10) / 10,
            ticketsOverTime: ticketsOverTime.map(t => ({ date: t.date, count: Number(t.count) })),
            topAssignees: topAssigneesWithNames,
            summary: {
                total: totalTickets,
                open: openTickets,
                inProgress: inProgressTickets,
                resolvedToday,
            },
        });
    } catch (error) {
        console.error('Error fetching ticket metrics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}
