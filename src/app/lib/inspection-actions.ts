'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Condition severity scores for auto-computation
const SEVERITY_SCORES: Record<string, number> = {
    // Exterior
    'no_damage': 0,
    'minor_wear': 1,
    'moderate_wear': 2,
    'visible_dent': 3,
    'structural_damage': 4,
    // Screen
    'perfect': 0,
    'minor_scratches': 1,
    'noticeable_scratches': 2,
    'screen_blemish': 3,
    'cracked': 4,
    // Buttons & Ports
    'all_functional': 0,
    'sticky_button': 2,
    'loose_port': 3,
    'non_functional': 4,
    // Keyboard
    'fully_functional': 0,
    'sticking_keys': 2,
    'missing_keys': 4,
    // Touchpad
    'inconsistent': 2,
    // Battery
    'normal': 0,
    'moderate': 1,
    'replace_soon': 2,
    // Not applicable
    'not_applicable': 0,
};

/**
 * Auto-compute overall condition from detailed checklist
 */
function computeOverallCondition(data: {
    exteriorCondition?: string | null;
    screenCondition?: string | null;
    buttonPortCondition?: string | null;
    keyboardCondition?: string | null;
    touchpadCondition?: string | null;
    batteryHealth?: string | null;
}): string {
    const scores: number[] = [];

    // Collect scores from non-empty fields
    const fields = [
        data.exteriorCondition,
        data.screenCondition,
        data.buttonPortCondition,
        data.keyboardCondition,
        data.touchpadCondition,
        data.batteryHealth
    ];

    for (const field of fields) {
        if (field && field !== 'not_applicable') {
            const score = SEVERITY_SCORES[field] ?? 0;
            scores.push(score);
        }
    }

    if (scores.length === 0) {
        return 'good'; // Default if no checklist filled
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);

    // Determine overall condition
    if (maxScore >= 4 || avgScore >= 3.5) {
        return 'broken';
    } else if (maxScore >= 3 || avgScore >= 2.5) {
        return 'poor';
    } else if (avgScore >= 1.5) {
        return 'fair';
    } else if (avgScore >= 0.5) {
        return 'good';
    } else {
        return 'excellent';
    }
}

/**
 * Auto-detect damage from checklist
 */
function detectDamage(data: {
    exteriorCondition?: string | null;
    screenCondition?: string | null;
    buttonPortCondition?: string | null;
    keyboardCondition?: string | null;
}): boolean {
    const damageIndicators = [
        'structural_damage',
        'cracked',
        'screen_blemish',
        'non_functional',
        'missing_keys'
    ];

    const fields = [
        data.exteriorCondition,
        data.screenCondition,
        data.buttonPortCondition,
        data.keyboardCondition
    ];

    return fields.some(field => field && damageIndicators.includes(field));
}

/**
 * Create a new inspection
 */
export async function createInspection(data: {
    assetId: number;
    inspectionType: 'checkout' | 'checkin' | 'periodic' | 'incident';
    exteriorCondition?: string;
    exteriorNotes?: string;
    screenCondition?: string;
    screenNotes?: string;
    buttonPortCondition?: string;
    buttonPortNotes?: string;
    keyboardCondition?: string;
    keyboardNotes?: string;
    touchpadCondition?: string;
    batteryHealth?: string;
    damageDescription?: string;
    estimatedCost?: number;
    notes?: string;
    photoFiles?: File[];
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const inspectorId = Number(session.user.id);

    // Auto-compute overall condition
    const overallCondition = computeOverallCondition(data);

    // Auto-detect damage
    const damageFound = detectDamage(data) || !!data.damageDescription;

    // Handle photo uploads
    let photoUrls: string[] = [];
    if (data.photoFiles && data.photoFiles.length > 0) {
        const uploadDir = join(process.cwd(), 'public', 'inspection-photos');
        await mkdir(uploadDir, { recursive: true });

        for (const file of data.photoFiles) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const filename = `${Date.now()}-${file.name}`;
            const filepath = join(uploadDir, filename);

            await writeFile(filepath, buffer);
            photoUrls.push(`/inspection-photos/${filename}`);
        }
    }

    // Create inspection
    const inspection = await prisma.inspection.create({
        data: {
            assetId: data.assetId,
            inspectionType: data.inspectionType,
            inspectorId,
            exteriorCondition: data.exteriorCondition,
            exteriorNotes: data.exteriorNotes,
            screenCondition: data.screenCondition,
            screenNotes: data.screenNotes,
            buttonPortCondition: data.buttonPortCondition,
            buttonPortNotes: data.buttonPortNotes,
            keyboardCondition: data.keyboardCondition,
            keyboardNotes: data.keyboardNotes,
            touchpadCondition: data.touchpadCondition,
            batteryHealth: data.batteryHealth,
            overallCondition,
            damageFound,
            damageDescription: data.damageDescription,
            estimatedCost: data.estimatedCost,
            photoUrls: photoUrls.length > 0 ? JSON.stringify(photoUrls) : null,
            notes: data.notes
        },
        include: {
            asset: true,
            inspector: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    revalidatePath('/dashboard/assets');
    revalidatePath(`/dashboard/assets/${data.assetId}`);

    return {
        ...inspection,
        estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
        asset: {
            ...inspection.asset,
            cost: inspection.asset.cost ? Number(inspection.asset.cost) : null
        }
    };
}

/**
 * Get all inspections for an asset
 */
export async function getAssetInspections(assetId: number) {
    const session = await auth();
    if (!session) return [];

    return await prisma.inspection.findMany({
        where: { assetId },
        include: {
            inspector: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        },
        orderBy: { inspectionDate: 'desc' }
    });
}

/**
 * Get inspection by ID
 */
export async function getInspectionById(id: number) {
    const session = await auth();
    if (!session) return null;

    return await prisma.inspection.findUnique({
        where: { id },
        include: {
            asset: true,
            inspector: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });
}

/**
 * Update inspection
 */
export async function updateInspection(id: number, data: {
    exteriorCondition?: string;
    exteriorNotes?: string;
    screenCondition?: string;
    screenNotes?: string;
    buttonPortCondition?: string;
    buttonPortNotes?: string;
    keyboardCondition?: string;
    keyboardNotes?: string;
    touchpadCondition?: string;
    batteryHealth?: string;
    damageDescription?: string;
    estimatedCost?: number;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    // Auto-compute overall condition
    const overallCondition = computeOverallCondition(data);

    // Auto-detect damage
    const damageFound = detectDamage(data) || !!data.damageDescription;

    const inspection = await prisma.inspection.update({
        where: { id },
        data: {
            ...data,
            overallCondition,
            damageFound
        },
        include: {
            asset: true,
            inspector: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    revalidatePath('/dashboard/assets');
    revalidatePath(`/dashboard/assets/${inspection.assetId}`);

    return {
        ...inspection,
        estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
        asset: {
            ...inspection.asset,
            cost: inspection.asset.cost ? Number(inspection.asset.cost) : null
        }
    };
}

/**
 * Delete inspection
 */
export async function deleteInspection(id: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const inspection = await prisma.inspection.delete({
        where: { id }
    });

    revalidatePath('/dashboard/assets');
    revalidatePath(`/dashboard/assets/${inspection.assetId}`);

    return { success: true };
}
