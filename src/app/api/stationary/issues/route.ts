import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch all issues
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
        const requisitionId = searchParams.get('requisitionId');
        const departmentId = searchParams.get('departmentId');
        const issuedToId = searchParams.get('issuedToId');
        const status = searchParams.get('status');

        const where: any = {};

        if (requisitionId) where.requisitionId = parseInt(requisitionId);
        if (departmentId) where.departmentId = parseInt(departmentId);
        if (issuedToId) where.issuedToId = parseInt(issuedToId);
        if (status) where.status = status;

        const issues = await prisma.stationaryIssue.findMany({
            where,
            include: {
                requisition: {
                    select: {
                        id: true,
                        requisitionNo: true,
                        purpose: true,
                    },
                },
                issuedBy: { select: { id: true, name: true, email: true } },
                issuedTo: { select: { id: true, name: true, email: true } },
                department: { select: { id: true, code: true, name: true } },
                location: { select: { id: true, code: true, name: true } },
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

        return NextResponse.json(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new issue
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

        // Check issue permission
        const canIssue = await hasPermission(user, 'stationary', 'issue');
        if (!canIssue) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const {
            requisitionId,
            issuedToId,
            departmentId,
            locationId,
            deliveryMethod,
            deliveryDate,
            deliveryNotes,
            items, // Array of { itemId, quantity }
        } = body;

        // Validate required fields
        if (!issuedToId || !departmentId || !locationId || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Issued to, department, location, and items are required' },
                { status: 400 }
            );
        }

        // Generate issue number: ISS-YYYY-NNNN
        const year = new Date().getFullYear();
        const lastIssue = await prisma.stationaryIssue.findFirst({
            where: {
                issueNo: { startsWith: `ISS-${year}-` },
            },
            orderBy: { issueNo: 'desc' },
        });

        let nextNumber = 1;
        if (lastIssue) {
            const lastNumber = parseInt(lastIssue.issueNo.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        const issueNo = `ISS-${year}-${nextNumber.toString().padStart(4, '0')}`;

        // Create issue with items in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const issue = await tx.stationaryIssue.create({
                data: {
                    issueNo,
                    requisitionId: requisitionId ? parseInt(requisitionId) : null,
                    issuedById: userId,
                    issuedToId: parseInt(issuedToId),
                    departmentId: parseInt(departmentId),
                    locationId: parseInt(locationId),
                    deliveryMethod: deliveryMethod || 'collection',
                    deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                    deliveryNotes: deliveryNotes || null,
                    status: 'pending',
                    items: {
                        create: items.map((item: any) => ({
                            itemId: parseInt(item.itemId),
                            quantity: parseInt(item.quantity),
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            item: true,
                        },
                    },
                },
            });

            // Reduce stock for each item
            for (const item of items) {
                const stock = await tx.stationaryStock.findFirst({
                    where: {
                        itemId: parseInt(item.itemId),
                        locationId: parseInt(locationId),
                    },
                });

                if (!stock || stock.quantity < parseInt(item.quantity)) {
                    throw new Error(`Insufficient stock for item ${item.itemId}`);
                }

                await tx.stationaryStock.update({
                    where: { id: stock.id },
                    data: {
                        quantity: stock.quantity - parseInt(item.quantity),
                        totalValue: stock.unitCost
                            ? (stock.quantity - parseInt(item.quantity)) * Number(stock.unitCost)
                            : null,
                    },
                });
            }

            return issue;
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'StationaryIssue',
                entityId: result.id.toString(),
                details: JSON.stringify({
                    issueNo: result.issueNo,
                    itemCount: items.length,
                }),
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Error creating issue:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
