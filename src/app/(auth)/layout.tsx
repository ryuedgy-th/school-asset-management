import Sidebar from '@/components/Sidebar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getAccessibleModules } from '@/lib/permissions';

// Force dynamic rendering to prevent caching of user permissions
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user?.email) return null; // Middleware handles redirect, but safe check

    let permissions: any = {};
    let accessibleModules: any[] = [];

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                userRole: true,
                userDepartment: true,
            }
        });

        if (user?.userRole?.permissions) {
            try {
                permissions = typeof user.userRole.permissions === 'string'
                    ? JSON.parse(user.userRole.permissions)
                    : user.userRole.permissions;
            } catch (e) {
                console.error('Error parsing permissions:', e);
                permissions = {};
            }
        }

        // Get accessible modules for sidebar filtering
        if (user) {
            accessibleModules = getAccessibleModules(user);
        }
    } catch (error) {
        console.error("Error fetching user permissions:", error);
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full">
            <Sidebar
                permissions={permissions}
                role={user?.role || 'User'}
                user={{
                    name: user?.name,
                    email: user?.email,
                    image: user?.image
                }}
                accessibleModules={accessibleModules}
                userPermissions={permissions}
            />
            <main className="flex-1 w-full lg:ml-72 pt-[80px] lg:pt-0 p-4 lg:p-8 transition-all duration-300 ease-in-out">
                <div className="mx-auto max-w-7xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
