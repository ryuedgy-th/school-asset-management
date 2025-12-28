'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Auto-create ticket from inspection when damage is found
 * Called automatically when creating/updating inspection
 */
export async function createTicketFromInspection(inspectionId: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Get inspection with all related data
    const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        include: {
            asset: {
                select: {
                    id: true,
                    name: true,
                    assetCode: true,
                    category: true,
                },
            },
            assignment: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            },
            inspector: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!inspection) {
        throw new Error('Inspection not found');
    }

    // Only create ticket if damage was found
    if (!inspection.damageFound) {
        console.log(`⚠️ No damage found in inspection #${inspectionId}, skipping ticket creation`);
        return null;
    }

    // Check if ticket already exists for this inspection
    const existingTicket = await prisma.ticket.findFirst({
        where: { inspectionId: inspection.id },
    });

    if (existingTicket) {
        console.log(`✅ Ticket already exists for inspection #${inspectionId}`);
        return existingTicket;
    }

    // Determine priority based on damage severity and overall condition
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    if (inspection.overallCondition === 'broken' || inspection.damageSeverity === 'severe') {
        priority = 'urgent';
    } else if (inspection.overallCondition === 'poor' || inspection.damageSeverity === 'moderate') {
        priority = 'high';
    } else if (inspection.damageSeverity === 'minor') {
        priority = 'medium';
    } else {
        priority = 'low';
    }

    // Build ticket title
    const title = `Repair Required: ${inspection.asset.name} (${inspection.asset.assetCode})`;

    // Build ticket description from inspection findings
    const description = buildTicketDescription(inspection);

    // Determine affected user (person who borrowed the asset)
    const affectedUserId = inspection.assignment?.user?.id || null;

    // Calculate SLA deadlines based on priority
    const now = new Date();
    const slaDeadline = new Date(now);

    switch (priority) {
        case 'urgent':
            slaDeadline.setHours(now.getHours() + 4); // 4 hours
            break;
        case 'high':
            slaDeadline.setHours(now.getHours() + 24); // 24 hours
            break;
        case 'medium':
            slaDeadline.setHours(now.getHours() + 72); // 3 days
            break;
        default:
            slaDeadline.setDate(now.getDate() + 7); // 7 days
    }

    // Generate ticket number
    const year = now.getFullYear();
    const lastTicket = await prisma.ticket.findFirst({
        where: {
            ticketNumber: {
                startsWith: `IT-${year}-`,
            },
        },
        orderBy: {
            ticketNumber: 'desc',
        },
    });

    let ticketNumber = `IT-${year}-001`;
    if (lastTicket) {
        const lastNum = parseInt(lastTicket.ticketNumber.split('-')[2]);
        ticketNumber = `IT-${year}-${String(lastNum + 1).padStart(3, '0')}`;
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
        data: {
            ticketNumber,
            title,
            description,
            type: 'IT', // IT asset inspection
            category: 'Hardware',
            subCategory: inspection.asset.category || 'Other',
            priority,
            status: 'open',
            reportedById: parseInt(session.user.id),
            affectedUserId,
            itAssetId: inspection.assetId,
            inspectionId: inspection.id, // Link to inspection
            slaDeadline,
            slaStatus: 'within_sla',
        },
        include: {
            reportedBy: {
                select: { id: true, name: true, email: true },
            },
            affectedUser: {
                select: { id: true, name: true, email: true },
            },
            itAsset: {
                select: { id: true, name: true, assetCode: true },
            },
        },
    });

    // Create initial activity log
    await prisma.ticketActivity.create({
        data: {
            ticketId: ticket.id,
            userId: parseInt(session.user.id),
            action: 'created',
            details: JSON.stringify({
                source: 'inspection',
                inspectionId: inspection.id,
                inspectionNumber: inspection.inspectionNumber || `#${inspection.id}`,
            }),
        },
    });

    console.log(`✅ Ticket #${ticket.ticketNumber} auto-created from Inspection #${inspection.inspectionNumber || inspection.id}`);

    revalidatePath('/tickets');
    revalidatePath('/inspections');
    revalidatePath(`/inspections/${inspectionId}`);

    return ticket;
}

/**
 * Build detailed ticket description from inspection data
 */
function buildTicketDescription(inspection: any): string {
    let description = `**Auto-generated from Inspection #${inspection.inspectionNumber || inspection.id}**\n\n`;

    description += `**Inspection Details:**\n`;
    description += `- Date: ${new Date(inspection.inspectionDate).toLocaleDateString('th-TH')}\n`;
    description += `- Type: ${inspection.inspectionType}\n`;
    description += `- Inspector: ${inspection.inspector?.name || 'Unknown'}\n`;
    description += `-Overall Condition: ${inspection.overallCondition}\n\n`;

    if (inspection.damageDescription) {
        description += `**Damage Description:**\n${inspection.damageDescription}\n\n`;
    }

    description += `**Condition Checklist:**\n`;
    if (inspection.exteriorCondition) {
        description += `- Exterior: ${inspection.exteriorCondition}${inspection.exteriorNotes ? ` (${inspection.exteriorNotes})` : ''}\n`;
    }
    if (inspection.screenCondition) {
        description += `- Screen: ${inspection.screenCondition}${inspection.screenNotes ? ` (${inspection.screenNotes})` : ''}\n`;
    }
    if (inspection.keyboardCondition) {
        description += `- Keyboard: ${inspection.keyboardCondition}${inspection.keyboardNotes ? ` (${inspection.keyboardNotes})` : ''}\n`;
    }
    if (inspection.buttonPortCondition) {
        description += `- Buttons/Ports: ${inspection.buttonPortCondition}${inspection.buttonPortNotes ? ` (${inspection.buttonPortNotes})` : ''}\n`;
    }
    if (inspection.touchpadCondition) {
        description += `- Touchpad: ${inspection.touchpadCondition}\n`;
    }
    if (inspection.batteryHealth) {
        description += `- Battery: ${inspection.batteryHealth}\n`;
    }

    if (inspection.estimatedCost) {
        description += `\n**Estimated Repair Cost:** ฿${Number(inspection.estimatedCost).toLocaleString()}\n`;
    }

    if (inspection.assignment?.user) {
        description += `\n**Borrowed By:** ${inspection.assignment.user.name} (${inspection.assignment.user.email})\n`;
    }

    return description;
}

/**
 * Sync ticket status back to inspection
 * Called when ticket is resolved/closed
 */
export async function syncTicketStatusToInspection(ticketId: number) {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            inspection: true,
        },
    });

    if (!ticket || !ticket.inspectionId) {
        return; // Not linked to inspection
    }

    // Update inspection damage status based on ticket status
    let damageStatus = ticket.inspection?.damageStatus;

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
        damageStatus = 'completed';
    } else if (ticket.status === 'in_progress') {
        damageStatus = 'in_progress';
    } else if (ticket.status === 'assigned') {
        damageStatus = 'approved';
    }

    if (damageStatus) {
        await prisma.inspection.update({
            where: { id: ticket.inspectionId },
            data: {
                damageStatus,
                // Update repair fields if ticket has actual cost
                ...(ticket.actualCost && {
                    repairCost: ticket.actualCost,
                    repairStatus: ticket.status === 'closed' ? 'completed' : 'in_progress',
                }),
            },
        });

        revalidatePath(`/inspections/${ticket.inspectionId}`);
        console.log(`✅ Synced ticket #${ticket.ticketNumber} status back to inspection`);
    }
}
