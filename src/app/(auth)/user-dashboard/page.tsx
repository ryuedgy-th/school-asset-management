'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import UserDashboardClient from './UserDashboardClient';

export default async function UserDashboardPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            userRole: true,
            userDepartment: true,
        }
    });

    if (!user) {
        redirect('/login');
    }

    // Check if user is admin - redirect to main dashboard
    const isAdmin = ['Admin', 'Technician'].includes(user.userRole?.name || '');
    if (isAdmin) {
        redirect('/');
    }

    // Fetch user's active assignments
    const activeAssignments = await prisma.assignment.findMany({
        where: {
            userId: user.id,
            status: 'Active'
        },
        include: {
            borrowTransactions: {
                where: {
                    status: { not: 'cancelled' }
                },
                include: {
                    items: {
                        include: {
                            asset: {
                                select: {
                                    id: true,
                                    name: true,
                                    assetCode: true,
                                    category: true,
                                    image: true,
                                    brand: true,
                                    model: true,
                                }
                            }
                        }
                    }
                },
                orderBy: { borrowDate: 'desc' }
            },
            returnTransactions: {
                select: {
                    items: {
                        select: {
                            borrowItemId: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Count total active items (borrowed but not returned)
    let totalActiveItems = 0;
    let unsignedTransactions = 0;
    let recentBorrows: any[] = [];

    activeAssignments.forEach(assignment => {
        const returnedItemIds = assignment.returnTransactions.flatMap(rt =>
            rt.items.map(item => item.borrowItemId)
        );

        assignment.borrowTransactions.forEach(bt => {
            const activeItems = bt.items.filter(item =>
                !returnedItemIds.includes(item.id)
            );
            totalActiveItems += activeItems.length;

            // Track unsigned transactions
            if (!bt.isSigned) {
                unsignedTransactions++;
            }

            // Collect recent borrows
            activeItems.forEach(item => {
                recentBorrows.push({
                    asset: item.asset,
                    borrowDate: bt.borrowDate,
                    transactionId: bt.id,
                    transactionNumber: bt.transactionNumber,
                    isSigned: bt.isSigned,
                    assignmentNumber: assignment.assignmentNumber
                });
            });
        });
    });

    // Sort by most recent and limit to 6
    recentBorrows.sort((a, b) =>
        new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime()
    );
    recentBorrows = recentBorrows.slice(0, 6);

    // Get assignment history count
    const totalAssignments = await prisma.assignment.count({
        where: { userId: user.id }
    });

    const closedAssignments = await prisma.assignment.count({
        where: {
            userId: user.id,
            status: 'Closed'
        }
    });

    return (
        <UserDashboardClient
            user={{
                name: user.name || 'User',
                email: user.email || '',
                department: user.userDepartment?.name || 'N/A'
            }}
            stats={{
                activeItems: totalActiveItems,
                activeAssignments: activeAssignments.length,
                totalAssignments,
                closedAssignments,
                unsignedTransactions
            }}
            recentBorrows={recentBorrows}
        />
    );
}
