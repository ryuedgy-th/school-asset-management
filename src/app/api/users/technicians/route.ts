import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/technicians - List users who can be assigned tickets
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all users with technician or admin roles
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ['Admin', 'Technician'],
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                userDepartment: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.userDepartment?.name || 'N/A',
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (error) {
        console.error('Error fetching technicians:', error);
        return NextResponse.json(
            { error: 'Failed to fetch technicians' },
            { status: 500 }
        );
    }
}
