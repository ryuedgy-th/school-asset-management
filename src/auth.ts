import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';

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
    adapter: PrismaAdapter(prisma),
    // Use JWT with minimal data to avoid HTTP 431
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
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

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user || !user.password) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
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
                        role: true,
                        // Never include image or large fields
                    }
                });

                if (user) {
                    session.user.id = user.id.toString();
                    session.user.role = user.role;
                    session.user.name = user.name ?? undefined;
                    session.user.email = user.email;
                }
            }
            return session;
        }
    }
});
