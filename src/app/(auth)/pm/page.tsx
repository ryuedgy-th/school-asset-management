import { prisma } from '@/lib/prisma';
import PMCalendar from '@/components/PMCalendar';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Preventive Maintenance | AssetMaster',
    description: 'Maintenance schedule',
};

export default async function PMPage() {
    const tasks = await prisma.pMTask.findMany({
        orderBy: { scheduledDate: 'asc' },
    });

    return (
        <PMCalendar initialTasks={tasks} />
    );
}
