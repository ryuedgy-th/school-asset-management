import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createOAuth2Client, getAuthorizationUrl } from '@/lib/gmail-oauth';

// GET - Start OAuth flow
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');

        // Use NextAuth Google OAuth credentials
        const clientId = process.env.AUTH_GOOGLE_ID;
        const clientSecret = process.env.AUTH_GOOGLE_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                { error: 'Google OAuth credentials not configured' },
                { status: 500 }
            );
        }

        // Get redirect URI
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email-accounts/oauth/callback`;

        // Create OAuth2 client
        const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);

        // Generate authorization URL with state parameter
        const state = JSON.stringify({ accountId, clientId, clientSecret });
        const authUrl = getAuthorizationUrl(oauth2Client) + `&state=${encodeURIComponent(state)}`;

        // Redirect to Google OAuth consent screen
        return NextResponse.redirect(authUrl);

    } catch (error: any) {
        console.error('Error starting OAuth flow:', error);
        return NextResponse.json(
            { error: 'Failed to start OAuth flow', details: error.message },
            { status: 500 }
        );
    }
}
