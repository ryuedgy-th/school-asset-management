import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import StationaryReturnDetailClient from './StationaryReturnDetailClient';

export default async function StationaryReturnDetailPage({
    params,
}: {
    params: Promise<{ returnNo: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const userId = parseInt(session.user.id);
    const canView = await hasPermission({ id: userId }, 'stationary', 'view');
    if (!canView) {
        redirect('/');
    }

    const { returnNo } = await params;

    // Fetch return with all related data
    const returnVoucher = await prisma.stationaryReturn.findUnique({
        where: { returnNo },
        include: {
            returnedBy: {
                select: { id: true, name: true, email: true },
            },
            department: {
                select: { id: true, code: true, name: true },
            },
            approvedBy: {
                select: { id: true, name: true, email: true },
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

    if (!returnVoucher) {
        notFound();
    }

    // Check permissions
    const canIssue = await hasPermission({ id: userId }, 'stationary', 'issue');
    const isOwner = returnVoucher.returnedById === userId;

    return (
        <StationaryReturnDetailClient
            returnVoucher={returnVoucher}
            canApprove={canIssue && returnVoucher.status === 'pending'}
            canEdit={isOwner && returnVoucher.status === 'pending'}
            isOwner={isOwner}
            currentUserId={userId}
        />
    );
}
