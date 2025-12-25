import InspectionsClient from './InspectionsClient';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { ClipboardCheck, Calendar, User } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Asset Inspections | AssetMaster',
    description: 'View and manage asset inspection records',
};

export default async function InspectionsPage() {
    // Fetch recent inspections
    const inspections = await prisma.inspection.findMany({
        include: {
            asset: {
                select: {
                    id: true,
                    name: true,
                    assetCode: true,
                    category: true
                }
            },
            inspector: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            inspectionDate: 'desc'
        },
        take: 50
    });

    // Fetch all assets for the create modal
    const assets = await prisma.asset.findMany({
        select: {
            id: true,
            name: true,
            assetCode: true
        },
        orderBy: {
            assetCode: 'asc'
        }
    });

    // Convert Decimal to number for client component
    const serializedInspections = inspections.map(inspection => ({
        ...inspection,
        estimatedCost: inspection.estimatedCost ? Number(inspection.estimatedCost) : null
    }));

    return <InspectionsClient inspections={serializedInspections} assets={assets} />;
}
