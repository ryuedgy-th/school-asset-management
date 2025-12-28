'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPMSchedule(data: {
    assetId: number;
    name: string;
    description?: string;
    scheduleType: string;
    frequency?: string;
    intervalValue?: number;
    intervalUnit?: string;
    usageMetric?: string;
    usageInterval?: number;
    nextDueDate?: Date | string;
    nextDueUsage?: number;
    checklistItems?: any[];
    autoCreateWO?: boolean;
    leadTimeDays?: number;
    priority?: string;
    assignedToId?: number;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    const schedule = await prisma.pMSchedule.create({
        data: {
            assetId: data.assetId,
            name: data.name,
            ...(data.description && { description: data.description }),
            scheduleType: data.scheduleType,
            ...(data.frequency && { frequency: data.frequency }),
            ...(data.intervalValue && { intervalValue: data.intervalValue }),
            ...(data.intervalUnit && { intervalUnit: data.intervalUnit }),
            ...(data.usageMetric && { usageMetric: data.usageMetric }),
            ...(data.usageInterval && { usageInterval: data.usageInterval }),
            ...(data.nextDueDate && {
                nextDueDate: new Date(data.nextDueDate),
            }),
            ...(data.nextDueUsage && { nextDueUsage: data.nextDueUsage }),
            ...(data.checklistItems && {
                checklistItems: JSON.stringify(data.checklistItems),
            }),
            ...(data.autoCreateWO !== undefined && { autoCreateWO: data.autoCreateWO }),
            ...(data.leadTimeDays && { leadTimeDays: data.leadTimeDays }),
            ...(data.priority && { priority: data.priority }),
            ...(data.assignedToId && { assignedToId: data.assignedToId }),
        },
        include: {
            asset: true,
            assignedTo: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entity: 'PMSchedule',
            entityId: schedule.id.toString(),
            details: JSON.stringify({ name: data.name, assetId: data.assetId }),
            userId,
        },
    });

    revalidatePath('/pm-schedules');
    revalidatePath(`/fm-assets/${data.assetId}`);

    return schedule;
}

export async function updatePMSchedule(id: number, data: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    const schedule = await prisma.pMSchedule.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.scheduleType && { scheduleType: data.scheduleType }),
            ...(data.frequency !== undefined && { frequency: data.frequency }),
            ...(data.intervalValue !== undefined && { intervalValue: data.intervalValue }),
            ...(data.intervalUnit !== undefined && { intervalUnit: data.intervalUnit }),
            ...(data.usageMetric !== undefined && { usageMetric: data.usageMetric }),
            ...(data.usageInterval !== undefined && { usageInterval: data.usageInterval }),
            ...(data.nextDueDate !== undefined && {
                nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
            }),
            ...(data.nextDueUsage !== undefined && { nextDueUsage: data.nextDueUsage }),
            ...(data.checklistItems !== undefined && {
                checklistItems: data.checklistItems
                    ? JSON.stringify(data.checklistItems)
                    : null,
            }),
            ...(data.autoCreateWO !== undefined && { autoCreateWO: data.autoCreateWO }),
            ...(data.leadTimeDays !== undefined && { leadTimeDays: data.leadTimeDays }),
            ...(data.priority !== undefined && { priority: data.priority }),
            ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
            asset: true,
            assignedTo: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'UPDATE',
            entity: 'PMSchedule',
            entityId: id.toString(),
            details: JSON.stringify({ name: schedule.name }),
            userId,
        },
    });

    revalidatePath('/pm-schedules');
    revalidatePath(`/pm-schedules/${id}`);
    revalidatePath(`/fm-assets/${schedule.assetId}`);

    return schedule;
}

export async function deletePMSchedule(id: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    const schedule = await prisma.pMSchedule.findUnique({
        where: { id },
    });

    if (!schedule) throw new Error('Schedule not found');

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
            userId,
        },
    });

    revalidatePath('/pm-schedules');
    revalidatePath(`/fm-assets/${schedule.assetId}`);

    return { success: true };
}

