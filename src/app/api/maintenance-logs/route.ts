import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';

// GET /api/maintenance-logs - List maintenance logs
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user || !hasModuleAccess(user, 'fm_assets')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const assetId = searchParams.get('assetId');
        const type = searchParams.get('type'); // preventive, corrective, inspection
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const where: any = {};

        if (assetId) {
            where.assetId = parseInt(assetId);
        }

        if (type) {
            where.type = type;
        }

        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) {
                where.date.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.date.lte = new Date(dateTo);
            }
        }

        const logs = await prisma.maintenanceLog.findMany({
            where,
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });

        // Parse JSON fields and convert Decimal
        const logsWithParsedData = logs.map((log) => ({
            ...log,
            cost: log.cost ? Number(log.cost) : null,
            readings: log.readings ? JSON.parse(log.readings as string) : null,
            images: log.images ? JSON.parse(log.images as string) : [],
        }));

        return NextResponse.json(logsWithParsedData);
    } catch (error: any) {
        console.error('Error fetching maintenance logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch maintenance logs' },
            { status: 500 }
        );
    }
}

// POST /api/maintenance-logs - Create maintenance log
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                userRole: true,
                userDepartment: true,
            },
        });

        if (!user || !hasModuleAccess(user, 'fm_assets')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            assetId,
            date,
            type,
            performedBy,
            description,
            readings,
            cost,
            partsChanged,
            nextServiceDue,
            images,
        } = body;

        // Validation
        if (!assetId || !type || !description) {
            return NextResponse.json(
                { error: 'Asset ID, type, and description are required' },
                { status: 400 }
            );
        }

        // Verify asset exists
        const asset = await prisma.fMAsset.findUnique({
            where: { id: assetId },
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        const log = await prisma.maintenanceLog.create({
            data: {
                assetId,
                date: date ? new Date(date) : new Date(),
                type,
                performedBy: performedBy || user.name || 'Unknown',
                description,
                ...(readings && { readings: JSON.stringify(readings) }),
                ...(cost && { cost }),
                ...(partsChanged && { partsChanged }),
                ...(nextServiceDue && { nextServiceDue: new Date(nextServiceDue) }),
                ...(images && { images: JSON.stringify(images) }),
            },
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'MaintenanceLog',
                entityId: log.id.toString(),
                details: JSON.stringify({ assetId, type, description }),
                userId: user.id,
            },
        });

        // Parse JSON for response
        const logWithParsedData = {
            ...log,
            cost: log.cost ? Number(log.cost) : null,
            readings: log.readings ? JSON.parse(log.readings as string) : null,
            images: log.images ? JSON.parse(log.images as string) : [],
        };

        return NextResponse.json(logWithParsedData, { status: 201 });
    } catch (error: any) {
        console.error('Error creating maintenance log:', error);
        return NextResponse.json(
            { error: 'Failed to create maintenance log' },
            { status: 500 }
        );
    }
}
