import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import FMDashboardClient from './FMDashboardClient';

export const metadata: Metadata = {
    title: 'FM Dashboard | School Asset Management',
    description: 'Facility Management Analytics Dashboard',
};

export default async function FMDashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return <FMDashboardClient user={session.user} />;
}
