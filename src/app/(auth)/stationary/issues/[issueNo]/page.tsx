import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import StationaryIssueDetailClient from './StationaryIssueDetailClient';

export default async function StationaryIssueDetailPage({
    params,
}: {
    params: Promise<{ issueNo: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const userId = parseInt(session.user.id);
    const canView = await hasPermission({ id: userId }, 'stationary', 'view');
    if (!canView) {
        redirect('/');
    }

    const { issueNo } = await params;

    // Fetch issue with all related data
    const issue = await prisma.stationaryIssue.findUnique({
        where: { issueNo },
        include: {
            issuedBy: {
                select: { id: true, name: true, email: true },
            },
            issuedTo: {
                select: { id: true, name: true, email: true },
            },
            acknowledgedBy: {
                select: { id: true, name: true, email: true },
            },
            department: {
                select: { id: true, code: true, name: true },
            },
            location: {
                select: { id: true, code: true, name: true, type: true },
            },
            requisition: {
                select: {
                    id: true,
                    requisitionNo: true,
                },
            },
            items: {
                include: {
                    item: {
                        select: {
                            id: true,
                            itemCode: true,
                            name: true,
                            uom: true,
                        },
                    },
                },
            },
        },
    });

    if (!issue) {
        notFound();
    }

    // Convert Decimal to number for Client Component
    const issueData = {
        ...issue,
        totalCost: issue.totalCost ? Number(issue.totalCost) : null,
        items: issue.items.map(item => ({
            ...item,
            unitCost: item.unitCost ? Number(item.unitCost) : null,
            totalCost: item.totalCost ? Number(item.totalCost) : null,
        })),
    };

    // Check permissions
    const canIssue = await hasPermission({ id: userId }, 'stationary', 'issue');
    const isRecipient = issue.issuedToId === userId;

    return (
        <StationaryIssueDetailClient
            issue={issueData}
            canAcknowledge={isRecipient && issue.status !== 'acknowledged'}
            canEdit={canIssue && issue.status === 'pending'}
            currentUserId={userId}
        />
    );
}
