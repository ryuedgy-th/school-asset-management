import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch all purchase orders
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
        const vendorId = searchParams.get('vendorId');
        const status = searchParams.get('status');
        const createdById = searchParams.get('createdById');

        const where: any = {};

        if (vendorId) where.vendorId = parseInt(vendorId);
        if (status) where.status = status;
        if (createdById) where.createdById = parseInt(createdById);

        const purchaseOrders = await prisma.stationaryPurchaseOrder.findMany({
            where,
            include: {
                vendor: {
                    select: {
                        id: true,
                        vendorCode: true,
                        name: true,
                        contactPerson: true,
                        phone: true,
                        email: true,
                    },
                },
                createdBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                receivedBy: { select: { id: true, name: true, email: true } },
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

        return NextResponse.json(purchaseOrders);
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new purchase order
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
        const {
            vendorId,
            orderDate,
            expectedDelivery,
            notes,
            termsConditions,
            items, // Array of { itemId, quantity, unitPrice }
        } = body;

        // Validate required fields
        if (!vendorId || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Vendor and items are required' },
                { status: 400 }
            );
        }

        // Calculate total amount
        const totalAmount = items.reduce(
            (sum: number, item: any) => sum + (parseFloat(item.unitPrice) * parseInt(item.quantity)),
            0
        );

        // Generate PO number: PO-YYYY-NNNN
        const year = new Date().getFullYear();
        const lastPO = await prisma.stationaryPurchaseOrder.findFirst({
            where: {
                poNumber: { startsWith: `PO-${year}-` },
            },
            orderBy: { poNumber: 'desc' },
        });

        let nextNumber = 1;
        if (lastPO) {
            const lastNumber = parseInt(lastPO.poNumber.split('-')[2]);
            nextNumber = lastNumber + 1;
        }

        const poNumber = `PO-${year}-${nextNumber.toString().padStart(4, '0')}`;

        // Create purchase order
        const purchaseOrder = await prisma.stationaryPurchaseOrder.create({
            data: {
                poNumber,
                vendorId: parseInt(vendorId),
                createdById: userId,
                orderDate: orderDate ? new Date(orderDate) : new Date(),
                expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
                subtotal: totalAmount,
                totalAmount,
                notes: notes || null,
                termsConditions: termsConditions || null,
                status: 'draft',
                items: {
                    create: items.map((item: any) => ({
                        itemId: parseInt(item.itemId),
                        quantityOrdered: parseInt(item.quantity),
                        unitPrice: parseFloat(item.unitPrice),
                        totalPrice: parseFloat(item.unitPrice) * parseInt(item.quantity),
                    })),
                },
            },
            include: {
                vendor: true,
                createdBy: true,
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
                entity: 'StationaryPurchaseOrder',
                entityId: purchaseOrder.id.toString(),
                details: JSON.stringify({
                    poNumber: purchaseOrder.poNumber,
                    totalAmount,
                    itemCount: items.length,
                }),
            },
        });

        return NextResponse.json(purchaseOrder, { status: 201 });
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
