import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { auth } from '@/auth';

// GET - Get single email account
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const account = await prisma.emailAccount.findUnique({
            where: { id: parseInt(id) },
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
                oauthClientId: true,
                oauthTokenExpiry: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!account) {
            return NextResponse.json(
                { error: 'Email account not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(account);
    } catch (error) {
        console.error('Error fetching email account:', error);
        return NextResponse.json(
            { error: 'Failed to fetch email account' },
            { status: 500 }
        );
    }
}

// PUT - Update email account
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        const {
            name,
            email,
            isDefault,
            isActive,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpSecure,
            accessToken,
            refreshToken,
            tokenExpiry,
        } = body;

        // If setting as default, unset other defaults
        if (isDefault) {
            await prisma.emailAccount.updateMany({
                where: {
                    isDefault: true,
                    id: { not: parseInt(id) }
                },
                data: { isDefault: false }
            });
        }

        // Encrypt sensitive data if provided
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

        const account = await prisma.emailAccount.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                isDefault,
                isActive,
                smtpHost,
                smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
                smtpUser,
                smtpSecure,
                tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : undefined,
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
                updatedAt: true,
            }
        });

        return NextResponse.json(account);
    } catch (error: any) {
        console.error('Error updating email account:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Email account not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update email account' },
            { status: 500 }
        );
    }
}

// DELETE - Delete email account
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if this is the default account
        const account = await prisma.emailAccount.findUnique({
            where: { id: parseInt(id) }
        });

        if (account?.isDefault) {
            return NextResponse.json(
                { error: 'Cannot delete default email account. Set another account as default first.' },
                { status: 400 }
            );
        }

        await prisma.emailAccount.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting email account:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Email account not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete email account' },
            { status: 500 }
        );
    }
}
