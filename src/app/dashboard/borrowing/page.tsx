'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import NewAssignmentButton from './NewAssignmentButton';
import BorrowingClient from './BorrowingClient';

export default async function BorrowingDashboardPage() {
    const session = await auth();
    if (!session?.user?.id) return <div>Unauthorized</div>;

    // Fetch ALL assignments (both active and closed)
    const assignments = await prisma.assignment.findMany({
        include: {
            user: { select: { name: true, department: true } },
            closedBy: { select: { name: true } },
            borrowTransactions: {
                include: { items: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Serialize dates for client component
    const serializedAssignments = assignments.map(assignment => ({
        ...assignment,
        createdAt: assignment.createdAt,
        closedAt: assignment.closedAt
    }));

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Borrowing Management</h1>
                    <p className="text-slate-500">Monitor and manage all equipment assignments.</p>
                </div>
                <div className="flex gap-2">
                    <NewAssignmentButton />
                </div>
            </div>

            <BorrowingClient assignments={serializedAssignments} />
        </div>
    );
}
