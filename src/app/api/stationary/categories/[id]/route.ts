import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch single category
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const categoryId = parseInt(params.id);

        const category = await prisma.stationaryCategory.findUnique({
            where: { id: categoryId },
            include: {
                parent: { select: { id: true, code: true, name: true } },
                children: { select: { id: true, code: true, name: true } },
                items: {
                    select: {
                        id: true,
                        itemCode: true,
                        name: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update category
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        // Check edit permission
        const canEdit = await hasPermission(user, 'stationary', 'edit');
        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const categoryId = parseInt(params.id);
        const body = await req.json();
        const { code, name, description, parentId, sortOrder, isActive } = body;

        // Check if category exists
        const existing = await prisma.stationaryCategory.findUnique({
            where: { id: categoryId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // If code is being changed, check for duplicates
        if (code && code !== existing.code) {
            const duplicate = await prisma.stationaryCategory.findUnique({
                where: { code: code.toUpperCase() },
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: 'Category code already exists' },
                    { status: 409 }
                );
            }
        }

        const category = await prisma.stationaryCategory.update({
            where: { id: categoryId },
            data: {
                ...(code && { code: code.toUpperCase() }),
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(parentId !== undefined && { parentId: parentId ? parseInt(parentId) : null }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                parent: { select: { id: true, code: true, name: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE',
                entity: 'StationaryCategory',
                entityId: category.id.toString(),
                details: JSON.stringify({ code: category.code, name: category.name }),
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Delete category
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        // Check delete permission
        const canDelete = await hasPermission(user, 'stationary', 'delete');
        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const params = await context.params;
        const categoryId = parseInt(params.id);

        // Check if category exists
        const category = await prisma.stationaryCategory.findUnique({
            where: { id: categoryId },
            include: {
                items: { select: { id: true } },
                children: { select: { id: true } },
            },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Check if category has items
        if (category.items.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with items. Please reassign items first.' },
                { status: 409 }
            );
        }

        // Check if category has children
        if (category.children.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with subcategories. Please delete subcategories first.' },
                { status: 409 }
            );
        }

        // Soft delete by setting isActive to false
        await prisma.stationaryCategory.update({
            where: { id: categoryId },
            data: { isActive: false },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DELETE',
                entity: 'StationaryCategory',
                entityId: category.id.toString(),
                details: JSON.stringify({ code: category.code, name: category.name }),
            },
        });

        return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
