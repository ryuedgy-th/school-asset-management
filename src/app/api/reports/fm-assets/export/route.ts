import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import ExcelJS from 'exceljs';

// GET /api/reports/fm-assets/export - Export FM assets to Excel/CSV
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canView = await hasPermission(session.user as any, 'fm_assets', 'view');
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get query params
        const searchParams = request.nextUrl.searchParams;
        const format = searchParams.get('format') || 'excel'; // excel or csv
        const categoryId = searchParams.get('categoryId');
        const status = searchParams.get('status');

        // Build where clause
        const where: any = {};
        if (categoryId) where.categoryId = parseInt(categoryId);
        if (status) where.status = status;

        // Fetch assets
        const assets = await prisma.fMAsset.findMany({
            where,
            include: {
                category: true,
                createdBy: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        components: true,
                        pmSchedules: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('FM Assets');

        // Define columns
        worksheet.columns = [
            { header: 'Asset Code', key: 'assetCode', width: 15 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Brand', key: 'brand', width: 15 },
            { header: 'Model', key: 'model', width: 15 },
            { header: 'Serial Number', key: 'serialNumber', width: 20 },
            { header: 'Location', key: 'location', width: 25 },
            { header: 'Building', key: 'building', width: 15 },
            { header: 'Floor', key: 'floor', width: 10 },
            { header: 'Room', key: 'room', width: 10 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Condition', key: 'condition', width: 12 },
            { header: 'Purchase Date', key: 'purchaseDate', width: 15 },
            { header: 'Install Date', key: 'installDate', width: 15 },
            { header: 'Warranty Expiry', key: 'warrantyExpiry', width: 15 },
            { header: 'Purchase Cost', key: 'purchaseCost', width: 15 },
            { header: 'Current Value', key: 'currentValue', width: 15 },
            { header: 'Components', key: 'components', width: 12 },
            { header: 'PM Schedules', key: 'pmSchedules', width: 12 },
            { header: 'Requires Maintenance', key: 'requiresMaintenance', width: 18 },
            { header: 'Created By', key: 'createdBy', width: 20 },
            { header: 'Created At', key: 'createdAt', width: 18 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF574193' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add data rows
        assets.forEach((asset) => {
            worksheet.addRow({
                assetCode: asset.assetCode,
                name: asset.name,
                category: asset.category.name,
                type: asset.type,
                brand: asset.brand || '',
                model: asset.model || '',
                serialNumber: asset.serialNumber || '',
                location: asset.location,
                building: asset.building || '',
                floor: asset.floor || '',
                room: asset.room || '',
                status: asset.status,
                condition: asset.condition,
                purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '',
                installDate: asset.installDate ? new Date(asset.installDate).toLocaleDateString() : '',
                warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '',
                purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : '',
                currentValue: asset.currentValue ? Number(asset.currentValue) : '',
                components: asset._count.components,
                pmSchedules: asset._count.pmSchedules,
                requiresMaintenance: asset.requiresMaintenance ? 'Yes' : 'No',
                createdBy: asset.createdBy?.name || '',
                createdAt: new Date(asset.createdAt).toLocaleDateString()
            });
        });

        // Generate buffer
        let buffer: ArrayBuffer;
        let filename: string;
        let mimeType: string;

        if (format === 'csv') {
            buffer = await workbook.csv.writeBuffer();
            filename = `fm-assets-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
        } else {
            buffer = await workbook.xlsx.writeBuffer();
            filename = `fm-assets-${new Date().toISOString().split('T')[0]}.xlsx`;
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }

        // Return file
        return new Response(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error exporting FM assets:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
