/**
 * Seed Scan Passcode to Database
 * Migrates SCAN_PASSCODE from .env to database
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simple encryption (same as in encryption.ts)
function encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32bytes';
    const iv = crypto.randomBytes(16);

    // Ensure key is 32 bytes
    const keyBuffer = Buffer.from(key.padEnd(32, '0').substring(0, 32));

    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

async function main() {
    console.log('🔐 Migrating scan passcode to database...');

    // Get passcode from environment
    const passcode = process.env.SCAN_PASSCODE || 'MYIS2024';
    console.log(`📝 Using passcode from environment: ${passcode.substring(0, 4)}****`);

    // Encrypt passcode
    const encryptedPasscode = encrypt(passcode);

    // Upsert to database
    await prisma.systemSettings.upsert({
        where: { key: 'scan_passcode' },
        update: {
            value: encryptedPasscode,
            category: 'security',
            isSecret: true,
            updatedAt: new Date()
        },
        create: {
            key: 'scan_passcode',
            value: encryptedPasscode,
            category: 'security',
            isSecret: true
        }
    });

    console.log('✅ Scan passcode migrated successfully!');

    // Also set enabled flag
    await prisma.systemSettings.upsert({
        where: { key: 'scan_passcode_enabled' },
        update: {
            value: 'true',
            category: 'security',
            isSecret: false,
            updatedAt: new Date()
        },
        create: {
            key: 'scan_passcode_enabled',
            value: 'true',
            category: 'security',
            isSecret: false
        }
    });

    console.log('✅ Scan passcode protection enabled!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Visit /settings/security to manage the passcode');
    console.log('   2. You can now change the passcode from the UI');
    console.log('   3. The .env SCAN_PASSCODE will be used as fallback');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
