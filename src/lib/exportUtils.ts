import * as XLSX from 'xlsx';

/**
 * Export requisitions data to Excel
 */
export function exportRequisitionsToExcel(requisitions: any[]) {
    // Prepare data for Excel
    const data = requisitions.map(req => ({
        'Requisition No': req.requisitionNo,
        'Department': req.department?.name || '-',
        'Requested By': req.requestedBy?.name || '-',
        'Status': req.status,
        'Request Date': new Date(req.createdAt).toLocaleDateString('th-TH'),
        'Total Items': req.items?.length || 0,
        'Remarks': req.remarks || '-',
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 18 }, // Requisition No
        { wch: 20 }, // Department
        { wch: 25 }, // Requested By
        { wch: 12 }, // Status
        { wch: 15 }, // Request Date
        { wch: 12 }, // Total Items
        { wch: 30 }, // Remarks
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Requisitions');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Stationary_Requisitions_${timestamp}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);
}

/**
 * Export analytics data to Excel with multiple sheets
 */
export function exportAnalyticsToExcel(data: {
    overview?: any;
    consumption?: any;
    departmentUsage?: any;
    costAnalysis?: any;
}) {
    const wb = XLSX.utils.book_new();

    // Overview Sheet
    if (data.overview) {
        const overviewData = [
            { Metric: 'Total Items', Value: data.overview.totalItems },
            { Metric: 'Total Inventory Value', Value: data.overview.totalInventoryValue },
            { Metric: 'Pending Requisitions', Value: data.overview.pendingRequisitions },
            { Metric: 'Low Stock Items', Value: data.overview.lowStockItems },
            { Metric: 'This Month Expenditure', Value: data.overview.thisMonthExpenditure },
        ];
        const ws1 = XLSX.utils.json_to_sheet(overviewData);
        ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Overview');
    }

    // Department Usage Sheet
    if (data.departmentUsage?.departments) {
        const ws2 = XLSX.utils.json_to_sheet(data.departmentUsage.departments);
        ws2['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Department Usage');
    }

    // Cost Analysis Sheet
    if (data.costAnalysis?.categories) {
        const ws3 = XLSX.utils.json_to_sheet(data.costAnalysis.categories);
        ws3['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Cost by Category');
    }

    // Top Items Sheet
    if (data.consumption?.topItems) {
        const ws4 = XLSX.utils.json_to_sheet(data.consumption.topItems);
        ws4['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Top Items');
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Stationary_Analytics_${timestamp}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);
}

/**
 * Export single requisition details to Excel
 */
export function exportRequisitionDetailsToExcel(requisition: any) {
    const wb = XLSX.utils.book_new();

    // Header Info Sheet
    const headerData = [
        { Field: 'Requisition No', Value: requisition.requisitionNo },
        { Field: 'Department', Value: requisition.department?.name || '-' },
        { Field: 'Requested By', Value: requisition.requestedBy?.name || '-' },
        { Field: 'Email', Value: requisition.requestedBy?.email || '-' },
        { Field: 'Status', Value: requisition.status },
        { Field: 'Request Date', Value: new Date(requisition.createdAt).toLocaleDateString('th-TH') },
        { Field: 'Remarks', Value: requisition.remarks || '-' },
    ];
    const ws1 = XLSX.utils.json_to_sheet(headerData);
    ws1['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Details');

    // Items Sheet
    if (requisition.items && requisition.items.length > 0) {
        const itemsData = requisition.items.map((item: any) => ({
            'Item Code': item.item?.itemCode || '-',
            'Item Name': item.item?.name || '-',
            'Quantity': item.quantityRequested,
            'Unit': item.item?.uom || '-',
            'Estimated Cost': item.estimatedUnitCost || 0,
            'Total': (item.quantityRequested * (item.estimatedUnitCost || 0)),
        }));
        const ws2 = XLSX.utils.json_to_sheet(itemsData);
        ws2['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Items');
    }

    // Download
    const filename = `Requisition_${requisition.requisitionNo}.xlsx`;
    XLSX.writeFile(wb, filename);
}
