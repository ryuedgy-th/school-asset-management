import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch all categories
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRole: true, userDepartment: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check view permission
        const canView = await hasPermission(user, 'stationary', 'view');
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const categories = await prisma.stationaryCategory.findMany({
            where: { isActive: true },
            include: {
                parent: { select: { id: true, code: true, name: true } },
                children: { select: { id: true, code: true, name: true } },
                _count: { select: { items: true } },
            },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new category
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRole: true, userDepartment: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check create permission
        const canCreate = await hasPermission(user, 'stationary', 'create');
        if (!canCreate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { code, name, description, parentId, sortOrder } = body;

        // Validate required fields
        if (!code || !name) {
            return NextResponse.json(
                { error: 'Code and name are required' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.stationaryCategory.findUnique({
            where: { code },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Category code already exists' },
                { status: 409 }
            );
        }

        const category = await prisma.stationaryCategory.create({
            data: {
                code: code.toUpperCase(),
                name,
                description,
                parentId: parentId ? parseInt(parentId) : null,
                sortOrder: sortOrder || 0,
            },
            include: {
                parent: { select: { id: true, code: true, name: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'StationaryCategory',
                entityId: category.id.toString(),
                details: JSON.stringify({ code: category.code, name: category.name }),
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
