import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { createOAuth2Client, getTokensFromCode } from '@/lib/gmail-oauth';

// GET - Handle OAuth callback
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            // Redirect to login if not authenticated
            return NextResponse.redirect(new URL('/login', req.url));
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle OAuth error
        if (error) {
            return NextResponse.redirect(
                new URL(`/settings/email/accounts?error=${encodeURIComponent(error)}`, req.url)
            );
        }

        if (!code || !state) {
            return NextResponse.redirect(
                new URL('/settings/email/accounts?error=missing_parameters', req.url)
            );
        }

        // Parse state parameter
        const { accountId } = JSON.parse(decodeURIComponent(state));

        // Use NextAuth Google OAuth credentials
        const clientId = process.env.AUTH_GOOGLE_ID!;
        const clientSecret = process.env.AUTH_GOOGLE_SECRET!;

        // Get redirect URI
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email-accounts/oauth/callback`;

        // Create OAuth2 client
        const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);

        // Exchange code for tokens
        const { accessToken, refreshToken, expiryDate } = await getTokensFromCode(oauth2Client, code);

        // Update email account with OAuth tokens
        await prisma.emailAccount.update({
            where: { id: parseInt(accountId) },
            data: {
                oauthClientId: clientId,
                oauthClientSecret: encrypt(clientSecret),
                oauthAccessToken: encrypt(accessToken),
                oauthRefreshToken: encrypt(refreshToken),
                oauthTokenExpiry: new Date(expiryDate),
            },
        });

        // Redirect back to email accounts page with success
        return NextResponse.redirect(
            new URL('/settings/email/accounts?success=oauth_connected', req.url)
        );

    } catch (error: any) {
        console.error('Error handling OAuth callback:', error);
        return NextResponse.redirect(
            new URL(`/settings/email/accounts?error=${encodeURIComponent(error.message)}`, req.url)
        );
    }
}
