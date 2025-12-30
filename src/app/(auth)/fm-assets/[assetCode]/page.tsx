import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import FMAssetDetailClient from './FMAssetDetailClient';

export default async function FMAssetDetailPage({
    params,
}: {
    params: Promise<{ assetCode: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: {
            userRole: true,
            userDepartment: true,
        },
    });

    if (!user || !hasModuleAccess(user, 'fm_assets')) {
        redirect('/');
    }

    const resolvedParams = await params;
    const { assetCode } = resolvedParams;

    // Fetch FM asset with all relations
    const fmAsset = await prisma.fMAsset.findUnique({
        where: { assetCode },
        include: {
            category: true,
            parentAsset: {
                select: {
                    id: true,
                    assetCode: true,
                    name: true,
                },
            },
            childAssets: {
                select: {
                    id: true,
                    assetCode: true,
                    name: true,
                    status: true,
                },
            },
            components: {
                include: {
                    serviceHistory: {
                        orderBy: { serviceDate: 'desc' },
                        take: 5,
                    },
                    spareParts: {
                        include: {
                            sparePart: true,
                        },
                    },
                    _count: {
                        select: {
                            serviceHistory: true,
                        },
                    },
                },
            },
            pmSchedules: {
                include: {
                    assignedTo: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            maintenanceLogs: {
                orderBy: { date: 'desc' },
                take: 20,
            },
            tickets: {
                where: {
                    status: {
                        not: 'closed',
                    },
                },
                include: {
                    reportedBy: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            inspectionRecords: {
                include: {
                    template: true,
                    inspectedBy: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { inspectionDate: 'desc' },
                take: 10,
            },
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!fmAsset) {
        notFound();
    }

    // Parse JSON fields and convert Decimal to number for client component
    const assetWithParsedData = {
        ...fmAsset,
        purchaseCost: fmAsset.purchaseCost ? Number(fmAsset.purchaseCost) : null,
        currentValue: fmAsset.currentValue ? Number(fmAsset.currentValue) : null,
        specifications: fmAsset.specifications ? JSON.parse(fmAsset.specifications as string) : null,
        images: fmAsset.images ? JSON.parse(fmAsset.images as string) : [],
        maintenanceLogs: fmAsset.maintenanceLogs.map(log => ({
            ...log,
            readings: log.readings ? JSON.parse(log.readings as string) : null,
            images: log.images ? JSON.parse(log.images as string) : [],
        })),
        pmSchedules: fmAsset.pmSchedules.map(schedule => ({
            ...schedule,
            checklistItems: schedule.checklistItems ? JSON.parse(schedule.checklistItems as string) : [],
        })),
        inspectionRecords: fmAsset.inspectionRecords.map(record => ({
            ...record,
            checklistResults: record.checklistResults ? JSON.parse(record.checklistResults as string) : null,
            images: record.images ? JSON.parse(record.images as string) : [],
        })),
    };

    // Fetch all users for assignment dropdowns
    const users = await prisma.user.findMany({
        where: {
            userDepartment: {
                code: 'FM',
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
        orderBy: { name: 'asc' },
    });

    // Fetch categories for dropdowns
    const categories = await prisma.fMAssetCategory.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <FMAssetDetailClient
            fmAsset={assetWithParsedData}
            users={users}
            categories={categories}
            user={user}
        />
    );
}
