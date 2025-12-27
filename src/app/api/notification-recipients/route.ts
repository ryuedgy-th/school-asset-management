import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

/**
 * GET /api/notification-recipients
 * Get all notification recipients, optionally filtered by category
 */
export async function GET(request: NextRequest) {
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

        if (!user || !hasPermission(user, 'settings', 'view')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        // Build where clause
        const where: any = {};
        if (category) {
            where.category = category;
        }

        // Fetch recipients
        const recipients = await prisma.notificationRecipient.findMany({
            where,
            orderBy: [
                { category: 'asc' },
                { recipientType: 'asc' },
                { role: 'asc' },
            ],
        });

        return NextResponse.json(recipients);
    } catch (error: any) {
        console.error('Error fetching notification recipients:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notification recipients' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/notification-recipients
 * Create a new notification recipient
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { category, recipientType, role, email, name, isActive } = body;

        // Validation
        if (!category || !recipientType || !role) {
            return NextResponse.json(
                { error: 'Missing required fields: category, recipientType, role' },
                { status: 400 }
            );
        }

        // Validate recipientType
        const validTypes = ['to', 'cc', 'bcc', 'reply_to'];
        if (!validTypes.includes(recipientType)) {
            return NextResponse.json(
                { error: 'Invalid recipientType. Must be: to, cc, bcc, or reply_to' },
                { status: 400 }
            );
        }

        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check for duplicates
        const existing = await prisma.notificationRecipient.findFirst({
            where: {
                category,
                recipientType,
                role,
                email: email || null,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Recipient with same category, type, role, and email already exists' },
                { status: 409 }
            );
        }

        // Create recipient
        const recipient = await prisma.notificationRecipient.create({
            data: {
                category,
                recipientType,
                role,
                email: email || null,
                name: name || null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(recipient, { status: 201 });
    } catch (error: any) {
        console.error('Error creating notification recipient:', error);
        return NextResponse.json(
            { error: 'Failed to create notification recipient' },
            { status: 500 }
        );
    }
}
