import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/permissions';
import DepartmentsClient from './DepartmentsClient';

export const metadata = {
    title: 'จัดการแผนก | AssetMaster',
    description: 'จัดการแผนกและหน่วยงาน',
};

export default async function DepartmentsPage() {
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

    if (!user || !isAdmin(user)) {
        redirect('/dashboard');
    }

    // Fetch departments with counts
    const departments = await prisma.department.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    roles: true,
                    assets: true,
                    inspections: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    return <DepartmentsClient departments={JSON.parse(JSON.stringify(departments))} />;
}
