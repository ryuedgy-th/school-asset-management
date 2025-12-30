'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface IssueItem {
    id: number;
    quantity: number;
    unitCost: number | null;
    totalCost: number | null;
    batchNumber: string | null;
    item: {
        id: number;
        itemCode: string;
        name: string;
        uom: string;
    };
}

interface IssueData {
    id: number;
    issueNo: string;
    deliveryMethod: string;
    deliveryDate: Date | null;
    deliveryNotes: string | null;
    status: string;
    notes: string | null;
    totalCost: number | null;
    createdAt: Date;
    updatedAt: Date;
    acknowledgedAt: Date | null;
    issuedBy: {
        id: number;
        name: string | null;
        email: string | null;
    };
    issuedTo: {
        id: number;
        name: string | null;
        email: string | null;
    };
    acknowledgedBy: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    department: {
        id: number;
        code: string;
        name: string;
    };
    location: {
        id: number;
        code: string;
        name: string;
        type: string;
    };
    requisition: {
        id: number;
        requisitionNo: string;
    } | null;
    items: IssueItem[];
}

export default function StationaryIssueDetailClient({
    issue,
    canAcknowledge,
    canEdit,
    currentUserId,
}: {
    issue: IssueData;
    canAcknowledge: boolean;
    canEdit: boolean;
    currentUserId: number;
}) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAcknowledge = async () => {
        const result = await Swal.fire({
            title: 'Acknowledge Receipt?',
            text: 'Confirm that you have received all items listed in this issue voucher.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, I received them',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                const res = await fetch(`/api/stationary/issues/${issue.issueNo}/acknowledge`, {
                    method: 'POST',
                });

                if (res.ok) {
                    await Swal.fire('Acknowledged!', 'Receipt has been confirmed.', 'success');
                    router.refresh();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to acknowledge');
                }
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            issued: { label: 'Issued', color: 'bg-blue-100 text-blue-800' },
            delivered: { label: 'Delivered', color: 'bg-purple-100 text-purple-800' },
            acknowledged: { label: 'Acknowledged', color: 'bg-green-100 text-green-800' },
        };
        return badges[status] || badges.pending;
    };

    const statusBadge = getStatusBadge(issue.status);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Link href="/stationary" className="hover:text-green-600">Stationary</Link>
                    <span>/</span>
                    <Link href="/stationary/issues" className="hover:text-green-600">Issues</Link>
                    <span>/</span>
                    <span className="text-slate-900">{issue.issueNo}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">Issue Voucher</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.color}`}>
                                {statusBadge.label}
                            </span>
                        </div>
                        <p className="text-slate-600 mt-1">{issue.issueNo}</p>
                    </div>
                    <div className="flex gap-3">
                        {canAcknowledge && (
                            <button
                                onClick={handleAcknowledge}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Acknowledge Receipt'}
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Print Voucher
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Issued Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Item</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
                                        {issue.items.some(i => i.batchNumber) && (
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Batch</th>
                                        )}
                                        {issue.items.some(i => i.unitCost !== null) && (
                                            <>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Unit Cost</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {issue.items.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <Link
                                                        href={`/stationary/items/${item.item.itemCode}`}
                                                        className="font-medium text-green-600 hover:text-green-700"
                                                    >
                                                        {item.item.name}
                                                    </Link>
                                                    <p className="text-sm text-slate-500">{item.item.itemCode}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                {item.quantity} {item.item.uom}
                                            </td>
                                            {issue.items.some(i => i.batchNumber) && (
                                                <td className="py-3 px-4 text-slate-700">
                                                    {item.batchNumber || '-'}
                                                </td>
                                            )}
                                            {issue.items.some(i => i.unitCost !== null) && (
                                                <>
                                                    <td className="py-3 px-4 text-right text-slate-700">
                                                        {item.unitCost ? `฿${item.unitCost.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                        {item.totalCost ? `฿${item.totalCost.toFixed(2)}` : '-'}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                {issue.totalCost && (
                                    <tfoot>
                                        <tr className="bg-slate-50">
                                            <td colSpan={issue.items.some(i => i.batchNumber) ? 4 : 3} className="py-3 px-4 text-right font-semibold text-slate-900">
                                                Total Cost:
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-green-700 text-lg">
                                                ฿{issue.totalCost.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Delivery Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600">Delivery Method</label>
                                <p className="text-slate-900 mt-1 capitalize">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        issue.deliveryMethod === 'delivery' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {issue.deliveryMethod}
                                    </span>
                                </p>
                            </div>
                            {issue.deliveryDate && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Delivery Date</label>
                                    <p className="text-slate-900 mt-1">{new Date(issue.deliveryDate).toLocaleDateString()}</p>
                                </div>
                            )}
                            {issue.deliveryNotes && (
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-slate-600">Delivery Notes</label>
                                    <p className="text-slate-900 mt-1">{issue.deliveryNotes}</p>
                                </div>
                            )}
                            {issue.notes && (
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-slate-600">Additional Notes</label>
                                    <p className="text-slate-900 mt-1">{issue.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Acknowledgment */}
                    {issue.acknowledgedAt && issue.acknowledgedBy && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <h3 className="text-lg font-semibold text-green-900">Receipt Acknowledged</h3>
                            </div>
                            <p className="text-sm text-green-700">
                                Acknowledged by {issue.acknowledgedBy.name || 'N/A'} on {new Date(issue.acknowledgedAt).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Issue Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Issue Information</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-600">Issued By</label>
                                <p className="text-slate-900 mt-1 font-medium">{issue.issuedBy.name || 'N/A'}</p>
                                <p className="text-sm text-slate-500">{issue.issuedBy.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Issued To</label>
                                <p className="text-slate-900 mt-1 font-medium">{issue.issuedTo.name || 'N/A'}</p>
                                <p className="text-sm text-slate-500">{issue.issuedTo.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Department</label>
                                <p className="text-slate-900 mt-1">{issue.department.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Location</label>
                                <p className="text-slate-900 mt-1">{issue.location.name}</p>
                                <p className="text-sm text-slate-500">{issue.location.code}</p>
                            </div>
                            {issue.requisition && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Related Requisition</label>
                                    <Link
                                        href={`/stationary/requisitions/${issue.requisition.requisitionNo}`}
                                        className="text-green-600 hover:text-green-700 mt-1 block"
                                    >
                                        {issue.requisition.requisitionNo}
                                    </Link>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-slate-600">Issue Date</label>
                                <p className="text-slate-900 mt-1">{new Date(issue.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="text-sm font-medium text-purple-100 mb-2">Total Items</div>
                        <div className="text-4xl font-bold">{issue.items.length}</div>
                        <div className="text-sm text-purple-100 mt-1">
                            {issue.items.reduce((sum, item) => sum + item.quantity, 0)} units total
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
