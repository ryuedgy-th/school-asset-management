import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch requisitions
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
        const status = searchParams.get('status');
        const departmentId = searchParams.get('departmentId');
        const myRequests = searchParams.get('myRequests');
        const pendingMyApproval = searchParams.get('pendingMyApproval');

        const where: any = {};

        if (status) where.status = status;
        if (departmentId) where.departmentId = parseInt(departmentId);
        if (myRequests === 'true') where.requestedById = userId;

        // Filter for items pending user's approval
        if (pendingMyApproval === 'true') {
            where.OR = [
                { status: 'pending_l1', approvedByL1Id: userId },
                { status: 'pending_l2', approvedByL2Id: userId },
            ];
        }

        const requisitions = await prisma.stationaryRequisition.findMany({
            where,
            include: {
                department: { select: { id: true, code: true, name: true } },
                requestedBy: { select: { id: true, name: true, email: true } },
                approvedByL1: { select: { id: true, name: true } },
                approvedByL2: { select: { id: true, name: true } },
                items: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                itemCode: true,
                                name: true,
                                uom: true,
                                unitCost: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(requisitions);
    } catch (error) {
        console.error('Error fetching requisitions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new requisition
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

        // Check create permission
        const canCreate = await hasPermission(user, 'stationary', 'create');
        if (!canCreate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const {
            departmentId,
            requestedForType,
            requestedForUserId,
            purpose,
            urgency,
            items, // Array of { itemId, quantity, estimatedCost }
            comments,
        } = body;

        // Validate required fields
        if (!departmentId || !purpose || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Department, purpose, and items are required' },
                { status: 400 }
            );
        }

        // Calculate total estimated cost
        const totalEstimatedCost = items.reduce(
            (sum: number, item: any) => sum + (parseFloat(item.estimatedCost) || 0),
            0
        );

        // Check department budget
        const budget = await prisma.departmentBudget.findFirst({
            where: {
                departmentId: parseInt(departmentId),
                fiscalYear: new Date().getFullYear(),
            },
        });

        if (budget && totalEstimatedCost > Number(budget.availableAmount)) {
            return NextResponse.json(
                { error: 'Requisition exceeds available department budget' },
                { status: 400 }
            );
        }

        // Generate requisition number: REQ-YYYY-NNNN
        const year = new Date().getFullYear();
        const lastRequisition = await prisma.stationaryRequisition.findFirst({
            where: {
                requisitionNo: { startsWith: `REQ-${year}-` },
            },
            orderBy: { requisitionNo: 'desc' },
        });

        let nextNumber = 1;
        if (lastRequisition) {
            const lastNumber = parseInt(lastRequisition.requisitionNo.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        const requisitionNo = `REQ-${year}-${nextNumber.toString().padStart(4, '0')}`;

        // Create requisition with items
        const requisition = await prisma.stationaryRequisition.create({
            data: {
                requisitionNo,
                departmentId: parseInt(departmentId),
                requestedForType: requestedForType || 'department',
                requestedForUserId: requestedForUserId ? parseInt(requestedForUserId) : null,
                requestedById: userId,
                purpose,
                urgency: urgency || 'normal',
                status: 'draft',
                totalEstimatedCost,
                comments: comments || null,
                items: {
                    create: items.map((item: any) => ({
                        itemId: parseInt(item.itemId),
                        requestedQuantity: parseInt(item.quantity),
                        estimatedUnitCost: parseFloat(item.estimatedCost) / parseInt(item.quantity),
                    })),
                },
            },
            include: {
                department: true,
                requestedBy: true,
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
                entity: 'StationaryRequisition',
                entityId: requisition.id.toString(),
                details: JSON.stringify({
                    requisitionNo: requisition.requisitionNo,
                    totalEstimatedCost,
                    itemCount: items.length,
                }),
            },
        });

        return NextResponse.json(requisition, { status: 201 });
    } catch (error) {
        console.error('Error creating requisition:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
