'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'default-key-change-in-production-32';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export async function getSettings(category?: string) {
    const where = category ? { category } : {};

    const settings = await prisma.systemSettings.findMany({
        where,
        orderBy: { key: 'asc' }
    });

    // Decrypt secret values
    return settings.map(s => ({
        ...s,
        value: s.isSecret && s.value ? decrypt(s.value) : s.value
    }));
}

export async function getSetting(key: string) {
    const setting = await prisma.systemSettings.findUnique({
        where: { key }
    });

    if (!setting) return null;

    return {
        ...setting,
        value: setting.isSecret && setting.value ? decrypt(setting.value) : setting.value
    };
}

export async function updateSetting(key: string, value: string, isSecret: boolean = false) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Check if user is admin
    const user = await prisma.user.findUnique({
        where: { id: Number(session.user.id) },
        include: { userRole: true }
    });

    if (user?.userRole?.name !== 'Admin') {
        throw new Error('Only admins can update settings');
    }

    const encryptedValue = isSecret ? encrypt(value) : value;

    await prisma.systemSettings.upsert({
        where: { key },
        update: {
            value: encryptedValue,
            isSecret,
            updatedBy: Number(session.user.id)
        },
        create: {
            key,
            value: encryptedValue,
            isSecret,
            category: key.startsWith('smtp_') ? 'email' : 'general',
            updatedBy: Number(session.user.id)
        }
    });

    revalidatePath('/settings');
    return { success: true };
}

export async function testEmailSettings(config?: {
    smtp_host: string;
    smtp_port: string;
    smtp_user: string;
    smtp_password: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    let smtpHost, smtpPort, smtpUser, smtpPassword;

    if (config) {
        // Use provided config (from form)
        smtpHost = config.smtp_host;
        smtpPort = config.smtp_port;
        smtpUser = config.smtp_user;
        smtpPassword = config.smtp_password;
    } else {
        // Load from database
        const hostSetting = await getSetting('smtp_host');
        const portSetting = await getSetting('smtp_port');
        const userSetting = await getSetting('smtp_user');
        const passwordSetting = await getSetting('smtp_password');

        smtpHost = hostSetting?.value;
        smtpPort = portSetting?.value;
        smtpUser = userSetting?.value;
        smtpPassword = passwordSetting?.value;
    }

    if (!smtpHost || !smtpUser || !smtpPassword) {
        return { success: false, error: 'SMTP settings not configured. Please fill in all required fields.' };
    }

    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPassword
            },
            tls: {
                rejectUnauthorized: false // Accept self-signed certificates
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 10000,
            debug: true, // Enable debug output
            logger: true // Log to console
        });

        // Verify connection
        await transporter.verify();

        await transporter.sendMail({
            from: smtpUser,
            to: session.user.email,
            subject: 'Test Email from School Asset Management',
            html: '<p>✅ This is a test email. Your SMTP settings are working correctly!</p>'
        });

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('SMTP Error:', error);
        return { success: false, error: message };
    }
}
