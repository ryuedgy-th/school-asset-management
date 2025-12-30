import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import TicketDetailClient from './TicketDetailClient';

export default async function TicketDetailPage({
    params,
}: {
    params: Promise<{ ticketNumber: string }>;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const { ticketNumber } = await params;

    return (
        <Suspense fallback={<div className="p-8">Loading ticket...</div>}>
            <TicketDetailClient ticketNumber={ticketNumber} />
        </Suspense>
    );
}
