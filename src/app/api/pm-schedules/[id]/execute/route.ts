import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasModuleAccess } from '@/lib/permissions';

// POST /api/pm-schedules/[id]/execute - Execute PM schedule
export async function POST(
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
        const scheduleId = parseInt(params.id);

        if (isNaN(scheduleId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();
        const {
            checklistResults,
            partsUsed,
            cost,
            notes,
            images,
            performedBy,
        } = body;

        // Get PM schedule
        const schedule = await prisma.pMSchedule.findUnique({
            where: { id: scheduleId },
            include: {
                asset: true,
            },
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        // Create maintenance log
        const maintenanceLog = await prisma.maintenanceLog.create({
            data: {
                assetId: schedule.assetId,
                date: new Date(),
                type: 'preventive',
                performedBy: performedBy || user.name || 'Unknown',
                description: `PM Execution: ${schedule.name}`,
                ...(checklistResults && {
                    readings: JSON.stringify({ checklistResults }),
                }),
                ...(partsUsed && { partsChanged: partsUsed }),
                ...(cost && { cost }),
                ...(images && { images: JSON.stringify(images) }),
            },
        });

        // Calculate next due date
        let nextDueDate: Date | null = null;

        if (schedule.scheduleType === 'time') {
            const now = new Date();

            if (schedule.frequency === 'daily') {
                const days = schedule.intervalValue || 1;
                nextDueDate = new Date(now);
                nextDueDate.setDate(nextDueDate.getDate() + days);
            } else if (schedule.frequency === 'weekly') {
                const weeks = schedule.intervalValue || 1;
                nextDueDate = new Date(now);
                nextDueDate.setDate(nextDueDate.getDate() + weeks * 7);
            } else if (schedule.frequency === 'monthly') {
                const months = schedule.intervalValue || 1;
                nextDueDate = new Date(now);
                nextDueDate.setMonth(nextDueDate.getMonth() + months);
            } else if (schedule.frequency === 'quarterly') {
                nextDueDate = new Date(now);
                nextDueDate.setMonth(nextDueDate.getMonth() + 3);
            } else if (schedule.frequency === 'yearly') {
                const years = schedule.intervalValue || 1;
                nextDueDate = new Date(now);
                nextDueDate.setFullYear(nextDueDate.getFullYear() + years);
            } else if (schedule.intervalUnit && schedule.intervalValue) {
                // Custom interval
                nextDueDate = new Date(now);
                if (schedule.intervalUnit === 'days') {
                    nextDueDate.setDate(nextDueDate.getDate() + schedule.intervalValue);
                } else if (schedule.intervalUnit === 'weeks') {
                    nextDueDate.setDate(nextDueDate.getDate() + schedule.intervalValue * 7);
                } else if (schedule.intervalUnit === 'months') {
                    nextDueDate.setMonth(nextDueDate.getMonth() + schedule.intervalValue);
                } else if (schedule.intervalUnit === 'years') {
                    nextDueDate.setFullYear(
                        nextDueDate.getFullYear() + schedule.intervalValue
                    );
                }
            }
        }

        // Update PM schedule
        const updatedSchedule = await prisma.pMSchedule.update({
            where: { id: scheduleId },
            data: {
                lastPerformed: new Date(),
                ...(nextDueDate && { nextDueDate }),
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
                action: 'EXECUTE_PM',
                entity: 'PMSchedule',
                entityId: scheduleId.toString(),
                details: JSON.stringify({
                    maintenanceLogId: maintenanceLog.id,
                    nextDueDate,
                }),
                userId: user.id,
            },
        });

        // Parse JSON for response
        const scheduleWithParsedData = {
            ...updatedSchedule,
            checklistItems: updatedSchedule.checklistItems
                ? JSON.parse(updatedSchedule.checklistItems as string)
                : [],
        };

        return NextResponse.json({
            success: true,
            schedule: scheduleWithParsedData,
            maintenanceLog: {
                ...maintenanceLog,
                cost: maintenanceLog.cost ? Number(maintenanceLog.cost) : null,
                readings: maintenanceLog.readings
                    ? JSON.parse(maintenanceLog.readings as string)
                    : null,
                images: maintenanceLog.images
                    ? JSON.parse(maintenanceLog.images as string)
                    : [],
            },
        });
    } catch (error: any) {
        console.error('Error executing PM schedule:', error);
        return NextResponse.json(
            { error: 'Failed to execute PM schedule' },
            { status: 500 }
        );
    }
}
