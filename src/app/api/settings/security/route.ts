import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSecuritySettingsMetadata } from '@/lib/system-settings';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/security
 * Get security settings (admin only)
 */
export async function GET() {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        // Check if admin
        if (user?.role !== 'Admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        // Get security settings metadata
        const metadata = await getSecuritySettingsMetadata();

        // Get updater info if available
        let updatedByName = null;
        if (metadata.updatedBy) {
            const updater = await prisma.user.findUnique({
                where: { id: metadata.updatedBy },
                select: { name: true, email: true }
            });
            updatedByName = updater?.name || updater?.email;
        }

        return NextResponse.json({
            scanPasscodeEnabled: metadata.scanPasscodeEnabled,
            lastUpdated: metadata.lastUpdated,
            updatedBy: updatedByName
        });
    } catch (error: any) {
        console.error('Error fetching security settings:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
