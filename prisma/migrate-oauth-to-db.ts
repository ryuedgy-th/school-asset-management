import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/lib/encryption';

const prisma = new PrismaClient();

async function seedOAuthConfig() {
    console.log('🔧 Seeding OAuth configuration...');

    // Read from .env
    const googleClientId = process.env.AUTH_GOOGLE_ID || '';
    const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || '';

    if (!googleClientId || !googleClientSecret) {
        console.log('⚠️  No OAuth credentials found in .env, skipping...');
        return;
    }

    // Store in SystemSettings
    await prisma.systemSettings.upsert({
        where: { key: 'oauth_google_client_id' },
        update: {
            value: googleClientId,
            category: 'integration',
            isSecret: false
        },
        create: {
            key: 'oauth_google_client_id',
            value: googleClientId,
            category: 'integration',
            isSecret: false
        }
    });

    await prisma.systemSettings.upsert({
        where: { key: 'oauth_google_client_secret' },
        update: {
            value: encrypt(googleClientSecret),
            category: 'integration',
            isSecret: true
        },
        create: {
            key: 'oauth_google_client_secret',
            value: encrypt(googleClientSecret),
            category: 'integration',
            isSecret: true
        }
    });

    console.log('✅ OAuth configuration seeded successfully');
}

seedOAuthConfig()
    .catch((e) => {
        console.error('Error seeding OAuth config:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
