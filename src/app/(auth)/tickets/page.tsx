import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TicketsClient from './TicketsClient';

export default async function TicketsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <Suspense fallback={<div className="p-8">Loading tickets...</div>}>
            <TicketsClient />
        </Suspense>
    );
}
