import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Users | AssetMaster',
};

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <div className="container py-8">
            <UserManagement initialUsers={users} />
        </div>
    );
}
