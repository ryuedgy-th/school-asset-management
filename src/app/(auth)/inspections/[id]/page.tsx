import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import InspectionDetailClient from './InspectionDetailClient';

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const inspection = await prisma.inspection.findUnique({
        where: { id: parseInt(id) },
        include: {
            asset: true,
            inspector: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            approver: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    if (!inspection) {
        notFound();
    }

    // Convert Decimal to number for Client Component
    const serializedInspection = {
        ...inspection,
        estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
        repairCost: inspection.repairCost ? Number(inspection.repairCost) : null,
        asset: {
            ...inspection.asset,
            cost: inspection.asset.cost ? Number(inspection.asset.cost) : null
        },
        assignment: inspection.assignment ? {
            ...inspection.assignment,
            // No Decimal fields in assignment
        } : null,
        approver: inspection.approver || null
    };

    return <InspectionDetailClient inspection={serializedInspection} />;
}
