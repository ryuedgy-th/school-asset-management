import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export single requisition to PDF
 */
export function exportRequisitionToPDF(requisition: any) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Stationary Requisition', 105, 20, { align: 'center' });

    // Header Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const headerY = 35;
    doc.text(`Requisition No: ${requisition.requisitionNo}`, 20, headerY);
    doc.text(`Date: ${new Date(requisition.createdAt).toLocaleDateString('th-TH')}`, 20, headerY + 7);
    doc.text(`Department: ${requisition.department?.name || '-'}`, 20, headerY + 14);
    doc.text(`Requested By: ${requisition.requestedBy?.name || '-'}`, 20, headerY + 21);
    doc.text(`Email: ${requisition.requestedBy?.email || '-'}`, 20, headerY + 28);
    doc.text(`Status: ${requisition.status.toUpperCase()}`, 20, headerY + 35);

    if (requisition.remarks) {
        doc.text(`Remarks: ${requisition.remarks}`, 20, headerY + 42);
    }

    // Items Table
    if (requisition.items && requisition.items.length > 0) {
        const tableData = requisition.items.map((item: any) => [
            item.item?.itemCode || '-',
            item.item?.name || '-',
            item.quantityRequested.toString(),
            item.item?.uom || '-',
            item.estimatedUnitCost?.toFixed(2) || '0.00',
            (item.quantityRequested * (item.estimatedUnitCost || 0)).toFixed(2),
        ]);

        autoTable(doc, {
            startY: headerY + 50,
            head: [['Item Code', 'Item Name', 'Qty', 'Unit', 'Unit Cost', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] }, // green
            styles: { fontSize: 9 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 60 },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 25, halign: 'right' },
                5: { cellWidth: 25, halign: 'right' },
            },
        });

        // Total
        const total = requisition.items.reduce((sum: number, item: any) => {
            return sum + (item.quantityRequested * (item.estimatedUnitCost || 0));
        }, 0);

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.text(`Grand Total: ฿${total.toFixed(2)}`, 170, finalY, { align: 'right' });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Page ${i} of ${pageCount}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Generated on ${new Date().toLocaleString('th-TH')}`,
            20,
            doc.internal.pageSize.height - 10
        );
    }

    // Download
    doc.save(`Requisition_${requisition.requisitionNo}.pdf`);
}

/**
 * Export analytics summary to PDF
 */
export function exportAnalyticsToPDF(data: {
    overview?: any;
    departmentUsage?: any;
    costAnalysis?: any;
}) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Stationary Analytics Report', 105, 20, { align: 'center' });

    // Date Range
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('th-TH')}`, 105, 30, { align: 'center' });

    let currentY = 45;

    // Overview Section
    if (data.overview) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Overview', 20, currentY);
        currentY += 10;

        const overviewData = [
            ['Total Items', data.overview.totalItems.toString()],
            ['Inventory Value', `฿${data.overview.totalInventoryValue.toFixed(2)}`],
            ['Pending Requisitions', data.overview.pendingRequisitions.toString()],
            ['Low Stock Items', data.overview.lowStockItems.toString()],
            ['This Month Expenditure', `฿${data.overview.thisMonthExpenditure.toFixed(2)}`],
        ];

        autoTable(doc, {
            startY: currentY,
            head: [['Metric', 'Value']],
            body: overviewData,
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 60, halign: 'right' },
            },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Department Usage
    if (data.departmentUsage?.departments && currentY < 250) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Top Departments by Cost', 20, currentY);
        currentY += 10;

        const deptData = data.departmentUsage.departments
            .slice(0, 10)
            .map((dept: any) => [
                dept.department,
                dept.requisitionCount.toString(),
                `฿${dept.totalCost.toFixed(2)}`,
            ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Department', 'Requisitions', 'Total Cost']],
            body: deptData,
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 9 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Add new page if needed for cost analysis
    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }

    // Cost by Category
    if (data.costAnalysis?.categories) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Cost by Category', 20, currentY);
        currentY += 10;

        const catData = data.costAnalysis.categories.map((cat: any) => [
            cat.category,
            cat.totalQuantity.toString(),
            `฿${cat.totalCost.toFixed(2)}`,
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Category', 'Quantity', 'Total Cost']],
            body: catData,
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 9 },
        });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // Download
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`Analytics_Report_${timestamp}.pdf`);
}
