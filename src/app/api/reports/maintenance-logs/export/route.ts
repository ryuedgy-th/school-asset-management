import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import ExcelJS from 'exceljs';

// GET /api/reports/maintenance-logs/export - Export maintenance logs
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canView = await hasPermission(session.user as any, 'maintenance', 'view');
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get query params
        const searchParams = request.nextUrl.searchParams;
        const assetId = searchParams.get('assetId');
        const type = searchParams.get('type');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build where clause
        const where: any = {};
        if (assetId) where.assetId = parseInt(assetId);
        if (type) where.type = type;
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) where.date.lte = new Date(dateTo);
        }

        // Fetch logs
        const logs = await prisma.maintenanceLog.findMany({
            where,
            include: {
                asset: {
                    select: {
                        assetCode: true,
                        name: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Maintenance Logs');

        // Define columns
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Asset Code', key: 'assetCode', width: 15 },
            { header: 'Asset Name', key: 'assetName', width: 30 },
            { header: 'Type', key: 'type', width: 18 },
            { header: 'Description', key: 'description', width: 40 },
            { header: 'Performed By', key: 'performedBy', width: 20 },
            { header: 'Cost (฿)', key: 'cost', width: 12 },
            { header: 'Parts Changed', key: 'partsChanged', width: 25 },
            { header: 'Current Reading', key: 'currentReading', width: 15 },
            { header: 'Notes', key: 'notes', width: 30 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF574193' }
        };

        // Add data rows
        logs.forEach((log) => {
            worksheet.addRow({
                date: new Date(log.date).toLocaleDateString(),
                assetCode: log.asset?.assetCode || 'N/A',
                assetName: log.asset?.name || 'N/A',
                type: log.type,
                description: log.description || '',
                performedBy: log.performedBy || '',
                cost: log.cost ? Number(log.cost) : '',
                partsChanged: log.partsChanged || '',
                currentReading: '',  // Field doesn't exist in schema
                notes: ''  // Field doesn't exist in schema
            });
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        const filename = `maintenance-logs-${new Date().toISOString().split('T')[0]}.xlsx`;

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error exporting maintenance logs:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
