import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

// GET: Fetch all items with filters
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
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const isActive = searchParams.get('isActive');
        const lowStock = searchParams.get('lowStock'); // Filter items below min stock level

        const where: any = {};

        if (categoryId) where.categoryId = parseInt(categoryId);
        if (isActive !== null) where.isActive = isActive === 'true';
        if (search) {
            where.OR = [
                { itemCode: { contains: search } },
                { name: { contains: search } },
                { description: { contains: search } },
            ];
        }

        const items = await prisma.stationaryItem.findMany({
            where,
            include: {
                category: { select: { id: true, code: true, name: true } },
                defaultVendor: { select: { id: true, vendorCode: true, name: true } },
                stock: {
                    select: {
                        locationId: true,
                        location: { select: { code: true, name: true } },
                        quantity: true,
                    },
                },
            },
            orderBy: { itemCode: 'asc' },
        });

        // Calculate total stock for each item
        const itemsWithStock = items.map(item => {
            const totalStock = item.stock.reduce((sum, s) => sum + s.quantity, 0);
            return {
                ...item,
                totalStock,
                isLowStock: totalStock < item.minStockLevel,
                stockLocations: item.stock.length,
            };
        });

        // Apply low stock filter if requested
        let filteredItems = itemsWithStock;
        if (lowStock === 'true') {
            filteredItems = itemsWithStock.filter(item => item.isLowStock);
        }

        return NextResponse.json(filteredItems);
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Create new item
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
            itemCode,
            name,
            description,
            categoryId,
            uom,
            minStockLevel,
            maxStockLevel,
            reorderPoint,
            reorderQuantity,
            unitCost,
            defaultVendorId,
            isRestricted,
            expiryTracking,
            barcodeEnabled,
            barcode,
            tags,
            imageUrl,
            notes,
        } = body;

        // Validate required fields
        if (!itemCode || !name || !categoryId) {
            return NextResponse.json(
                { error: 'Item code, name, and category are required' },
                { status: 400 }
            );
        }

        // Check if item code already exists
        const existing = await prisma.stationaryItem.findUnique({
            where: { itemCode: itemCode.toUpperCase() },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Item code already exists' },
                { status: 409 }
            );
        }

        // Check if barcode already exists
        if (barcode) {
            const barcodeExists = await prisma.stationaryItem.findUnique({
                where: { barcode },
            });

            if (barcodeExists) {
                return NextResponse.json(
                    { error: 'Barcode already exists' },
                    { status: 409 }
                );
            }
        }

        const item = await prisma.stationaryItem.create({
            data: {
                itemCode: itemCode.toUpperCase(),
                name,
                description,
                categoryId: parseInt(categoryId),
                uom: uom || 'pieces',
                minStockLevel: minStockLevel || 0,
                maxStockLevel: maxStockLevel ? parseInt(maxStockLevel) : null,
                reorderPoint: reorderPoint || 0,
                reorderQuantity: reorderQuantity || 0,
                unitCost: unitCost ? parseFloat(unitCost) : null,
                defaultVendorId: defaultVendorId ? parseInt(defaultVendorId) : null,
                isRestricted: isRestricted || false,
                expiryTracking: expiryTracking || false,
                barcodeEnabled: barcodeEnabled || false,
                barcode: barcode || null,
                tags: tags || null,
                imageUrl: imageUrl || null,
                notes: notes || null,
                createdById: userId,
            },
            include: {
                category: { select: { id: true, code: true, name: true } },
                defaultVendor: { select: { id: true, vendorCode: true, name: true } },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CREATE',
                entity: 'StationaryItem',
                entityId: item.id.toString(),
                details: JSON.stringify({ itemCode: item.itemCode, name: item.name }),
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
