import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin, DEFAULT_PERMISSIONS } from '@/lib/permissions';

/**
 * GET /api/roles
 * List all roles
 */
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

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get all roles with counts
        const roles = await prisma.role.findMany({
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
            },
            orderBy: [{ departmentId: 'asc' }, { name: 'asc' }],
        });

        return NextResponse.json(roles);
    } catch (error: any) {
        console.error('Error fetching roles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch roles' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/roles
 * Create new role (Admin only)
 */
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

        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const { name, departmentId, permissions, scope, isActive } = body;

        // Validation
        if (!name || !permissions) {
            return NextResponse.json(
                { error: 'Name and permissions are required' },
                { status: 400 }
            );
        }

        // Validate permissions JSON
        try {
            JSON.parse(permissions);
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid permissions JSON' },
                { status: 400 }
            );
        }

        // Create role
        const role = await prisma.role.create({
            data: {
                name,
                departmentId: departmentId || null,
                permissions,
                scope: scope || 'department',
                isActive: isActive ?? true,
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
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'Role',
                entityId: role.id.toString(),
                details: JSON.stringify({ name, departmentId, scope }),
                userId: user.id,
            },
        });

        return NextResponse.json(role, { status: 201 });
    } catch (error: any) {
        console.error('Error creating role:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Role with this name already exists in this department' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create role' },
            { status: 500 }
        );
    }
}
