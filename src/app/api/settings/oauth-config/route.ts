import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

// GET - Read current OAuth config
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin permission
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { userRole: true }
        });

        if (!user || !hasPermission(user, 'settings', 'edit')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Read from SystemSettings
        const clientIdSetting = await prisma.systemSettings.findUnique({
            where: { key: 'oauth_google_client_id' }
        });

        const clientSecretSetting = await prisma.systemSettings.findUnique({
            where: { key: 'oauth_google_client_secret' }
        });

        const config = {
            googleClientId: clientIdSetting?.value || process.env.AUTH_GOOGLE_ID || '',
            googleClientSecret: clientSecretSetting?.value
                ? maskSecret(decrypt(clientSecretSetting.value))
                : maskSecret(process.env.AUTH_GOOGLE_SECRET || '')
        };

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching OAuth config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update OAuth config
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin permission
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { userRole: true }
        });

        if (!user || !hasPermission(user, 'settings', 'edit')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { googleClientId, googleClientSecret } = body;

        if (!googleClientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        // Update Client ID in database
        await prisma.systemSettings.upsert({
            where: { key: 'oauth_google_client_id' },
            update: {
                value: googleClientId,
                category: 'integration',
                isSecret: false,
                updatedBy: user.id
            },
            create: {
                key: 'oauth_google_client_id',
                value: googleClientId,
                category: 'integration',
                isSecret: false,
                updatedBy: user.id
            }
        });

        // Update Client Secret in database (only if not masked)
        if (googleClientSecret && !googleClientSecret.includes('***')) {
            await prisma.systemSettings.upsert({
                where: { key: 'oauth_google_client_secret' },
                update: {
                    value: encrypt(googleClientSecret),
                    category: 'integration',
                    isSecret: true,
                    updatedBy: user.id
                },
                create: {
                    key: 'oauth_google_client_secret',
                    value: encrypt(googleClientSecret),
                    category: 'integration',
                    isSecret: true,
                    updatedBy: user.id
                }
            });
        }

        // Update .env file
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const envPath = path.join(process.cwd(), '.env');
            let envContent = await fs.readFile(envPath, 'utf-8');

            // Update or add AUTH_GOOGLE_ID
            if (envContent.includes('AUTH_GOOGLE_ID=')) {
                envContent = envContent.replace(
                    /AUTH_GOOGLE_ID=.*/g,
                    `AUTH_GOOGLE_ID=${googleClientId}`
                );
            } else {
                envContent += `\nAUTH_GOOGLE_ID=${googleClientId}`;
            }

            // Update or add AUTH_GOOGLE_SECRET (only if not masked)
            if (googleClientSecret && !googleClientSecret.includes('***')) {
                if (envContent.includes('AUTH_GOOGLE_SECRET=')) {
                    envContent = envContent.replace(
                        /AUTH_GOOGLE_SECRET=.*/g,
                        `AUTH_GOOGLE_SECRET=${googleClientSecret}`
                    );
                } else {
                    envContent += `\nAUTH_GOOGLE_SECRET=${googleClientSecret}`;
                }
            }

            await fs.writeFile(envPath, envContent, 'utf-8');

            return NextResponse.json({
                success: true,
                message: 'Configuration updated successfully! Please restart the server for changes to take effect.',
                envUpdated: true
            });
        } catch (envError) {
            console.error('Error updating .env file:', envError);
            return NextResponse.json({
                success: true,
                message: 'Configuration saved to database, but failed to update .env file. Please update manually.',
                envUpdated: false
            });
        }
    } catch (error) {
        console.error('Error updating OAuth config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function maskSecret(secret: string): string {
    if (!secret || secret.length < 8) return '***';
    return '***' + secret.slice(-4);
}
