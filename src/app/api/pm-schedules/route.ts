import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';

// GET /api/pm-schedules - List PM schedules
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

        if (!user || !hasModuleAccess(user, 'pm_schedules')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const assetId = searchParams.get('assetId');
        const status = searchParams.get('status'); // active, overdue, upcoming
        const nextDueBefore = searchParams.get('nextDueBefore');

        const where: any = {
            isActive: true,
        };

        if (assetId) {
            where.assetId = parseInt(assetId);
        }

        if (nextDueBefore) {
            where.nextDueDate = {
                lte: new Date(nextDueBefore),
            };
        }

        // Filter by status
        const now = new Date();
        if (status === 'overdue') {
            where.nextDueDate = {
                lt: now,
            };
        } else if (status === 'upcoming') {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            where.nextDueDate = {
                gte: now,
                lte: nextWeek,
            };
        }

        const schedules = await prisma.pMSchedule.findMany({
            where,
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                        status: true,
                    },
                },
                component: {
                    select: {
                        id: true,
                        name: true,
                        componentType: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: [{ nextDueDate: 'asc' }, { name: 'asc' }],
        });

        // Parse JSON fields
        const schedulesWithParsedData = schedules.map((schedule) => ({
            ...schedule,
            checklistItems: schedule.checklistItems
                ? JSON.parse(schedule.checklistItems as string)
                : [],
        }));

        return NextResponse.json(schedulesWithParsedData);
    } catch (error: any) {
        console.error('Error fetching PM schedules:', error);
        return NextResponse.json(
            { error: 'Failed to fetch PM schedules' },
            { status: 500 }
        );
    }
}

// POST /api/pm-schedules - Create PM schedule
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

        if (!user || !hasModuleAccess(user, 'pm_schedules')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            assetId,
            componentId,
            name,
            description,
            scheduleType,
            frequency,
            intervalValue,
            intervalUnit,
            usageMetric,
            usageInterval,
            nextDueDate,
            nextDueUsage,
            checklistItems,
            autoCreateWO,
            leadTimeDays,
            priority,
            assignedToId,
        } = body;

        // Validation
        if (!assetId || !name || !scheduleType) {
            return NextResponse.json(
                { error: 'Asset ID, name, and schedule type are required' },
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

        const schedule = await prisma.pMSchedule.create({
            data: {
                assetId,
                ...(componentId && { componentId }),
                name,
                ...(description && { description }),
                scheduleType,
                ...(frequency && { frequency }),
                ...(intervalValue && { intervalValue }),
                ...(intervalUnit && { intervalUnit }),
                ...(usageMetric && { usageMetric }),
                ...(usageInterval && { usageInterval }),
                ...(nextDueDate && { nextDueDate: new Date(nextDueDate) }),
                ...(nextDueUsage && { nextDueUsage }),
                ...(checklistItems && { checklistItems: JSON.stringify(checklistItems) }),
                ...(autoCreateWO !== undefined && { autoCreateWO }),
                ...(leadTimeDays && { leadTimeDays }),
                ...(priority && { priority }),
                ...(assignedToId && { assignedToId }),
            },
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
                component: {
                    select: {
                        id: true,
                        name: true,
                        componentType: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                entity: 'PMSchedule',
                entityId: schedule.id.toString(),
                details: JSON.stringify({ name, assetId }),
                userId: user.id,
            },
        });

        // Parse JSON for response
        const scheduleWithParsedData = {
            ...schedule,
            checklistItems: schedule.checklistItems
                ? JSON.parse(schedule.checklistItems as string)
                : [],
        };

        return NextResponse.json(scheduleWithParsedData, { status: 201 });
    } catch (error: any) {
        console.error('Error creating PM schedule:', error);
        return NextResponse.json(
            { error: 'Failed to create PM schedule' },
            { status: 500 }
        );
    }
}
