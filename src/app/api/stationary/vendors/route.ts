import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch all vendors
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
        const search = searchParams.get('search');
        const isActive = searchParams.get('isActive');
        const isPreferred = searchParams.get('isPreferred');

        const where: any = {};

        if (isActive !== null) where.isActive = isActive === 'true';
        if (isPreferred === 'true') where.isPreferred = true;
        if (search) {
            where.OR = [
                { vendorCode: { contains: search } },
                { name: { contains: search } },
                { contactPerson: { contains: search } },
            ];
        }

        const vendors = await prisma.stationaryVendor.findMany({
            where,
            include: {
                _count: { select: { items: true, purchaseOrders: true } },
            },
            orderBy: [
                { isPreferred: 'desc' },
                { rating: 'desc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new vendor
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
            vendorCode,
            name,
            contactPerson,
            phone,
            email,
            address,
            paymentTerms,
            leadTimeDays,
            isPreferred,
            notes,
        } = body;

        // Validate required fields
        if (!vendorCode || !name) {
            return NextResponse.json(
                { error: 'Vendor code and name are required' },
                { status: 400 }
            );
        }

        // Check if vendor code already exists
        const existing = await prisma.stationaryVendor.findUnique({
            where: { vendorCode: vendorCode.toUpperCase() },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Vendor code already exists' },
                { status: 409 }
            );
        }

        const vendor = await prisma.stationaryVendor.create({
            data: {
                vendorCode: vendorCode.toUpperCase(),
                name,
                contactPerson: contactPerson || null,
                phone: phone || null,
                email: email || null,
                address: address || null,
                paymentTerms: paymentTerms || 'Net 30',
                leadTimeDays: leadTimeDays || 7,
                isPreferred: isPreferred || false,
                notes: notes || null,
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'StationaryVendor',
                entityId: vendor.id.toString(),
                details: JSON.stringify({ vendorCode: vendor.vendorCode, name: vendor.name }),
            },
        });

        return NextResponse.json(vendor, { status: 201 });
    } catch (error) {
        console.error('Error creating vendor:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
