import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/permissions';
import OrganizationClient from './OrganizationClient';

export const metadata = {
    title: 'Organization Management | AssetMaster',
    description: 'Manage departments and roles',
};

export default async function OrganizationPage() {
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

    if (!user || !await isAdmin(user.id)) {
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
                    rolePermissions: true,
                },
            },
        },
        orderBy: [{ departmentId: 'asc' }, { name: 'asc' }],
    });

    // Fetch all modules and permissions for roles management
    const modules = await prisma.module.findMany({
        where: { isActive: true },
        include: {
            permissions: {
                orderBy: { action: 'asc' },
            },
        },
        orderBy: { sortOrder: 'asc' },
    });

    return (
        <OrganizationClient
            departments={JSON.parse(JSON.stringify(departments))}
            roles={JSON.parse(JSON.stringify(roles))}
            modules={JSON.parse(JSON.stringify(modules))}
        />
    );
}
