'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Assess damage severity and determine if asset can continue to be used
 */
export async function assessDamage(
    inspectionId: number,
    severity: 'minor' | 'moderate' | 'severe',
    canContinueUse: boolean
) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const inspection = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            damageSeverity: severity,
            canContinueUse,
            repairStatus: 'pending', // Auto-set to pending when damage is assessed
        },
        include: {
            assignment: true,
        },
    });

    // Check if asset is currently assigned (borrowed)
    const asset = await prisma.asset.findUnique({
        where: { id: inspection.assetId },
        select: { status: true },
    });

    // Update asset status based on severity, usage capability, and current assignment
    let newAssetStatus = 'damaged'; // Default to damaged when pending repair

    // If severe or cannot continue use → always damaged (needs immediate attention)
    if (severity === 'severe' || !canContinueUse) {
        newAssetStatus = 'damaged';
    }
    // If can continue use and currently in use → keep in_use
    else if (canContinueUse && asset?.status === 'in_use') {
        newAssetStatus = 'in_use';
    }
    // Otherwise → damaged (waiting for repair decision)
    else {
        newAssetStatus = 'damaged';
    }

    await prisma.asset.update({
        where: { id: inspection.assetId },
        data: { status: newAssetStatus },
    });

    revalidatePath(`/inspections/${inspectionId}`);
    revalidatePath(`/assets/${inspection.assetId}`);
    revalidatePath('/assets');
    return { success: true, inspection };
}

/**
 * Accept damage as-is (no repair needed)
 */
export async function acceptDamageAsIs(inspectionId: number, reason: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const inspection = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            repairStatus: 'accepted_as_is',
            repairNotes: reason,
        },
        include: {
            asset: true,
            assignment: true,
        },
    });

    // Update asset status based on current assignment
    let newAssetStatus = 'available';

    // Check if asset is currently borrowed (has active borrow item)
    const activeBorrowItem = await prisma.borrowItem.findFirst({
        where: {
            assetId: inspection.assetId,
            status: 'Borrowed',
        },
    });

    if (activeBorrowItem) {
        newAssetStatus = 'in_use';
    } else {
        newAssetStatus = 'available';
    }

    await prisma.asset.update({
        where: { id: inspection.assetId },
        data: { status: newAssetStatus },
    });

    revalidatePath(`/inspections/${inspectionId}`);
    revalidatePath(`/assets/${inspection.assetId}`);
    revalidatePath('/assets');
    return { success: true, inspection };
}

/**
 * Start repair process
 */
export async function startRepair(inspectionId: number, repairedBy: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const inspection = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            repairStatus: 'in_progress',
            repairStartDate: new Date(),
            repairedBy,
        },
        include: {
            asset: true,
        },
    });

    // Update asset status
    await prisma.asset.update({
        where: { id: inspection.assetId },
        data: { status: 'under_repair' },
    });

    revalidatePath(`/inspections/${inspectionId}`);
    return { success: true, inspection };
}

/**
 * Update repair progress with notes
 */
export async function updateRepairProgress(inspectionId: number, notes: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
    });

    if (!inspection) {
        throw new Error('Inspection not found');
    }

    const updatedNotes = inspection.repairNotes
        ? `${inspection.repairNotes}\n\n[${new Date().toLocaleString()}] ${notes}`
        : `[${new Date().toLocaleString()}] ${notes}`;

    const updated = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            repairNotes: updatedNotes,
        },
    });

    revalidatePath(`/inspections/${inspectionId}`);
    return { success: true, inspection: updated };
}

/**
 * Complete repair
 */
export async function completeRepair(inspectionId: number, cost: number) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const inspection = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            repairStatus: 'completed',
            repairCompletedDate: new Date(),
            repairCost: cost,
        },
        include: {
            asset: true,
        },
    });

    // Update asset status back to available
    await prisma.asset.update({
        where: { id: inspection.assetId },
        data: { status: 'available' },
    });

    revalidatePath(`/inspections/${inspectionId}`);
    return { success: true, inspection };
}

/**
 * Mark as unrepairable
 */
export async function markUnrepairable(inspectionId: number, reason: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const inspection = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            repairStatus: 'cannot_repair',
            repairNotes: reason,
        },
        include: {
            asset: true,
        },
    });

    // Update asset status to retired
    await prisma.asset.update({
        where: { id: inspection.assetId },
        data: { status: 'retired' },
    });

    revalidatePath(`/inspections/${inspectionId}`);
    return { success: true, inspection };
}

/**
 * Get repair history for an asset
 */
export async function getRepairHistory(assetId: number) {
    const repairs = await prisma.inspection.findMany({
        where: {
            assetId,
            damageFound: true,
            repairStatus: { not: null },
        },
        include: {
            inspector: {
                select: {
                    name: true,
                    email: true,
                },
            },
            assignment: {
                include: {
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            inspectionDate: 'desc',
        },
    });

    return repairs;
}
