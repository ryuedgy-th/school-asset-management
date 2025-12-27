'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import AssignmentsClient from './AssignmentsClient';
import { redirect } from 'next/navigation';

export default async function AssignmentsPage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/login');
    }

    // Get user with role and permissions
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

    // Check if user has edit permission (admin view)
    const isAdmin = hasPermission(user, 'assignments', 'edit');

    // Fetch assignments based on role
    const assignments = await prisma.assignment.findMany({
        where: isAdmin
            ? {} // Admin sees all assignments
            : { userId: user.id }, // Regular user sees only their own
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true
                }
            },
            closedBy: { select: { name: true } },
            borrowTransactions: {
                include: {
                    items: {
                        include: { asset: true }
                    }
                }
            },
            returnTransactions: {
                include: {
                    items: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <AssignmentsClient
            assignments={assignments}
            isAdmin={isAdmin}
            currentUserId={user.id}
        />
    );
}
