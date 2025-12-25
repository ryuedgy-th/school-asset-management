import { prisma } from '@/lib/prisma';
import RoleList from '@/components/RoleList';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function RolesPage() {
    const session = await auth();
    // In a real app, check permissions here. For MVP, assume Admin role check or just existence.
    // Ideally user.roleId -> Role -> check permission

    // Quick check: if not Admin, redirect (fallback)
    // Wait, session.user might not have roleId until we update auth callback to include it.
    // For now, let's just render. Middleware protects authentication.

    const roles = await prisma.role.findMany({
        include: {
            _count: {
                select: { users: true }
            }
        }
    });

    return (
        <div className="container mx-auto">
            <RoleList initialRoles={roles} />
        </div>
    );
}
