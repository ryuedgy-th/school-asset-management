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
                    borrowItems: { // Fixed: borrowItems instead of items
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
        borrowTransactions: assignment.borrowTransactions.map(bt => ({
            ...bt,
            borrowItems: bt.borrowItems.map(item => ({
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
