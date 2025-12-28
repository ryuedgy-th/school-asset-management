import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSLAStatus } from '@/lib/sla';

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

        // Send email alerts using template system
        const emailResults: any[] = [];
        for (const alert of alertsToSend) {
            try {
                const { sendTemplatedEmail } = await import('@/lib/email');
                const ticket = alert.ticket;

                // Priority color mapping
                const priorityColors: Record<string, string> = {
                    urgent: '#dc2626',
                    high: '#ea580c',
                    medium: '#eab308',
                    low: '#3b82f6'
                };

                // Send to both reporter and assignee
                const recipients: string[] = [];
                if (ticket.reportedBy?.email) recipients.push(ticket.reportedBy.email);
                if (ticket.assignedTo?.email && ticket.assignedTo.email !== ticket.reportedBy?.email) {
                    recipients.push(ticket.assignedTo.email);
                }

                if (recipients.length > 0) {
                    await sendTemplatedEmail({
                        category: 'ticket_sla_breach',
                        variables: {
                            ticketNumber: ticket.ticketNumber,
                            title: ticket.title,
                            priority: ticket.priority,
                            priorityColor: priorityColors[ticket.priority] || '#3b82f6',
                            status: ticket.status,
                            slaDeadline: ticket.slaDeadline
                                ? new Date(ticket.slaDeadline).toLocaleString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })
                                : 'Not set',
                            slaStatus: alert.type === 'breached' ? 'BREACHED' : 'AT RISK',
                            reportedByName: ticket.reportedBy?.name || 'User',
                            assignedToName: ticket.assignedTo?.name || 'Unassigned',
                            ticketUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/tickets/${ticket.id}`,
                        },
                        overrideRecipients: {
                            to: recipients,
                        },
                    });

                    emailResults.push({
                        ticketId: ticket.id,
                        ticketNumber: ticket.ticketNumber,
                        alertType: alert.type,
                        sentTo: recipients,
                        success: true,
                    });
                }
            } catch (emailError) {
                console.error(`Failed to send SLA alert for ticket ${alert.ticket.id}:`, emailError);
                emailResults.push({
                    ticketId: alert.ticket.id,
                    ticketNumber: alert.ticket.ticketNumber,
                    alertType: alert.type,
                    success: false,
                    error: emailError instanceof Error ? emailError.message : 'Unknown error',
                });
            }
        }

        return NextResponse.json({
            success: true,
            checked: tickets.length,
            updated: updates.length,
            alerts: alertsToSend.length,
            emailsSent: emailResults.filter(r => r.success).length,
            emailsFailed: emailResults.filter(r => !r.success).length,
            updates,
            emailResults,
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
