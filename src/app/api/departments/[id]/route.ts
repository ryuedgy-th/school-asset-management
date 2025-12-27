import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';

/**
 * GET /api/departments/[id]
 * Get department details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const departmentId = parseInt(params.id);
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                _count: {
                    select: {
                        users: true,
                        roles: true,
                        assets: true,
                        inspections: true,
                    },
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        userRole: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    take: 10,
                },
                roles: {
                    select: {
                        id: true,
                        name: true,
                        scope: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json(department);
    } catch (error: any) {
        console.error('Error fetching department:', error);
        return NextResponse.json(
            { error: 'Failed to fetch department' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/departments/[id]
 * Update department (Admin only)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const departmentId = parseInt(params.id);
        const body = await request.json();
        const { name, description, isActive } = body;

        // Update department
        const department = await prisma.department.update({
            where: { id: departmentId },
            data: {
                name,
                description,
                isActive,
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        roles: true,
                        assets: true,
                        inspections: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'Department',
                entityId: department.id.toString(),
                details: JSON.stringify({ name, description, isActive }),
                userId: user.id,
            },
        });

        return NextResponse.json(department);
    } catch (error: any) {
        console.error('Error updating department:', error);
        return NextResponse.json(
            { error: 'Failed to update department' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/departments/[id]
 * Delete department (Admin only)
 * Cannot delete if has users, roles, assets, or inspections
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const departmentId = parseInt(params.id);

        // Check if department has any data
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                _count: {
                    select: {
                        users: true,
                        roles: true,
                        assets: true,
                        inspections: true,
                    },
                },
            },
        });

        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        const totalCount =
            department._count.users +
            department._count.roles +
            department._count.assets +
            department._count.inspections;

        if (totalCount > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete department with existing data',
                    details: {
                        users: department._count.users,
                        roles: department._count.roles,
                        assets: department._count.assets,
                        inspections: department._count.inspections,
                    },
                },
                { status: 400 }
            );
        }

        // Delete department
        await prisma.department.delete({
            where: { id: departmentId },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'Department',
                entityId: departmentId.toString(),
                details: JSON.stringify({ code: department.code, name: department.name }),
                userId: user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting department:', error);
        return NextResponse.json(
            { error: 'Failed to delete department' },
            { status: 500 }
        );
    }
}
