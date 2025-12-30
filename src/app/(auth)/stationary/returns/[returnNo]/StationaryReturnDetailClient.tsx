'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface ReturnItem {
    id: number;
    quantity: number;
    condition: string;
    item: {
        id: number;
        itemCode: string;
        name: string;
        uom: string;
    };
}

interface ReturnData {
    id: number;
    returnNo: string;
    returnType: string;
    returnReason: string | null;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    approvedAt: Date | null;
    returnedBy: {
        id: number;
        name: string | null;
        email: string | null;
    };
    department: {
        id: number;
        code: string;
        name: string;
    };
    approvedBy: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    items: ReturnItem[];
}

export default function StationaryReturnDetailClient({
    returnVoucher,
    canApprove,
    canEdit,
    isOwner,
    currentUserId,
}: {
    returnVoucher: ReturnData;
    canApprove: boolean;
    canEdit: boolean;
    isOwner: boolean;
    currentUserId: number;
}) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        const result = await Swal.fire({
            title: 'Approve Return?',
            text: 'Items will be added back to stock.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, approve it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                const res = await fetch(`/api/stationary/returns/${returnVoucher.returnNo}/approve`, {
                    method: 'POST',
                });

                if (res.ok) {
                    await Swal.fire('Approved!', 'Return has been approved and items added to stock.', 'success');
                    router.refresh();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to approve return');
                }
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleReject = async () => {
        const result = await Swal.fire({
            title: 'Reject Return?',
            text: 'Are you sure you want to reject this return request?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, reject it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                const res = await fetch(`/api/stationary/returns/${returnVoucher.returnNo}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'rejected' }),
                });

                if (res.ok) {
                    await Swal.fire('Rejected!', 'Return has been rejected.', 'success');
                    router.refresh();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to reject return');
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
            pending: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
            approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
            rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
            completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700' },
        };
        return badges[status] || badges.pending;
    };

    const getReturnTypeBadge = (type: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            unused: { label: 'Unused', color: 'bg-blue-100 text-blue-800' },
            defective: { label: 'Defective', color: 'bg-red-100 text-red-800' },
            excess: { label: 'Excess', color: 'bg-purple-100 text-purple-800' },
        };
        return badges[type] || badges.unused;
    };

    const getConditionBadge = (condition: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            good: { label: 'Good', color: 'bg-green-100 text-green-800' },
            damaged: { label: 'Damaged', color: 'bg-orange-100 text-orange-800' },
            defective: { label: 'Defective', color: 'bg-red-100 text-red-800' },
        };
        return badges[condition] || badges.good;
    };

    const statusBadge = getStatusBadge(returnVoucher.status);
    const returnTypeBadge = getReturnTypeBadge(returnVoucher.returnType);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Link href="/stationary" className="hover:text-green-600">Stationary</Link>
                    <span>/</span>
                    <Link href="/stationary/returns" className="hover:text-green-600">Returns</Link>
                    <span>/</span>
                    <span className="text-slate-900">{returnVoucher.returnNo}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">Return Voucher</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.color}`}>
                                {statusBadge.label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${returnTypeBadge.color}`}>
                                {returnTypeBadge.label}
                            </span>
                        </div>
                        <p className="text-slate-600 mt-1">{returnVoucher.returnNo}</p>
                    </div>
                    <div className="flex gap-3">
                        {canApprove && (
                            <>
                                <button
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {isProcessing ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </>
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
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Returned Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Item</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Condition</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnVoucher.items.map((item) => {
                                        const conditionBadge = getConditionBadge(item.condition);
                                        return (
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
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${conditionBadge.color}`}>
                                                        {conditionBadge.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Return Reason */}
                    {returnVoucher.returnReason && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Return Reason</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{returnVoucher.returnReason}</p>
                        </div>
                    )}

                    {/* Additional Notes */}
                    {returnVoucher.notes && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Additional Notes</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{returnVoucher.notes}</p>
                        </div>
                    )}

                    {/* Approval Status */}
                    {returnVoucher.approvedAt && returnVoucher.approvedBy && (
                        <div className={`border rounded-xl p-6 ${
                            returnVoucher.status === 'approved'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {returnVoucher.status === 'approved' ? (
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                <h3 className={`text-lg font-semibold ${
                                    returnVoucher.status === 'approved' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                    {returnVoucher.status === 'approved' ? 'Approved' : 'Rejected'}
                                </h3>
                            </div>
                            <p className={`text-sm ${
                                returnVoucher.status === 'approved' ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {returnVoucher.status === 'approved' ? 'Approved' : 'Rejected'} by {returnVoucher.approvedBy.name || 'N/A'} on {new Date(returnVoucher.approvedAt).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Return Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Return Information</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-600">Returned By</label>
                                <p className="text-slate-900 mt-1 font-medium">{returnVoucher.returnedBy.name || 'N/A'}</p>
                                <p className="text-sm text-slate-500">{returnVoucher.returnedBy.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Department</label>
                                <p className="text-slate-900 mt-1">{returnVoucher.department.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Return Date</label>
                                <p className="text-slate-900 mt-1">{new Date(returnVoucher.createdAt).toLocaleString()}</p>
                            </div>
                            {returnVoucher.updatedAt && new Date(returnVoucher.updatedAt).getTime() !== new Date(returnVoucher.createdAt).getTime() && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Last Updated</label>
                                    <p className="text-slate-900 mt-1">{new Date(returnVoucher.updatedAt).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="text-sm font-medium text-orange-100 mb-2">Total Items</div>
                        <div className="text-4xl font-bold">{returnVoucher.items.length}</div>
                        <div className="text-sm text-orange-100 mt-1">
                            {returnVoucher.items.reduce((sum, item) => sum + item.quantity, 0)} units total
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
