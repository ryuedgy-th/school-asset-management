import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfilePageClient from './ProfilePageClient';

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
            role: true,
            image: true,
            password: true, // Check if user has password (credentials) or not (OAuth)
        }
    });

    if (!user) {
        redirect('/login');
    }

    // Determine if user logged in via OAuth (no password) or credentials (has password)
    const isOAuthUser = !user.password;

    return <ProfilePageClient user={{
        id: user.id,
        name: user.name ?? null,
        nickname: user.nickname ?? null,
        email: user.email!, // Non-null assertion safe because we checked session.user.email exists
        role: user.role,
        image: user.image ?? null,
    }} isOAuthUser={isOAuthUser} />;
}
