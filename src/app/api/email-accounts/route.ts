import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { auth } from '@/auth';

// GET - List all email accounts
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accounts = await prisma.emailAccount.findMany({
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ],
            select: {
                id: true,
                name: true,
                email: true,
                type: true,
                isDefault: true,
                isActive: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpSecure: true,
                oauthProvider: true,
                tokenExpiry: true,
                createdAt: true,
                updatedAt: true,
                // Don't send passwords/tokens to frontend
            }
        });

        return NextResponse.json(accounts);
    } catch (error) {
        console.error('Error fetching email accounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch email accounts' },
            { status: 500 }
        );
    }
}

// POST - Create new email account
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            name,
            email,
            type,
            isDefault,
            // SMTP fields
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpSecure,
            // OAuth fields
            oauthProvider,
            accessToken,
            refreshToken,
            tokenExpiry,
        } = body;

        // Validate required fields
        if (!name || !email || !type) {
            return NextResponse.json(
                { error: 'Name, email, and type are required' },
                { status: 400 }
            );
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await prisma.emailAccount.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        // Encrypt sensitive data
        const encryptedData: any = {};
        if (smtpPassword) {
            encryptedData.smtpPassword = encrypt(smtpPassword);
        }
        if (accessToken) {
            encryptedData.accessToken = encrypt(accessToken);
        }
        if (refreshToken) {
            encryptedData.refreshToken = encrypt(refreshToken);
        }

        const account = await prisma.emailAccount.create({
            data: {
                name,
                email,
                type,
                isDefault: isDefault || false,
                smtpHost,
                smtpPort: smtpPort ? parseInt(smtpPort) : null,
                smtpUser,
                smtpSecure: smtpSecure !== false,
                oauthProvider,
                tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
                ...encryptedData,
            },
            select: {
                id: true,
                name: true,
                email: true,
                type: true,
                isDefault: true,
                isActive: true,
                createdAt: true,
            }
        });

        return NextResponse.json(account, { status: 201 });
    } catch (error: any) {
        console.error('Error creating email account:', error);

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Email account already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create email account' },
            { status: 500 }
        );
    }
}
