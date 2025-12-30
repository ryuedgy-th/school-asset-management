import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch all returns
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
        const departmentId = searchParams.get('departmentId');
        const returnedById = searchParams.get('returnedById');
        const status = searchParams.get('status');

        const where: any = {};

        if (departmentId) where.departmentId = parseInt(departmentId);
        if (returnedById) where.returnedById = parseInt(returnedById);
        if (status) where.status = status;

        const returns = await prisma.stationaryReturn.findMany({
            where,
            include: {
                returnedBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, code: true, name: true } },
                items: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                itemCode: true,
                                name: true,
                                uom: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(returns);
    } catch (error) {
        console.error('Error fetching returns:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new return
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

        const body = await req.json();
        const {
            departmentId,
            returnReason,
            items, // Array of { itemId, quantity, condition }
        } = body;

        // Validate required fields
        if (!departmentId || !returnReason || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Department, reason, and items are required' },
                { status: 400 }
            );
        }

        // Generate return number: RET-YYYY-NNNN
        const year = new Date().getFullYear();
        const lastReturn = await prisma.stationaryReturn.findFirst({
            where: {
                returnNo: { startsWith: `RET-${year}-` },
            },
            orderBy: { returnNo: 'desc' },
        });

        let nextNumber = 1;
        if (lastReturn) {
            const lastNumber = parseInt(lastReturn.returnNo.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        const returnNo = `RET-${year}-${nextNumber.toString().padStart(4, '0')}`;

        // Create return
        const returnRecord = await prisma.stationaryReturn.create({
            data: {
                returnNo,
                returnedById: userId,
                departmentId: parseInt(departmentId),
                returnReason,
                status: 'pending',
                items: {
                    create: items.map((item: any) => ({
                        itemId: parseInt(item.itemId),
                        quantity: parseInt(item.quantity),
                        condition: item.condition || 'good',
                    })),
                },
            },
            include: {
                returnedBy: true,
                department: true,
                items: {
                    include: {
                        item: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'StationaryReturn',
                entityId: returnRecord.id.toString(),
                details: JSON.stringify({
                    returnNo: returnRecord.returnNo,
                    itemCount: items.length,
                }),
            },
        });

        return NextResponse.json(returnRecord, { status: 201 });
    } catch (error) {
        console.error('Error creating return:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
