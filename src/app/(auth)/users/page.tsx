import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Users | AssetMaster',
};

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        include: {
            userRole: true,
            userDepartment: true,
        },
        orderBy: { name: 'asc' },
    });

    const roles = await prisma.role.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });

    const departments = await prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="container py-8">
            <UserManagement
                initialUsers={users}
                roles={roles}
                departments={departments}
            />
        </div>
    );
}
