import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EditInspectionClient from './EditInspectionClient';

export default async function EditInspectionPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const { id } = await params;
    const inspectionId = parseInt(id);

    // Fetch inspection data
    const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        select: {
            id: true,
            damageDescription: true,
            estimatedCost: true,
            damageFound: true,
            damageStatus: true,
            asset: {
                select: {
                    name: true,
                    assetCode: true
                }
            }
        }
    });

    if (!inspection) {
        redirect('/inspections');
    }

    // Only allow editing if damage was found
    if (!inspection.damageFound) {
        redirect(`/inspections/${inspectionId}`);
    }

    return (
        <EditInspectionClient
            inspection={{
                id: inspection.id,
                damageDescription: inspection.damageDescription,
                estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
                asset: inspection.asset
            }}
        />
    );
}
