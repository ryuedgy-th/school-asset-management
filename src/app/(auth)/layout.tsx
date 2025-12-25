import Sidebar from '@/components/Sidebar';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user?.email) return null; // Middleware handles redirect, but safe check

    let permissions: string[] = [];

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { userRole: true }
        });

        if (user?.userRole?.permissions) {
            permissions = JSON.parse(user.userRole.permissions);
        }
    } catch (error) {
        console.error("Error fetching user permissions:", error);
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full">
            <Sidebar permissions={permissions} role={user?.userRole?.name || 'User'} />
            <main className="flex-1 w-full lg:ml-72 pt-[80px] lg:pt-0 p-4 lg:p-8 transition-all duration-300 ease-in-out">
                <div className="mx-auto max-w-7xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
