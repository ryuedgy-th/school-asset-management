import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import StationaryRequisitionsClient from './StationaryRequisitionsClient';

export default async function StationaryRequisitionsPage() {
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

    if (!user || !hasModuleAccess(user, 'stationary')) {
        redirect('/');
    }

    // Fetch requisitions with relations
    const requisitionsRaw = await prisma.stationaryRequisition.findMany({
        include: {
            requestedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            approvedByL1: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            approvedByL2: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            department: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
            requestedForUser: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            items: {
                include: {
                    item: {
                        select: {
                            id: true,
                            itemCode: true,
                            name: true,
                            uom: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Convert Decimal to number
    const requisitions = requisitionsRaw.map(req => ({
        ...req,
        items: req.items.map(item => ({
            ...item,
            estimatedUnitCost: item.estimatedUnitCost ? Number(item.estimatedUnitCost) : null,
        })),
    }));

    // Fetch items for creating requisitions
    const itemsRaw = await prisma.stationaryItem.findMany({
        where: { isActive: true },
        select: {
            id: true,
            itemCode: true,
            name: true,
            uom: true,
            unitCost: true,
        },
        orderBy: { name: 'asc' },
    });

    // Convert Decimal to number
    const items = itemsRaw.map(item => ({
        ...item,
        unitCost: item.unitCost ? Number(item.unitCost) : 0,
    }));

    // Fetch departments
    const departments = await prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });

    return (
        <StationaryRequisitionsClient
            requisitions={requisitions}
            items={items}
            departments={departments}
            user={user}
        />
    );
}