export async function executePM(
    scheduleId: number,
    data: {
        checklistResults?: any;
        partsUsed?: string;
        cost?: number;
        notes?: string;
        images?: string[];
        performedBy?: string;
    }
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Get PM schedule
    const schedule = await prisma.pMSchedule.findUnique({
        where: { id: scheduleId },
        include: { asset: true },
    });

    if (!schedule) throw new Error('Schedule not found');

    // Create maintenance log
    const maintenanceLog = await prisma.maintenanceLog.create({
        data: {
            assetId: schedule.assetId,
            date: new Date(),
            type: 'preventive',
            performedBy: data.performedBy || user?.name || 'Unknown',
            description: `PM Execution: ${schedule.name}`,
            ...(data.checklistResults && {
                readings: JSON.stringify({ checklistResults: data.checklistResults }),
            }),
            ...(data.partsUsed && { partsChanged: data.partsUsed }),
            ...(data.cost && { cost: data.cost }),
            ...(data.images && { images: JSON.stringify(data.images) }),
        },
    });

    // Calculate next due date
    const nextDueDate = calculateNextDue(schedule);

    // Update PM schedule
    const updatedSchedule = await prisma.pMSchedule.update({
        where: { id: scheduleId },
        data: {
            lastPerformed: new Date(),
            ...(nextDueDate && { nextDueDate }),
        },
        include: {
            asset: true,
            assignedTo: true,
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
            userId,
        },
    });

    revalidatePath('/pm-schedules');
    revalidatePath(`/pm-schedules/${scheduleId}`);
    revalidatePath(`/fm-assets/${schedule.assetId}`);
    revalidatePath('/maintenance-logs');

    return { schedule: updatedSchedule, maintenanceLog };
}

export function calculateNextDue(schedule: {
    scheduleType: string;
    frequency?: string | null;
    intervalValue?: number | null;
    intervalUnit?: string | null;
    usageInterval?: number | null;
}): Date | null {
    if (schedule.scheduleType !== 'time') return null;

    const now = new Date();
    let nextDueDate: Date | null = null;

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
            nextDueDate.setFullYear(nextDueDate.getFullYear() + schedule.intervalValue);
        }
    }

    return nextDueDate;
}

export async function createMaintenanceLog(data: {
    assetId: number;
    date?: Date | string;
    type: string;
    performedBy?: string;
    description: string;
    readings?: any;
    cost?: number;
    partsChanged?: string;
    nextServiceDue?: Date | string;
    images?: string[];
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const log = await prisma.maintenanceLog.create({
        data: {
            assetId: data.assetId,
            date: data.date ? new Date(data.date) : new Date(),
            type: data.type,
            performedBy: data.performedBy || user?.name || 'Unknown',
            description: data.description,
            ...(data.readings && { readings: JSON.stringify(data.readings) }),
            ...(data.cost && { cost: data.cost }),
            ...(data.partsChanged && { partsChanged: data.partsChanged }),
            ...(data.nextServiceDue && {
                nextServiceDue: new Date(data.nextServiceDue),
            }),
            ...(data.images && { images: JSON.stringify(data.images) }),
        },
        include: {
            asset: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entity: 'MaintenanceLog',
            entityId: log.id.toString(),
            details: JSON.stringify({
                assetId: data.assetId,
                type: data.type,
                description: data.description,
            }),
            userId,
        },
    });

    revalidatePath('/maintenance-logs');
    revalidatePath(`/fm-assets/${data.assetId}`);

    return log;
}

export async function updateMaintenanceLog(id: number, data: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    const log = await prisma.maintenanceLog.update({
        where: { id },
        data: {
            ...(data.date && { date: new Date(data.date) }),
            ...(data.type && { type: data.type }),
            ...(data.performedBy && { performedBy: data.performedBy }),
            ...(data.description && { description: data.description }),
            ...(data.readings !== undefined && {
                readings: data.readings ? JSON.stringify(data.readings) : null,
            }),
            ...(data.cost !== undefined && { cost: data.cost }),
            ...(data.partsChanged !== undefined && { partsChanged: data.partsChanged }),
            ...(data.nextServiceDue !== undefined && {
                nextServiceDue: data.nextServiceDue ? new Date(data.nextServiceDue) : null,
            }),
            ...(data.images !== undefined && {
                images: data.images ? JSON.stringify(data.images) : null,
            }),
        },
        include: {
            asset: true,
        },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'UPDATE',
            entity: 'MaintenanceLog',
            entityId: id.toString(),
            details: JSON.stringify({ type: log.type, description: log.description }),
            userId,
        },
    });

    revalidatePath('/maintenance-logs');
    revalidatePath(`/maintenance-logs/${id}`);
    revalidatePath(`/fm-assets/${log.assetId}`);

    return log;
}

export async function deleteMaintenanceLog(id: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const userId = Number(session.user.id);

    const log = await prisma.maintenanceLog.findUnique({
        where: { id },
    });

    if (!log) throw new Error('Log not found');

    await prisma.maintenanceLog.delete({
        where: { id },
    });

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'DELETE',
            entity: 'MaintenanceLog',
            entityId: id.toString(),
            details: null,
            userId,
        },
    });

    revalidatePath('/maintenance-logs');
    revalidatePath(`/fm-assets/${log.assetId}`);

    return { success: true };
}
