import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { userRole: true, userDepartment: true },
        });

        if (!user || !hasModuleAccess(user, 'spare_parts')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const lowStock = searchParams.get('lowStock');
        const search = searchParams.get('search');

        const where: any = {};

        if (category) {
            where.category = category;
        }

        if (lowStock === 'true') {
            where.currentStock = {
                lte: prisma.sparePart.fields.reorderPoint,
            };
        }

        if (search) {
            where.OR = [
                { partNumber: { contains: search } },
                { name: { contains: search } },
                { supplier: { contains: search } },
            ];
        }

        const spareParts = await prisma.sparePart.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(spareParts);
    } catch (error: any) {
        console.error('Spare parts fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch spare parts', message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            include: { userRole: true, userDepartment: true },
        });

        if (!user || !hasModuleAccess(user, 'spare_parts')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await request.json();

        // Check for duplicate part number
        const existing = await prisma.sparePart.findUnique({
            where: { partNumber: data.partNumber },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Part number already exists' },
                { status: 400 }
            );
        }

        const sparePart = await prisma.sparePart.create({
            data: {
                partNumber: data.partNumber,
                name: data.name,
                ...(data.description && { description: data.description }),
                ...(data.category && { category: data.category }),
                ...(data.supplier && { supplier: data.supplier }),
                ...(data.supplierPartNumber && { supplierPartNumber: data.supplierPartNumber }),
                currentStock: data.currentStock || 0,
                minStock: data.minStock || 0,
                maxStock: data.maxStock || null,
                reorderPoint: data.reorderPoint || 0,
                ...(data.unitCost && { unitCost: data.unitCost }),
                ...(data.storageLocation && { storageLocation: data.storageLocation }),
                ...(data.unit && { unit: data.unit }),
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: parseInt(session.user.id),
                action: 'CREATE',
                entity: 'SparePart',
                entityId: sparePart.id.toString(),
                details: `Created spare part: ${sparePart.name} (${sparePart.partNumber})`,
            },
        });

        return NextResponse.json(sparePart, { status: 201 });
    } catch (error: any) {
        console.error('Spare part creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create spare part', message: error.message },
            { status: 500 }
        );
    }
}
