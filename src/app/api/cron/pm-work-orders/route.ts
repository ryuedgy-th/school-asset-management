import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPMDueReminder, sendPMOverdueAlert } from '@/lib/pm-notifications';

export async function GET() {
    try {
        const now = new Date();
        const leadTime = new Date();
        leadTime.setDate(leadTime.getDate() + 7); // 7 days ahead

        // Find PM schedules that are due or approaching
        const dueSchedules = await prisma.pMSchedule.findMany({
            where: {
                isActive: true,
                autoCreateWO: true,
                nextDueDate: {
                    lte: leadTime,
                },
            },
            include: {
                asset: true,
                assignedTo: true,
            },
        });

        const results = {
            processed: 0,
            overdueReminders: 0,
            dueReminders: 0,
            errors: [] as string[],
        };

        for (const schedule of dueSchedules) {
            try {
                const dueDate = schedule.nextDueDate ? new Date(schedule.nextDueDate) : null;

                if (!dueDate) continue;

                // Send overdue alert
                if (dueDate < now) {
                    await sendPMOverdueAlert(schedule.id);
                    results.overdueReminders++;
                }
                // Send due reminder (within lead time)
                else {
                    await sendPMDueReminder(schedule.id);
                    results.dueReminders++;
                }

                results.processed++;
            } catch (error: any) {
                results.errors.push(`Schedule ${schedule.id}: ${error.message}`);
            }
        }

        // Note: Audit log skipped for cron jobs (no user context)

        return NextResponse.json({
            success: true,
            ...results,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('PM cron job error:', error);
        return NextResponse.json(
            { error: 'Cron job failed', message: error.message },
            { status: 500 }
        );
    }
}
