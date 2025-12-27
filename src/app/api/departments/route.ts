import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';

/**
 * GET /api/departments
 * List all departments
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

        // Get all departments with counts
        const departments = await prisma.department.findMany({
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
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(departments);
    } catch (error: any) {
        console.error('Error fetching departments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch departments' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/departments
 * Create new department (Admin only)
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
        const { code, name, description, isActive } = body;

        // Validation
        if (!code || !name) {
            return NextResponse.json(
                { error: 'Code and name are required' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.department.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Department code already exists' },
                { status: 400 }
            );
        }

        // Create department
        const department = await prisma.department.create({
            data: {
                code: code.toUpperCase(),
                name,
                description,
                isActive: isActive ?? true,
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
                action: 'CREATE',
                entity: 'Department',
                entityId: department.id.toString(),
                details: JSON.stringify({ code, name }),
                userId: user.id,
            },
        });

        return NextResponse.json(department, { status: 201 });
    } catch (error: any) {
        console.error('Error creating department:', error);
        return NextResponse.json(
            { error: 'Failed to create department' },
            { status: 500 }
        );
    }
}
