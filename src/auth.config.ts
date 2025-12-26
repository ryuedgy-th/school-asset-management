import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
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
