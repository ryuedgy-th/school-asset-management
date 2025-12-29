import type { NextAuthConfig } from 'next-auth';
import { prisma } from '@/lib/prisma';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Handle OAuth/SSO sign-in
            if (account?.provider === 'google') {
                try {
                    // Check if user exists in database
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                        select: { id: true, roleId: true }
                    });

                    // If user exists but has no role, assign default role
                    if (existingUser && !existingUser.roleId) {
                        // Find default "User" role
                        const defaultRole = await prisma.role.findFirst({
                            where: {
                                name: 'User',
                                isActive: true
                            }
                        });

                        if (defaultRole) {
                            await prisma.user.update({
                                where: { id: existingUser.id },
                                data: { roleId: defaultRole.id }
                            });
                        }
                    }
                } catch (error) {
                    // Don't block login even if role assignment fails
                }
            }
            return true;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isLoginPage = nextUrl.pathname === '/login';
            const isSignPage = nextUrl.pathname.startsWith('/sign'); // Public signature page
            const isScanPage = nextUrl.pathname.startsWith('/scan'); // Public scan page with passcode

            // Allow public signature pages
            if (isSignPage) {
                return true;
            }

            // Allow public scan pages (protected by passcode)
            if (isScanPage) {
                return true;
            }

            // Allow access to login page
            if (isLoginPage) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/', nextUrl)); // Redirect to dashboard if logged in
                }
                return true;
            }

            // Protect all other routes
            // Note: Middleware matcher excludes api, static, image, etc. so this runs for pages.
            if (!isLoggedIn) {
                return false; // Redirect unauthenticated users to login page
            }

            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
