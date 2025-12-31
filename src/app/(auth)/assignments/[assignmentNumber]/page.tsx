'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import AssignmentDetailClient from './AssignmentDetailClient';

interface PageProps {
    params: Promise<{ assignmentNumber: string }>;
}

export default async function AssignmentDetailPage(props: PageProps) {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    // Get user with permissions
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            userRole: true,
            userDepartment: true,
        }
    });

    if (!user) {
        return <div>User not found</div>;
    }

    const { assignmentNumber } = params;

    const assignment = await prisma.assignment.findUnique({
        where: { assignmentNumber },
        include: {
            user: {
                include: {
                    userDepartment: true
                }
            },
            borrowTransactions: {
                include: {
                    items: {
                        include: { asset: true }
                    },
                    createdBy: { select: { name: true } },
                    cancelledBy: { select: { name: true } }
                }
            },
            returnTransactions: {
                include: {
                    items: {
                        include: { borrowItem: { include: { asset: true } } }
                    },
                    checkedBy: { select: { name: true } }
                }
            }
        }
    });

    if (!assignment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Assignment not found</h1>
                    <p className="text-slate-600 mb-4">Assignment number: <code className="bg-slate-200 px-2 py-1 rounded">{assignmentNumber}</code></p>
                    <a href="/assignments" className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                        ← Back to Assignments
                    </a>
                </div>
            </div>
        );
    }

    // Permission check: user can only view their own assignments unless they have edit permission
    const isAdmin = await hasPermission(user, 'assignments', 'edit');
    const isOwner = assignment.userId === user.id;

    if (!isAdmin && !isOwner) {
        return <div>You don't have permission to view this assignment</div>;
    }

    // Serialize data to convert Decimal to number for Client Component
    const serializedAssignment = {
        ...assignment,
        borrowTransactions: assignment.borrowTransactions.map(bt => ({
            ...bt,
            items: bt.items.map(item => ({
                ...item,
                asset: {
                    ...item.asset,
                    cost: item.asset.cost ? Number(item.asset.cost) : null
                }
            }))
        })),
        returnTransactions: assignment.returnTransactions.map(rt => ({
            ...rt,
            items: rt.items.map(item => ({
                ...item,
                damageCharge: item.damageCharge ? Number(item.damageCharge) : 0,
                borrowItem: {
                    ...item.borrowItem,
                    asset: {
                        ...item.borrowItem.asset,
                        cost: item.borrowItem.asset.cost ? Number(item.borrowItem.asset.cost) : null
                    }
                }
            }))
        }))
    } as any; // Type assertion needed for Decimal to number conversion

    return <AssignmentDetailClient assignment={serializedAssignment} isAdmin={isAdmin} />;
}
