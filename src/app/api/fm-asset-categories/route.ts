import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/fm-asset-categories - List all FM asset categories
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user || !hasPermission(user, 'fm_assets', 'view')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const categories = await prisma.fMAssetCategory.findMany({
            include: {
                _count: {
                    select: {
                        assets: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching FM asset categories:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/fm-asset-categories - Create new FM asset category
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user || !hasPermission(user, 'fm_assets', 'create')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, icon, color } = body;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Check if category name already exists
        const existing = await prisma.fMAssetCategory.findFirst({
            where: {
                name: name,
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Category name already exists' },
                { status: 409 }
            );
        }

        const category = await prisma.fMAssetCategory.create({
            data: {
                name,
                description,
                icon,
                color,
            },
            include: {
                _count: {
                    select: {
                        assets: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'FMAssetCategory',
                entityId: category.id.toString(),
                details: JSON.stringify({ name, description }),
                userId: user.id,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating FM asset category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
