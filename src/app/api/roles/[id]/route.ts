import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';

/**
 * GET /api/roles/[id]
 * Get role details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Next.js 15: params is now a Promise
        const resolvedParams = await params;
        const roleId = parseInt(resolvedParams.id);
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: {
                department: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        userDepartment: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    take: 20,
                },
            },
        });

        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        return NextResponse.json(role);
    } catch (error: any) {
        console.error('Error fetching role:', error);
        return NextResponse.json(
            { error: 'Failed to fetch role' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/roles/[id]
 * Update role (Admin only)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        if (!user || !await isAdmin(user.id)) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        // Next.js 15: params is now a Promise
        const resolvedParams = await params;
        const roleId = parseInt(resolvedParams.id);
        const body = await request.json();
        const { name, scope, isActive, departmentId, permissionIds } = body;



        // Update role permissions if provided
        if (permissionIds !== undefined && Array.isArray(permissionIds)) {
            try {

                // Delete existing permissions
                await prisma.rolePermission.deleteMany({
                    where: { roleId },
                });



                // Create new permissions individually (createMany not supported due to composite unique)
                for (const permissionId of permissionIds) {
                    if (typeof permissionId !== 'number') {
                        continue;
                    }

                    await prisma.rolePermission.create({
                        data: {
                            roleId,
                            permissionId,
                        },
                    });
                }


            } catch (permError: any) {

                throw new Error(`Failed to update permissions: ${permError.message}`);
            }
        }

        // Update role
        const role = await prisma.role.update({
            where: { id: roleId },
            data: {
                name,
                scope,
                isActive,
                departmentId: departmentId || null,
            },
            include: {
                department: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        rolePermissions: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'Role',
                entityId: role.id.toString(),
                details: JSON.stringify({ name, scope, isActive, permissionCount: permissionIds?.length }),
                userId: user.id,
            },
        });

        return NextResponse.json(role);
    } catch (error: any) {

        return NextResponse.json(
            {
                error: 'Failed to update role',
                details: error.message,
                code: error.code
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/roles/[id]
 * Delete role (Admin only)
 * Cannot delete if has users assigned
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        if (!user || !await isAdmin(user.id)) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        // Next.js 15: params is now a Promise
        const resolvedParams = await params;
        const roleId = parseInt(resolvedParams.id);

        // Check if role has users
        const role = await prisma.role.findUnique({
            where: { id: roleId },
            include: {
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });

        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        if (role._count.users > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete role with assigned users',
                    details: { userCount: role._count.users },
                },
                { status: 400 }
            );
        }

        // Delete role
        await prisma.role.delete({
            where: { id: roleId },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'Role',
                entityId: roleId.toString(),
                details: JSON.stringify({ name: role.name }),
                userId: user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting role:', error);
        return NextResponse.json(
            { error: 'Failed to delete role' },
            { status: 500 }
        );
    }
}
