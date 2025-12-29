import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';

/**
 * GET /api/roles/[id]/permissions
 * Get role permissions
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const roleId = parseInt(resolvedParams.id);
        const permissions = await prisma.rolePermission.findMany({
            where: { roleId },
            include: {
                permission: {
                    include: {
                        module: true,
                    },
                },
            },
        });

        return NextResponse.json({ permissions });
    } catch (error: any) {
        console.error('Error fetching role permissions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch role permissions' },
            { status: 500 }
        );
    }
}
