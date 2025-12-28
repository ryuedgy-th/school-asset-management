import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import MaintenanceLogsClient from './MaintenanceLogsClient';

export default async function MaintenanceLogsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { userRole: true, userDepartment: true },
    });

    if (!user || !hasModuleAccess(user, 'fm_assets')) redirect('/');

    const logsRaw = await prisma.maintenanceLog.findMany({
        include: {
            asset: { select: { id: true, assetCode: true, name: true } },
        },
        orderBy: { date: 'desc' },
        take: 100,
    });

    const logs = logsRaw.map((log) => ({
        ...log,
        cost: log.cost ? Number(log.cost) : null,
        readings: log.readings ? JSON.parse(log.readings as string) : null,
        images: log.images ? JSON.parse(log.images as string) : [],
    }));

    return <MaintenanceLogsClient logs={logs} user={user} />;
}
