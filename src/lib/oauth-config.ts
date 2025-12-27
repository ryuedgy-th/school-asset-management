import { prisma } from './prisma';
import { decrypt } from './encryption';

/**
 * Get OAuth configuration from database or fallback to environment variables
 */
export async function getOAuthConfig() {
    try {
        // Try to read from database first
        const clientIdSetting = await prisma.systemSettings.findUnique({
            where: { key: 'oauth_google_client_id' }
        });

        const clientSecretSetting = await prisma.systemSettings.findUnique({
            where: { key: 'oauth_google_client_secret' }
        });

        if (clientIdSetting?.value && clientSecretSetting?.value) {
            return {
                clientId: clientIdSetting.value,
                clientSecret: decrypt(clientSecretSetting.value)
            };
        }
    } catch (error) {
        console.warn('Failed to read OAuth config from database, falling back to .env:', error);
    }

    // Fallback to environment variables
    return {
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET
    };
}
