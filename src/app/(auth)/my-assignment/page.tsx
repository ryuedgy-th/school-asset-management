import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import MyAssignmentClient from './MyAssignmentClient';

export default async function MyAssignmentPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    // Get user
    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        redirect('/login');
    }

    // Get user's active assignment
    const assignment = await prisma.assignment.findFirst({
        where: {
            userId: user.id,
            status: 'active' // Fixed: lowercase 'active'
        },
        include: {
            borrowTransactions: {
                include: {
                    items: { // Changed from borrowItems to items
                        include: {
                            asset: true,
                        },
                        where: {
                            status: 'Borrowed'
                        }
                    }
                },
                orderBy: {
                    borrowDate: 'desc'
                }
            },
        }
    });

    // Serialize Decimal fields for Client Component
    const serializedAssignment = assignment ? {
        ...assignment,
        // Flat map all borrowed items
        allBorrowedItems: assignment.borrowTransactions.flatMap(tx => tx.items || []),
        borrowTransactions: assignment.borrowTransactions.map(bt => ({
            ...bt,
            items: bt.items.map(item => ({ // Changed from borrowItems to items
                ...item,
                asset: {
                    ...item.asset,
                    cost: item.asset.cost ? Number(item.asset.cost) : null
                }
            }))
        }))
    } : null;

    return <MyAssignmentClient assignment={serializedAssignment as any} user={user} />;
}
