import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';

// GET /api/pm-schedules/[id] - Get single PM schedule
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        const params = await context.params;
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const schedule = await prisma.pMSchedule.findUnique({
            where: { id },
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                        status: true,
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

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        // Parse JSON fields
        const scheduleWithParsedData = {
            ...schedule,
            checklistItems: schedule.checklistItems
                ? JSON.parse(schedule.checklistItems as string)
                : [],
        };

        return NextResponse.json(scheduleWithParsedData);
    } catch (error: any) {
        console.error('Error fetching PM schedule:', error);
        return NextResponse.json(
            { error: 'Failed to fetch PM schedule' },
            { status: 500 }
        );
    }
}

// PUT /api/pm-schedules/[id] - Update PM schedule
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        const params = await context.params;
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const {
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
            isActive,
        } = body;

        const schedule = await prisma.pMSchedule.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(scheduleType && { scheduleType }),
                ...(frequency !== undefined && { frequency }),
                ...(intervalValue !== undefined && { intervalValue }),
                ...(intervalUnit !== undefined && { intervalUnit }),
                ...(usageMetric !== undefined && { usageMetric }),
                ...(usageInterval !== undefined && { usageInterval }),
                ...(nextDueDate !== undefined && {
                    nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
                }),
                ...(nextDueUsage !== undefined && { nextDueUsage }),
                ...(checklistItems !== undefined && {
                    checklistItems: checklistItems ? JSON.stringify(checklistItems) : null,
                }),
                ...(autoCreateWO !== undefined && { autoCreateWO }),
                ...(leadTimeDays !== undefined && { leadTimeDays }),
                ...(priority !== undefined && { priority }),
                ...(assignedToId !== undefined && { assignedToId }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                asset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
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
                action: 'UPDATE',
                entity: 'PMSchedule',
                entityId: id.toString(),
                details: JSON.stringify({ name }),
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

        return NextResponse.json(scheduleWithParsedData);
    } catch (error: any) {
        console.error('Error updating PM schedule:', error);
        return NextResponse.json(
            { error: 'Failed to update PM schedule' },
            { status: 500 }
        );
    }
}

// DELETE /api/pm-schedules/[id] - Delete PM schedule
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        const params = await context.params;
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await prisma.pMSchedule.delete({
            where: { id },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'DELETE',
                entity: 'PMSchedule',
                entityId: id.toString(),
                details: null,
                userId: user.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'PM schedule deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting PM schedule:', error);
        return NextResponse.json(
            { error: 'Failed to delete PM schedule' },
            { status: 500 }
        );
    }
}
