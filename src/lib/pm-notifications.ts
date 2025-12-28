import { prisma } from './prisma';
import { sendEmail } from './email';

export async function sendPMDueReminder(scheduleId: number) {
    const schedule = await prisma.pMSchedule.findUnique({
        where: { id: scheduleId },
        include: {
            asset: true,
            assignedTo: true,
        },
    });

    if (!schedule || !schedule.assignedTo?.email) return;

    const subject = `PM Due Reminder: ${schedule.name}`;
    const html = `
        <h2>Preventive Maintenance Due Reminder</h2>
        <p><strong>Schedule:</strong> ${schedule.name}</p>
        <p><strong>Asset:</strong> ${schedule.asset.name} (${schedule.asset.assetCode})</p>
        <p><strong>Due Date:</strong> ${schedule.nextDueDate ? new Date(schedule.nextDueDate).toLocaleDateString() : 'Not scheduled'}</p>
        <p><strong>Priority:</strong> ${schedule.priority}</p>
        ${schedule.description ? `<p><strong>Description:</strong> ${schedule.description}</p>` : ''}
        <p>Please complete this preventive maintenance task as soon as possible.</p>
    `;

    await sendEmail({ to: schedule.assignedTo.email, subject, html });
}

export async function sendPMOverdueAlert(scheduleId: number) {
    const schedule = await prisma.pMSchedule.findUnique({
        where: { id: scheduleId },
        include: {
            asset: true,
            assignedTo: true,
        },
    });

    if (!schedule || !schedule.assignedTo?.email) return;

    const subject = `OVERDUE: PM - ${schedule.name}`;
    const html = `
        <h2 style="color: #dc2626;">Preventive Maintenance OVERDUE</h2>
        <p><strong>Schedule:</strong> ${schedule.name}</p>
        <p><strong>Asset:</strong> ${schedule.asset.name} (${schedule.asset.assetCode})</p>
        <p><strong>Due Date:</strong> ${schedule.nextDueDate ? new Date(schedule.nextDueDate).toLocaleDateString() : 'Not scheduled'}</p>
        <p><strong>Priority:</strong> ${schedule.priority}</p>
        <p style="color: #dc2626;"><strong>This maintenance is now overdue. Please complete it immediately.</strong></p>
    `;

    await sendEmail({ to: schedule.assignedTo.email, subject, html });
}

export async function sendMaintenanceCompleted(logId: number) {
    const log = await prisma.maintenanceLog.findUnique({
        where: { id: logId },
        include: {
            asset: {
                include: {
                    createdBy: true,
                },
            },
        },
    });

    if (!log || !log.asset.createdBy?.email) return;

    const subject = `Maintenance Completed: ${log.asset.name}`;
    const html = `
        <h2>Maintenance Task Completed</h2>
        <p><strong>Asset:</strong> ${log.asset.name} (${log.asset.assetCode})</p>
        <p><strong>Type:</strong> ${log.type}</p>
        <p><strong>Performed By:</strong> ${log.performedBy}</p>
        <p><strong>Date:</strong> ${new Date(log.date).toLocaleDateString()}</p>
        <p><strong>Description:</strong> ${log.description}</p>
        ${log.partsChanged ? `<p><strong>Parts Changed:</strong> ${log.partsChanged}</p>` : ''}
        ${log.cost ? `<p><strong>Cost:</strong> ฿${Number(log.cost).toLocaleString()}</p>` : ''}
    `;

    await sendEmail({ to: log.asset.createdBy.email, subject, html });
}
