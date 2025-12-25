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
            status: 'Active'
        },
        include: {
            borrowTransactions: {
                include: {
                    items: {
                        include: {
                            asset: true,
                            returnItems: true
                        }
                    }
                },
                orderBy: {
                    borrowDate: 'desc'
                }
            },
            returnTransactions: {
                include: {
                    items: {
                        include: {
                            borrowItem: {
                                include: {
                                    asset: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    returnDate: 'desc'
                }
            }
        }
    });

    // Serialize Decimal fields for Client Component
    const serializedAssignment = assignment ? {
        ...assignment,
        borrowTransactions: assignment.borrowTransactions.map(bt => ({
            ...bt,
            items: bt.items.map(item => ({
                ...item,
                asset: {
                    ...item.asset,
                    cost: item.asset.cost ? Number(item.asset.cost) : null
                },
                returnItems: item.returnItems.map(ri => ({
                    ...ri,
                    damageCharge: ri.damageCharge ? Number(ri.damageCharge) : 0
                }))
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
    } : null;

    return <MyAssignmentClient assignment={serializedAssignment as any} user={user} />;
}
