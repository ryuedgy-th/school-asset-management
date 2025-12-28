import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// POST /api/fm-assets/bulk - Bulk operations on FM assets
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, assetIds, data } = body;

        if (!action || !assetIds || !Array.isArray(assetIds)) {
            return NextResponse.json(
                { error: 'Invalid request - action and assetIds required' },
                { status: 400 }
            );
        }

        // Check permissions based on action
        const permissionMap: Record<string, any> = {
            update: 'edit',
            delete: 'delete',
            updateStatus: 'edit',
            updateLocation: 'edit'
        };

        const requiredPermission = permissionMap[action];
        if (!requiredPermission) {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            );
        }

        const hasRequiredPermission = await hasPermission(
            session.user as any,
            'fm_assets',
            requiredPermission
        );

        if (!hasRequiredPermission) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let result;

        switch (action) {
            case 'update':
                // Bulk update specific fields
                result = await prisma.fMAsset.updateMany({
                    where: { id: { in: assetIds.map(id => parseInt(id)) } },
                    data: {
                        ...(data.status && { status: data.status }),
                        ...(data.location && { location: data.location }),
                        ...(data.condition && { condition: data.condition }),
                        ...(data.requiresMaintenance !== undefined && {
                            requiresMaintenance: data.requiresMaintenance
                        })
                    }
                });

                // Create audit logs
                for (const assetId of assetIds) {
                    await prisma.auditLog.create({
                        data: {
                            userId: parseInt(session.user.id),
                            action: 'BULK_UPDATE',
                            entity: 'FMAsset',
                            entityId: assetId.toString(),
                            details: `Bulk updated asset${data.status ? ` status to ${data.status}` : ''}${data.location ? ` location to ${data.location}` : ''}`
                        }
                    });
                }
                break;

            case 'delete':
                // Soft delete - set status to retired
                result = await prisma.fMAsset.updateMany({
                    where: { id: { in: assetIds.map(id => parseInt(id)) } },
                    data: { status: 'retired' }
                });

                // Create audit logs
                for (const assetId of assetIds) {
                    await prisma.auditLog.create({
                        data: {
                            userId: parseInt(session.user.id),
                            action: 'BULK_DELETE',
                            entity: 'FMAsset',
                            entityId: assetId.toString(),
                            details: 'Bulk retired asset'
                        }
                    });
                }
                break;

            case 'updateStatus':
                if (!data.status) {
                    return NextResponse.json(
                        { error: 'Status is required for updateStatus action' },
                        { status: 400 }
                    );
                }

                result = await prisma.fMAsset.updateMany({
                    where: { id: { in: assetIds.map(id => parseInt(id)) } },
                    data: { status: data.status }
                });

                for (const assetId of assetIds) {
                    await prisma.auditLog.create({
                        data: {
                            userId: parseInt(session.user.id),
                            action: 'BULK_STATUS_UPDATE',
                            entity: 'FMAsset',
                            entityId: assetId.toString(),
                            details: `Bulk changed status to ${data.status}`
                        }
                    });
                }
                break;

            case 'updateLocation':
                if (!data.location) {
                    return NextResponse.json(
                        { error: 'Location is required for updateLocation action' },
                        { status: 400 }
                    );
                }

                result = await prisma.fMAsset.updateMany({
                    where: { id: { in: assetIds.map(id => parseInt(id)) } },
                    data: {
                        location: data.location,
                        ...(data.building && { building: data.building }),
                        ...(data.floor && { floor: data.floor }),
                        ...(data.room && { room: data.room })
                    }
                });

                for (const assetId of assetIds) {
                    await prisma.auditLog.create({
                        data: {
                            userId: parseInt(session.user.id),
                            action: 'BULK_LOCATION_UPDATE',
                            entity: 'FMAsset',
                            entityId: assetId.toString(),
                            details: `Bulk changed location to ${data.location}`
                        }
                    });
                }
                break;

            default:
                return NextResponse.json(
                    { error: 'Unsupported action' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            message: `Successfully performed ${action} on ${assetIds.length} asset(s)`,
            count: result.count
        });
    } catch (error) {
        console.error('Error performing bulk operation:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
