const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

function getKey(salt) {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error('ENCRYPTION_SECRET not found in environment');
    }
    return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha512');
}

// Match the encryption.ts implementation
function encrypt(text) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey(salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

async function seedOAuthConfig() {
    console.log('🔧 Seeding OAuth configuration...');

    // Read from .env
    const googleClientId = process.env.AUTH_GOOGLE_ID || '';
    const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || '';

    if (!googleClientId || !googleClientSecret) {
        console.log('⚠️  No OAuth credentials found in .env, skipping...');
        return;
    }

    console.log('📝 Found OAuth credentials in .env');
    console.log('   Client ID:', googleClientId.substring(0, 20) + '...');

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

    console.log('✅ Saved Google Client ID to database');

    const encryptedSecret = encrypt(googleClientSecret);

    await prisma.systemSettings.upsert({
        where: { key: 'oauth_google_client_secret' },
        update: {
            value: encryptedSecret,
            category: 'integration',
            isSecret: true
        },
        create: {
            key: 'oauth_google_client_secret',
            value: encryptedSecret,
            category: 'integration',
            isSecret: true
        }
    });

    console.log('✅ Saved Google Client Secret to database (encrypted with AES-256-GCM)');
    console.log('\n✨ OAuth configuration migrated successfully!');
    console.log('   You can now manage these settings via the UI at /settings/email');
}

seedOAuthConfig()
    .catch((e) => {
        console.error('❌ Error seeding OAuth config:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
