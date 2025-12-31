'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import StationaryLocationsClient from './StationaryLocationsClient';

export default async function StationaryLocationsPage() {
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

    // Fetch locations with related data
    const locations = await prisma.stationaryLocation.findMany({
        include: {
            department: { select: { id: true, code: true, name: true } },
            managedBy: { select: { id: true, name: true, email: true } },
            _count: { select: { stock: true } },
        },
        orderBy: { code: 'asc' },
    });

    // Fetch departments for the form
    const departments = await prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });

    // Fetch users for manager selection
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
    });

    return (
        <StationaryLocationsClient
            locations={locations}
            departments={departments}
            users={users}
            user={user}
        />
    );
}
