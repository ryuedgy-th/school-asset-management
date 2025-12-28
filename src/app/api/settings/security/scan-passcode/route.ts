import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateScanPasscode } from '@/lib/system-settings';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * POST /api/settings/security/scan-passcode
 * Update scan passcode (admin only)
 */
export async function POST(request: NextRequest) {
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

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if admin
        if (user.role !== 'Admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { newPasscode } = body;

        // Validate input
        if (!newPasscode) {
            return NextResponse.json(
                { error: 'Missing required field: newPasscode' },
                { status: 400 }
            );
        }

        // Validate new passcode format
        if (!/^[A-Za-z0-9]{6,20}$/.test(newPasscode)) {
            return NextResponse.json(
                { error: 'Passcode must be 6-20 alphanumeric characters' },
                { status: 400 }
            );
        }

        // Update passcode
        await updateScanPasscode(newPasscode, user.id);

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'SystemSettings',
                entityId: 'scan_passcode',
                details: JSON.stringify({
                    setting: 'scan_passcode',
                    action: 'changed',
                    category: 'security',
                    note: 'Scan passcode updated via Security Settings'
                }),
                userId: user.id
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Scan passcode updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating scan passcode:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
