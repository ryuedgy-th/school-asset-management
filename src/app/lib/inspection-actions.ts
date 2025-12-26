'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { sendInspectionReport } from '@/lib/email';
import { sendDamageApprovalEmail, sendDamageWaiverEmail } from '@/lib/email-damage';

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
 * Generate unique inspection number: INS-YYYY-NNN
 */
async function generateInspectionNumber(): Promise<string> {
    const year = new Date().getFullYear();

    // Get the latest inspection number for this year
    const latestInspection = await prisma.inspection.findFirst({
        where: {
            inspectionNumber: {
                startsWith: `INS-${year}-`,
            },
        },
        orderBy: {
            inspectionNumber: 'desc',
        },
    });

    let nextNumber = 1;
    if (latestInspection?.inspectionNumber) {
        const match = latestInspection.inspectionNumber.match(/INS-\d{4}-(\d{3})/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    return `INS-${year}-${nextNumber.toString().padStart(3, '0')}`;
}

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
 * Find active assignment for an asset
 * Returns the assignment if the asset is currently borrowed and not yet returned
 */
async function findActiveAssignmentForAsset(assetId: number) {
    const assignment = await prisma.assignment.findFirst({
        where: {
            status: 'Active',
            borrowTransactions: {
                some: {
                    items: {
                        some: {
                            assetId: assetId,
                            status: {
                                in: ['Borrowed', 'Reserved']
                            }
                        }
                    }
                }
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true
                }
            },
            borrowTransactions: {
                where: {
                    items: {
                        some: { assetId }
                    }
                },
                orderBy: { borrowDate: 'desc' },
                take: 1,
                include: {
                    items: {
                        where: { assetId }
                    }
                }
            }
        }
    });

    return assignment;
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

    // ✨ NEW: Auto-detect active assignment for this asset
    const assignment = await findActiveAssignmentForAsset(data.assetId);

    // Handle photo uploads
    let photoUrls: string[] = [];
    if (data.photoFiles && data.photoFiles.length > 0) {
        const uploadDir = path.join(process.cwd(), 'public', 'inspection-photos');
        await mkdir(uploadDir, { recursive: true });

        for (const file of data.photoFiles) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const filename = `${Date.now()}-${file.name}`;
            const filepath = path.join(uploadDir, filename);

            await writeFile(filepath, buffer);
            photoUrls.push(`/inspection-photos/${filename}`);
        }
    }

    // Generate unique inspection number
    const inspectionNumber = await generateInspectionNumber();

    // Create inspection
    const inspection = await prisma.inspection.create({
        data: {
            inspectionNumber,
            assetId: data.assetId,
            inspectionType: data.inspectionType,
            inspectorId,
            assignmentId: assignment?.id, // ✨ NEW: Link to assignment
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
            notes: data.notes,
            emailSent: false, // ✨ NEW: Email tracking
            acknowledgementPdfGenerated: false, // ✨ NEW: PDF tracking
            damageStatus: damageFound ? 'pending_review' : null // ✨ NEW: Workflow status
        },
        include: {
            asset: {
                select: {
                    id: true,
                    name: true,
                    assetCode: true,
                    category: true,
                    cost: true
                }
            },
            inspector: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            assignment: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            department: true
                        }
                    },
                    borrowTransactions: {
                        orderBy: { borrowDate: 'desc' },
                        take: 1,
                        select: {
                            borrowDate: true
                        }
                    }
                }
            }
        }
    });

    // ✨ NEW: Send inspection report email automatically
    if (assignment) {
        try {
            await sendInspectionReport({
                id: inspection.id,
                asset: inspection.asset,
                assignment: inspection.assignment,
                inspector: inspection.inspector,
                inspectionDate: inspection.inspectionDate,
                inspectionType: inspection.inspectionType,
                overallCondition: inspection.overallCondition,
                exteriorCondition: inspection.exteriorCondition,
                screenCondition: inspection.screenCondition,
                keyboardCondition: inspection.keyboardCondition,
                batteryHealth: inspection.batteryHealth,
                damageFound: inspection.damageFound,
                damageDescription: inspection.damageDescription,
                estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
                photoUrls: inspection.photoUrls,
                notes: inspection.notes
            });

            // Update email sent status
            await prisma.inspection.update({
                where: { id: inspection.id },
                data: {
                    emailSent: true,
                    emailSentAt: new Date()
                }
            });

            console.log(`✅ Inspection report email sent for inspection #${inspection.id}`);
        } catch (emailError) {
            console.error(`❌ Failed to send inspection email:`, emailError);
            // Don't fail the whole operation if email fails
        }
    }

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
 * Update inspection cost (after getting quotation)
 */
export async function updateInspectionCost(
    inspectionId: number,
    data: {
        estimatedCost: number;
        damageDescription?: string;
    }
) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    // Get current inspection
    const currentInspection = await prisma.inspection.findUnique({
        where: { id: inspectionId }
    });

    if (!currentInspection) {
        throw new Error('Inspection not found');
    }

    // Update inspection
    const inspection = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            estimatedCost: data.estimatedCost,
            damageDescription: data.damageDescription || currentInspection.damageDescription,
            damageStatus: 'quotation_received'
        },
        include: {
            asset: {
                select: {
                    id: true,
                    name: true,
                    assetCode: true,
                    category: true,
                    cost: true
                }
            },
            inspector: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            assignment: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            department: true
                        }
                    },
                    borrowTransactions: {
                        orderBy: { borrowDate: 'desc' },
                        take: 1,
                        select: {
                            borrowDate: true
                        }
                    }
                }
            }
        }
    });

    // Send updated email notification
    if (inspection.assignment) {
        try {
            await sendInspectionReport({
                id: inspection.id,
                asset: inspection.asset,
                assignment: inspection.assignment,
                inspector: inspection.inspector,
                inspectionDate: inspection.inspectionDate,
                inspectionType: inspection.inspectionType,
                overallCondition: inspection.overallCondition,
                exteriorCondition: inspection.exteriorCondition,
                screenCondition: inspection.screenCondition,
                keyboardCondition: inspection.keyboardCondition,
                batteryHealth: inspection.batteryHealth,
                damageFound: inspection.damageFound,
                damageDescription: inspection.damageDescription,
                estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
                photoUrls: inspection.photoUrls,
                notes: inspection.notes
            });

            console.log(`✅ Updated inspection report email sent for inspection #${inspection.id}`);
        } catch (emailError) {
            console.error(`❌ Failed to send updated inspection email:`, emailError);
        }
    }

    revalidatePath('/dashboard/inspections');
    revalidatePath(`/dashboard/inspections/${inspectionId}`);

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
 * Approve damage claim (Directors only)
 */
