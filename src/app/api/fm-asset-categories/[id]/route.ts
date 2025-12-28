import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// GET /api/fm-asset-categories/[id] - Get single FM asset category
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        const params = await context.params;
        const categoryId = parseInt(params.id);

        const category = await prisma.fMAssetCategory.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: {
                        assets: true,
                    },
                },
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error fetching FM asset category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/fm-asset-categories/[id] - Update FM asset category
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        if (!user || !hasPermission(user, 'fm_assets', 'edit')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const categoryId = parseInt(params.id);
        const body = await request.json();
        const { name, description, icon, color } = body;

        // Check if category exists
        const existing = await prisma.fMAssetCategory.findUnique({
            where: { id: categoryId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        // Check if new name conflicts with another category
        if (name && name !== existing.name) {
            const duplicate = await prisma.fMAssetCategory.findFirst({
                where: {
                    name: name,
                    id: {
                        not: categoryId,
                    },
                },
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: 'Category name already exists' },
                    { status: 409 }
                );
            }
        }

        const category = await prisma.fMAssetCategory.update({
            where: { id: categoryId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(icon !== undefined && { icon }),
                ...(color !== undefined && { color }),
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
                action: 'UPDATE',
                entity: 'FMAssetCategory',
                entityId: category.id.toString(),
                details: JSON.stringify({ name, description }),
                userId: user.id,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating FM asset category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/fm-asset-categories/[id] - Delete FM asset category
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        if (!user || !hasPermission(user, 'fm_assets', 'delete')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const categoryId = parseInt(params.id);

        // Check if category exists
        const category = await prisma.fMAssetCategory.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: {
                        assets: true,
                    },
                },
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        // Prevent deletion if category has assets
        if (category._count.assets > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete category with existing assets',
                    assetCount: category._count.assets
                },
                { status: 409 }
            );
        }

        await prisma.fMAssetCategory.delete({
            where: { id: categoryId },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'FMAssetCategory',
                entityId: categoryId.toString(),
                details: JSON.stringify({ name: category.name }),
                userId: user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting FM asset category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
