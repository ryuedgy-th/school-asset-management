import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';

async function getUser(email: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as Adapter,
    events: {
        async createUser({ user }) {


            // Assign default role if user doesn't have one
            if (!user.id) return;

            const dbUser = await prisma.user.findUnique({
                where: { id: parseInt(user.id) },
                select: { roleId: true }
            });

            if (!dbUser?.roleId) {
                const defaultRole = await prisma.role.findFirst({
                    where: {
                        name: 'User',
                        isActive: true
                    }
                });

                if (defaultRole && user.id) {
                    await prisma.user.update({
                        where: { id: parseInt(user.id) },
                        data: { roleId: defaultRole.id }
                    });
                } else {
                    console.error('❌ No default "User" role found!');
                }
            }
        }
    },
    // Use JWT with minimal data to avoid HTTP 431
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 1 day (24 hours)
        updateAge: 60 * 60, // Update session every 1 hour
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    hd: "magicyears.ac.th" // Restrict to this domain only
                }
            }
        }),
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;

                // Check if account is locked
                const { checkAccountLock, incrementFailedAttempts, resetFailedAttempts } = await import('@/lib/account-lockout');
                const lockStatus = await checkAccountLock(email);

                if (lockStatus.isLocked) {
                    throw new Error(lockStatus.message || 'Account is locked');
                }

                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user || !user.password) {
                    // Increment failed attempts even if user doesn't exist (don't reveal)
                    await incrementFailedAttempts(email);
                    return null;
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isValidPassword) {
                    // Increment failed attempts
                    const attempts = await incrementFailedAttempts(email);

                    // Provide feedback on remaining attempts
                    const remaining = Math.max(0, 5 - attempts);
                    if (remaining > 0 && remaining <= 2) {
                        throw new Error(`Invalid credentials. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before account lockout.`);
                    }

                    return null;
                }

                // Success - reset failed attempts
                await resetFailedAttempts(email);

                // Return a type that satisfies NextAuth's User type
                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                } as any; // Cast to any to bypass type mismatch if User type is augmented with properties we don't return here
            }
        })
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            // CRITICAL: Store ONLY user ID to keep JWT tiny
            if (user) {
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Fetch user data from database on each request
            if (token.userId && session.user) {
                const user = await prisma.user.findUnique({
                    where: { id: parseInt(token.userId as string) },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        roleId: true,
                        departmentId: true,
                        userRole: true,
                        userDepartment: true,
                        // Never include image or large fields
                    }
                });

                if (user) {
                    session.user.id = user.id.toString();
                    session.user.userRole = user.userRole || null;
                    session.user.userDepartment = user.userDepartment || null;
                    session.user.name = user.name ?? undefined;
                    session.user.email = user.email ?? '';

                    // Log warning if user has no role
                    if (!user.roleId) {
                        console.warn('⚠️ User has no role assigned:', user.email);
                    }
                }
            }
            return session;
        }
    }
});
