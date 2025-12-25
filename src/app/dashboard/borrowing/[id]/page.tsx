'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import AssignDetailClient from './AssignDetailClient';

// We separate Client Logic (for modal state) from Server Data Fetching

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AssignmentDetailPage(props: PageProps) {
    const params = await props.params;
    const session = await auth();
    if (!session /* Add Role check */) return <div>Unauthorized</div>;

    const id = parseInt(params.id);

    const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
            user: true,
            borrowTransactions: {
                include: {
                    items: {
                        include: { asset: true }
                    },
                    createdBy: { select: { name: true } }
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

    if (!assignment) return <div>Assignment not found</div>;

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

    return <AssignDetailClient assignment={serializedAssignment} />;
}
