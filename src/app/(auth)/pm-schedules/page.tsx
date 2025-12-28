import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import PMSchedulesClient from './PMSchedulesClient';

export default async function PMSchedulesPage() {
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

    if (!user || !hasModuleAccess(user, 'pm_schedules')) {
        redirect('/');
    }

    // Fetch PM schedules
    const schedulesRaw = await prisma.pMSchedule.findMany({
        where: { isActive: true },
        include: {
            asset: {
                select: {
                    id: true,
                    assetCode: true,
                    name: true,
                    status: true,
                },
            },
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: [{ nextDueDate: 'asc' }, { name: 'asc' }],
    });

    // Parse JSON fields
    const schedules = schedulesRaw.map((schedule) => ({
        ...schedule,
        checklistItems: schedule.checklistItems
            ? JSON.parse(schedule.checklistItems as string)
            : [],
    }));

    // Fetch all FM department users for assignment dropdown
    const users = await prisma.user.findMany({
        where: {
            userDepartment: {
                code: 'FM',
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
        orderBy: { name: 'asc' },
    });

    // Fetch all assets for schedule creation
    const assets = await prisma.fMAsset.findMany({
        where: {
            status: { in: ['active', 'in_maintenance'] },
        },
        select: {
            id: true,
            assetCode: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    });

    return <PMSchedulesClient schedules={schedules} users={users} assets={assets} user={user} />;
}
