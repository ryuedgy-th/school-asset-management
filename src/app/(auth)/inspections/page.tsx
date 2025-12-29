import InspectionsClient from './InspectionsClient';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { ClipboardCheck, Calendar, User } from 'lucide-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDepartmentFilter } from '@/lib/permissions';

export const metadata: Metadata = {
    title: 'Asset Inspections | AssetMaster',
    description: 'View and manage asset inspection records',
};

export default async function InspectionsPage() {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    // Get user with department info
    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: {
            userRole: true,
            userDepartment: true,
        },
    });

    if (!user) {
        redirect('/login');
    }

    // Fetch recent inspections (filtered by department)
    const inspections = await prisma.inspection.findMany({
        where: {
            ...await getDepartmentFilter(user.id), // 🔒 Department isolation
        },
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

    // Fetch all assets for the create modal (filtered by department)
    const assets = await prisma.asset.findMany({
        where: {
            ...await getDepartmentFilter(user.id), // 🔒 Department isolation
        },
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
