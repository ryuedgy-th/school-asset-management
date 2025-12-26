import { google } from 'googleapis';
import { decrypt, encrypt } from './encryption';
import { prisma } from './prisma';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

/**
 * Create OAuth2 client
 */
export function createOAuth2Client(clientId: string, clientSecret: string, redirectUri: string) {
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate authorization URL
 */
export function getAuthorizationUrl(oauth2Client: any): string {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Get refresh token
        scope: SCOPES,
        prompt: 'consent', // Force consent screen to get refresh token
    });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(
    oauth2Client: any,
    code: string
): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> {
    const { tokens } = await oauth2Client.getToken(code);

    return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: tokens.expiry_date!,
    };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
): Promise<{ accessToken: string; expiryDate: number }> {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
        accessToken: credentials.access_token!,
        expiryDate: credentials.expiry_date!,
    };
}

/**
 * Get valid access token (refresh if expired)
 */
export async function getValidAccessToken(accountId: number): Promise<string> {
    const account = await prisma.emailAccount.findUnique({
        where: { id: accountId },
        select: {
            oauthClientId: true,
            oauthClientSecret: true,
            oauthAccessToken: true,
            oauthRefreshToken: true,
            oauthTokenExpiry: true,
        },
    });

    if (!account || !account.oauthRefreshToken) {
        throw new Error('OAuth not configured for this account');
    }

    const now = new Date();
    const expiry = account.oauthTokenExpiry || new Date(0);

    // If token is still valid (with 5 min buffer), return it
    if (expiry > new Date(now.getTime() + 5 * 60 * 1000)) {
        return decrypt(account.oauthAccessToken!);
    }

    // Token expired, refresh it
    const clientId = account.oauthClientId!;
    const clientSecret = decrypt(account.oauthClientSecret!);
    const refreshToken = decrypt(account.oauthRefreshToken);

    const { accessToken, expiryDate } = await refreshAccessToken(
        clientId,
        clientSecret,
        refreshToken
    );

    // Update database with new access token
    await prisma.emailAccount.update({
        where: { id: accountId },
        data: {
            oauthAccessToken: encrypt(accessToken),
            oauthTokenExpiry: new Date(expiryDate),
        },
    });

    return accessToken;
}

/**
 * Send email using Gmail API
 */
export async function sendEmailViaGmailAPI(
    accountId: number,
    to: string,
    subject: string,
    html: string,
    from?: string
): Promise<void> {
    const account = await prisma.emailAccount.findUnique({
        where: { id: accountId },
        select: {
            email: true,
            name: true,
            oauthClientId: true,
            oauthClientSecret: true,
        },
    });

    if (!account) {
        throw new Error('Email account not found');
    }

    const accessToken = await getValidAccessToken(accountId);

    const oauth2Client = new google.auth.OAuth2(
        account.oauthClientId!,
        decrypt(account.oauthClientSecret!)
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create email message
    const fromAddress = from || `"${account.name}" <${account.email}>`;
    const message = [
        `From: ${fromAddress}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html,
    ].join('\n');

    // Encode message in base64url
    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    // Send email
    await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage,
        },
    });
}
