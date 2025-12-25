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
            }
        }
    });

    if (!inspection) {
        notFound();
    }

    // Convert Decimal to number
    const serializedInspection = {
        ...inspection,
        estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null,
        asset: {
            ...inspection.asset,
            cost: inspection.asset.cost ? Number(inspection.asset.cost) : null
        }
    };

    return <InspectionDetailClient inspection={serializedInspection} />;
}
