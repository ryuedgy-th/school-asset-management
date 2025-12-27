import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

// POST - Test OAuth connection
export async function POST(req: NextRequest) {
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

        // Read current config
        const clientIdSetting = await prisma.systemSettings.findUnique({
            where: { key: 'oauth_google_client_id' }
        });

        if (!clientIdSetting?.value) {
            return NextResponse.json({
                error: 'Google Client ID not configured'
            }, { status: 400 });
        }

        // Simple validation test
        const clientId = clientIdSetting.value;
        const isValid = clientId.endsWith('.apps.googleusercontent.com');

        if (isValid) {
            return NextResponse.json({
                success: true,
                message: '✅ Configuration looks valid! Client ID format is correct.'
            });
        } else {
            return NextResponse.json({
                error: '⚠️ Client ID format appears invalid. Should end with .apps.googleusercontent.com'
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Error testing OAuth config:', error);
        return NextResponse.json({
            error: 'Test failed: ' + (error as Error).message
        }, { status: 500 });
    }
}
