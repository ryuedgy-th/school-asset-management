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
        const sparePartId = searchParams.get('sparePartId');
        const type = searchParams.get('type');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const where: any = {};

        if (sparePartId) {
            where.sparePartId = parseInt(sparePartId);
        }

        if (type) {
            where.type = type;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.createdAt.lte = new Date(dateTo);
            }
        }

        const transactions = await prisma.inventoryTransaction.findMany({
            where,
            include: {
                sparePart: {
                    select: {
                        id: true,
                        partNumber: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error('Inventory transactions fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions', message: error.message },
            { status: 500 }
        );
    }
}
