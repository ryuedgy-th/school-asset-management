import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/permissions';
import RolesClient from './RolesClient';

export const metadata = {
    title: 'จัดการบทบาท | AssetMaster',
    description: 'จัดการบทบาทและสิทธิ์ผู้ใช้งาน',
};

export default async function RolesPage() {
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

    // Fetch roles with departments and user counts
    const roles = await prisma.role.findMany({
        include: {
            department: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    users: true,
                },
            },
        },
        orderBy: [{ departmentId: 'asc' }, { name: 'asc' }],
    });

    // Fetch departments for dropdown
    const departments = await prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });

    return (
        <RolesClient
            roles={JSON.parse(JSON.stringify(roles))}
            departments={JSON.parse(JSON.stringify(departments))}
        />
    );
}
