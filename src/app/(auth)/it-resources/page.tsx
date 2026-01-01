import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import ITResourcesClient from './ITResourcesClient';

export const metadata = {
    title: 'IT Resources | AssetMaster',
    description: 'Manage software licenses and domains',
};

export default async function ITResourcesPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: {
            userRole: true,
            userDepartment: true,
        },
    });

    if (!user || !hasModuleAccess(user, 'assets')) {
        redirect('/');
    }

    // Fetch licenses
    const licenses = await prisma.license.findMany({
        orderBy: { softwareName: 'asc' },
    });

    // Fetch domains
    const domains = await prisma.domain.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <ITResourcesClient
            licenses={JSON.parse(JSON.stringify(licenses))}
            domains={JSON.parse(JSON.stringify(domains))}
        />
    );
}