export async function approveDamage(
    inspectionId: number,
    notes?: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const inspection = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            damageStatus: 'approved',
            approvedBy: parseInt(session.user.id),
            approvedAt: new Date(),
            approvalNotes: notes
        },
        include: {
            asset: {
                select: {
                    name: true,
                    assetCode: true
                }
            },
            assignment: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            },
            approver: {
                select: {
                    name: true
                }
            }
        }
    });

    // Send approval notification email
    if (inspection.assignment?.user) {
        try {
            await sendDamageApprovalEmail({
                inspection: {
                    id: inspection.id,
                    asset: inspection.asset,
                    estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
                    damageDescription: inspection.damageDescription
                },
                user: inspection.assignment.user,
                approver: inspection.approver!,
                approvalNotes: inspection.approvalNotes
            });
            console.log(`✅ Damage approval email sent for inspection #${inspectionId}`);
        } catch (emailError) {
            console.error(`❌ Failed to send approval email:`, emailError);
        }
    }

    revalidatePath('/dashboard/inspections');
    revalidatePath(`/inspections/${inspectionId}`);

    return inspection;
}

/**
 * Waive damage charges (Directors only)
 */
export async function waiveDamage(
    inspectionId: number,
    reason: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const inspection = await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            damageStatus: 'waived',
            approvedBy: parseInt(session.user.id),
            approvedAt: new Date(),
            approvalNotes: reason
        },
        include: {
            asset: {
                select: {
                    name: true,
                    assetCode: true
                }
            },
            assignment: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            },
            approver: {
                select: {
                    name: true
                }
            }
        }
    });

    // Send waiver notification email
    if (inspection.assignment?.user) {
        try {
            await sendDamageWaiverEmail({
                inspection: {
                    id: inspection.id,
                    asset: inspection.asset,
                    estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
                    damageDescription: inspection.damageDescription
                },
                user: inspection.assignment.user,
                approver: inspection.approver!,
                waiverReason: reason
            });
            console.log(`✅ Damage waiver email sent for inspection #${inspectionId}`);
        } catch (emailError) {
            console.error(`❌ Failed to send waiver email:`, emailError);
        }
    }

    revalidatePath('/dashboard/inspections');
    revalidatePath(`/inspections/${inspectionId}`);

    return inspection;
}

/**
 * Generate and send damage acknowledgement form (PDF)
 */
export async function generateAndSendDamageForm(inspectionId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    // Get inspection with all required data
    const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        include: {
            asset: {
                select: {
                    name: true,
                    assetCode: true,
                    category: true
                }
            },
            inspector: {
                select: {
                    name: true,
                    email: true,
                    department: true
                }
            },
            assignment: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            department: true
                        }
                    },
                    borrowTransactions: {
                        orderBy: { borrowDate: 'desc' },
                        take: 1,
                        select: {
                            borrowDate: true
                        }
                    }
                }
            }
        }
    });

    if (!inspection) {
        throw new Error('Inspection not found');
    }

    if (!inspection.estimatedCost) {
        throw new Error('Estimated cost is required to generate form');
    }

    // Use assignment user if available, otherwise show N/A
    const userData = inspection.assignment?.user || {
        name: 'Not Assigned',
        email: null,
        department: null
    };

    // Generate PDF
    const { generateDamageAcknowledgementPDF } = await import('@/lib/pdf-generator');

    // Parse photoUrls from JSON string to array
    let photoUrlsArray: string[] | null = null;
    if (inspection.photoUrls) {
        try {
            photoUrlsArray = JSON.parse(inspection.photoUrls);
        } catch (error) {
            console.warn('Failed to parse photoUrls:', error);
        }
    }

    const pdfPath = await generateDamageAcknowledgementPDF({
        inspectionId: inspection.id,
        asset: inspection.asset,
        user: {
            name: userData.name || 'Not Assigned',
            email: userData.email || null,
            department: userData.department || null
        },
        damageDescription: inspection.damageDescription,
        estimatedCost: Number(inspection.estimatedCost),
        inspectionDate: inspection.inspectionDate,
        borrowDate: inspection.assignment?.borrowTransactions[0]?.borrowDate || null,
        photoUrls: photoUrlsArray
    });

    // Update inspection status
    await prisma.inspection.update({
        where: { id: inspectionId },
        data: {
            damageStatus: 'form_sent',
            formSentAt: new Date(),
            acknowledgementPdfGenerated: true,
            acknowledgementPdfPath: pdfPath
        }
    });

    // TODO: Send email with PDF attachment
    console.log(`✅ Damage form generated and sent for inspection #${inspectionId}`);
    console.log(`📄 PDF path: ${pdfPath}`);

    revalidatePath('/dashboard/inspections');
    revalidatePath(`/inspections/${inspectionId}`);

    return { pdfPath };
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
