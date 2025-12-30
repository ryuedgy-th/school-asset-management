import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch all locations
export async function GET(req: NextRequest) {
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

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const departmentId = searchParams.get('departmentId');
        const isActive = searchParams.get('isActive');

        const where: any = {};

        if (type) where.type = type;
        if (departmentId) where.departmentId = parseInt(departmentId);
        if (isActive !== null) where.isActive = isActive === 'true';

        const locations = await prisma.stationaryLocation.findMany({
            where,
            include: {
                department: { select: { id: true, code: true, name: true } },
                managedBy: { select: { id: true, name: true, email: true } },
                _count: { select: { stock: true } },
            },
            orderBy: { code: 'asc' },
        });

        return NextResponse.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new location
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

        // Check edit permission
        const canEdit = await hasPermission(user, 'stationary', 'edit');
        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { code, name, type, departmentId, managedById, address, capacity } = body;

        // Validate required fields
        if (!code || !name || !type) {
            return NextResponse.json(
                { error: 'Code, name, and type are required' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.stationaryLocation.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Location code already exists' },
                { status: 409 }
            );
        }

        const location = await prisma.stationaryLocation.create({
            data: {
                code: code.toUpperCase(),
                name,
                type,
                departmentId: departmentId ? parseInt(departmentId) : null,
                managedById: managedById ? parseInt(managedById) : null,
                address: address || null,
                capacity: capacity || null,
            },
            include: {
                department: { select: { id: true, code: true, name: true } },
                managedBy: { select: { id: true, name: true, email: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'StationaryLocation',
                entityId: location.id.toString(),
                details: JSON.stringify({ code: location.code, name: location.name }),
            },
        });

        return NextResponse.json(location, { status: 201 });
    } catch (error) {
        console.error('Error creating location:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
