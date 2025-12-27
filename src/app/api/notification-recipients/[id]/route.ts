import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

/**
 * PUT /api/notification-recipients/[id]
 * Update a notification recipient
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user with permissions
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { userRole: true },
        });

        if (!user || !hasPermission(user, 'settings', 'edit')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Check if recipient exists
        const existing = await prisma.notificationRecipient.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }

        const body = await request.json();
        const { category, recipientType, role, email, name, isActive } = body;

        // Validate recipientType if provided
        if (recipientType) {
            const validTypes = ['to', 'cc', 'bcc', 'reply_to'];
            if (!validTypes.includes(recipientType)) {
                return NextResponse.json(
                    { error: 'Invalid recipientType. Must be: to, cc, bcc, or reply_to' },
                    { status: 400 }
                );
            }
        }

        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Update recipient
        const recipient = await prisma.notificationRecipient.update({
            where: { id },
            data: {
                ...(category && { category }),
                ...(recipientType && { recipientType }),
                ...(role && { role }),
                ...(email !== undefined && { email: email || null }),
                ...(name !== undefined && { name: name || null }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(recipient);
    } catch (error: any) {
        console.error('Error updating notification recipient:', error);
        return NextResponse.json(
            { error: 'Failed to update notification recipient' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/notification-recipients/[id]
 * Delete a notification recipient
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user with permissions
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { userRole: true },
        });

        if (!user || !hasPermission(user, 'settings', 'edit')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Check if recipient exists
        const existing = await prisma.notificationRecipient.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }

        // Delete recipient
        await prisma.notificationRecipient.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Recipient deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting notification recipient:', error);
        return NextResponse.json(
            { error: 'Failed to delete notification recipient' },
            { status: 500 }
        );
    }
}
