import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';

/**
 * PUT /api/users/[id]/role
 * Assign role to user (Admin only)
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!currentUser || !isAdmin(currentUser)) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const params = await context.params;
        const userId = parseInt(params.id);
        const body = await request.json();
        const { roleId, departmentId } = body;

        // Validate role exists
        if (roleId) {
            const role = await prisma.role.findUnique({
                where: { id: roleId },
                include: { department: true },
            });

            if (!role) {
                return NextResponse.json({ error: 'Role not found' }, { status: 404 });
            }

            // If role has a department, auto-assign user to that department
            if (role.departmentId && !departmentId) {
                const user = await prisma.user.update({
                    where: { id: userId },
                    data: {
                        roleId,
                        departmentId: role.departmentId,
                    },
                    include: {
                        userRole: {
                            select: {
                                id: true,
                                name: true,
                                scope: true,
                            },
                        },
                        userDepartment: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                });

                // Audit log
                await prisma.auditLog.create({
                    data: {
                        action: 'UPDATE',
                        entity: 'User',
                        entityId: userId.toString(),
                        details: JSON.stringify({
                            roleId,
                            departmentId: role.departmentId,
                            roleName: role.name,
                        }),
                        userId: currentUser.id,
                    },
                });

                return NextResponse.json(user);
            }
        }

        // Update user role and department
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                roleId: roleId || null,
                departmentId: departmentId || null,
            },
            include: {
                userRole: {
                    select: {
                        id: true,
                        name: true,
                        scope: true,
                    },
                },
                userDepartment: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'User',
                entityId: userId.toString(),
                details: JSON.stringify({ roleId, departmentId }),
                userId: currentUser.id,
            },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Error assigning role:', error);
        return NextResponse.json(
            { error: 'Failed to assign role' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[id]/role
 * Remove role from user (Admin only)
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!currentUser || !isAdmin(currentUser)) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const params = await context.params;
        const userId = parseInt(params.id);

        // Remove role (keep department)
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                roleId: null,
            },
            include: {
                userDepartment: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE',
                entity: 'User',
                entityId: userId.toString(),
                details: JSON.stringify({ action: 'remove_role' }),
                userId: currentUser.id,
            },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Error removing role:', error);
        return NextResponse.json(
            { error: 'Failed to remove role' },
            { status: 500 }
        );
    }
}
