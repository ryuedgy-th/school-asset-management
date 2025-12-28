import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSLAStatus } from '@/lib/sla';
import { slaBreachAlertEmail } from '@/lib/ticket-notifications';

/**
 * SLA Check Cron Job
 * 
 * This endpoint should be called periodically (e.g., every hour) to:
 * 1. Update SLA status for all open tickets
 * 2. Send alerts for at-risk and breached tickets
 * 
 * Setup with cron services like:
 * - Vercel Cron: https://vercel.com/docs/cron-jobs
 * - GitHub Actions scheduled workflows
 * - External cron services (cron-job.org, etc.)
 */

export async function GET(request: NextRequest) {
    try {
        // Verify authorization (use cron secret or API key)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'development-secret';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all open tickets with SLA deadlines
        const tickets = await prisma.ticket.findMany({
            where: {
                status: {
                    notIn: ['resolved', 'closed', 'cancelled'],
                },
                slaDeadline: {
                    not: null,
                },
            },
            include: {
                reportedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                itAsset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
                fmAsset: {
                    select: {
                        id: true,
                        assetCode: true,
                        name: true,
                    },
                },
            },
        });

        const updates: any[] = [];
        const alertsToSend: any[] = [];

        for (const ticket of tickets) {
            const currentStatus = checkSLAStatus(ticket.slaDeadline);
            const previousStatus = ticket.slaStatus;

            // Only update if status changed
            if (currentStatus !== previousStatus) {
                updates.push({
                    id: ticket.id,
                    oldStatus: previousStatus,
                    newStatus: currentStatus,
                });

                try {
                    await prisma.ticket.update({
                        where: { id: ticket.id },
                        data: { slaStatus: currentStatus },
                    });

                    // Send alert if newly breached or at risk
                    if (currentStatus === 'breached' && previousStatus !== 'breached') {
                        alertsToSend.push({
                            ticket,
                            type: 'breached',
                        });
                    } else if (currentStatus === 'at_risk' && previousStatus === 'within_sla') {
                        alertsToSend.push({
                            ticket,
                            type: 'at_risk',
                        });
                    }
                } catch (error) {
                    console.error(`Failed to update ticket ${ticket.id}:`, error);
                }
            }
        }

        // TODO: Send email alerts
        // for (const alert of alertsToSend) {
        //     const emailData = slaBreachAlertEmail(alert.ticket as any);
        //     await sendEmail(emailData);
        // }

        return NextResponse.json({
            success: true,
            checked: tickets.length,
            updated: updates.length,
            alerts: alertsToSend.length,
            updates,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('SLA check cron error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
