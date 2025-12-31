'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface RequisitionItem {
    id: number;
    quantityRequested: number;
    quantityApproved: number | null;
    quantityIssued: number;
    estimatedUnitCost: number | null;
    estimatedTotal: number | null;
    justification: string | null;
    item: {
        id: number;
        itemCode: string;
        name: string;
        uom: string;
        unitCost: number | null;
    };
}

interface RequisitionData {
    id: number;
    requisitionNo: string;
    purpose: string | null;
    urgency: string;
    status: string;
    requestedForType: string;
    comments: string | null;
    totalEstimatedCost: number | null;
    totalActualCost: number | null;
    createdAt: Date;
    updatedAt: Date;
    approvedByL1At: Date | null;
    approvedByL2At: Date | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    issuedAt: Date | null;
    completedAt: Date | null;
    requestedBy: {
        id: number;
        name: string | null;
        email: string | null;
    };
    requestedForUser: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    department: {
        id: number;
        code: string;
        name: string;
    };
    approvedByL1: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    approvedByL2: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    rejectedBy: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    issuedBy: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    items: RequisitionItem[];
}

export default function StationaryRequisitionDetailClient({
    requisition,
    canApproveL1,
    canApproveL2,
    canReject,
    canEdit,
    canDelete,
    isOwner,
    currentUserId,
}: {
    requisition: RequisitionData;
    canApproveL1: boolean;
    canApproveL2: boolean;
    canReject: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isOwner: boolean;
    currentUserId: number;
}) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async () => {
        const result = await Swal.fire({
            title: 'Submit Requisition?',
            text: 'Once submitted, you cannot edit this requisition.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, submit it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                const res = await fetch(`/api/stationary/requisitions/${requisition.requisitionNo}/submit`, {
                    method: 'POST',
                });

                if (res.ok) {
                    await Swal.fire('Submitted!', 'Requisition has been submitted for approval.', 'success');
                    router.refresh();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to submit requisition');
                }
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleApprove = async (level: 'L1' | 'L2') => {
        const result = await Swal.fire({
            title: `Approve Requisition (Level ${level})?`,
            text: `Do you want to approve ${requisition.requisitionNo}?`,
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
                const res = await fetch(`/api/stationary/requisitions/${requisition.requisitionNo}/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ level }),
                });

                if (res.ok) {
                    await Swal.fire('Approved!', `Requisition has been approved (Level ${level}).`, 'success');
                    router.refresh();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to approve requisition');
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
            title: 'Reject Requisition?',
            input: 'textarea',
            inputLabel: 'Rejection Reason',
            inputPlaceholder: 'Enter reason for rejection...',
            inputAttributes: {
                'aria-label': 'Rejection reason'
            },
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason!';
                }
            }
        });

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                const res = await fetch(`/api/stationary/requisitions/${requisition.requisitionNo}/reject`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: result.value }),
                });

                if (res.ok) {
                    await Swal.fire('Rejected!', 'Requisition has been rejected.', 'success');
                    router.refresh();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to reject requisition');
                }
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Requisition?',
            text: `Are you sure you want to delete ${requisition.requisitionNo}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                const res = await fetch(`/api/stationary/requisitions/${requisition.requisitionNo}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    await Swal.fire('Deleted!', 'Requisition has been deleted.', 'success');
                    router.push('/stationary/requisitions');
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to delete requisition');
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
            draft: { label: 'Draft', color: 'bg-slate-100 text-slate-800' },
            pending: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
            approved_l1: { label: 'Approved L1', color: 'bg-purple-100 text-purple-800' },
            approved_l2: { label: 'Approved L2', color: 'bg-green-100 text-green-800' },
            approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
            rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
            issued: { label: 'Issued', color: 'bg-purple-100 text-purple-800' },
            completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700' },
        };
        return badges[status] || badges.draft;
    };

    const statusBadge = getStatusBadge(requisition.status);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Link href="/stationary" className="hover:text-green-600">Stationary</Link>
                    <span>/</span>
                    <Link href="/stationary/requisitions" className="hover:text-green-600">Requisitions</Link>
                    <span>/</span>
                    <span className="text-slate-900">{requisition.requisitionNo}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">{requisition.requisitionNo}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.color}`}>
                                {statusBadge.label}
                            </span>
                        </div>
                        <p className="text-slate-600 mt-1">
                            Requested by {requisition.requestedBy.name || 'N/A'} • {new Date(requisition.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {isOwner && requisition.status === 'draft' && (
                            <button
                                onClick={handleSubmit}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                Submit for Approval
                            </button>
                        )}
                        {canApproveL1 && (
                            <button
                                onClick={() => handleApprove('L1')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                Approve (L1)
                            </button>
                        )}
                        {canApproveL2 && (
                            <button
                                onClick={() => handleApprove('L2')}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                Approve (L2)
                            </button>
                        )}
                        {canReject && (
                            <button
                                onClick={handleReject}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                Reject
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Requested Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Item</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Requested</th>
                                        {requisition.items.some(i => i.quantityApproved !== null) && (
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Approved</th>
                                        )}
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Unit Cost</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requisition.items.map((item) => (
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
                                                    {item.justification && (
                                                        <p className="text-xs text-slate-600 mt-1 italic">{item.justification}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                {item.quantityRequested} {item.item.uom}
                                            </td>
                                            {requisition.items.some(i => i.quantityApproved !== null) && (
                                                <td className="py-3 px-4 text-right font-semibold text-green-700">
                                                    {item.quantityApproved !== null ? `${item.quantityApproved} ${item.item.uom}` : '-'}
                                                </td>
                                            )}
                                            <td className="py-3 px-4 text-right text-slate-700">
                                                {item.estimatedUnitCost ? `฿${item.estimatedUnitCost.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                {item.estimatedTotal ? `฿${item.estimatedTotal.toFixed(2)}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {requisition.totalEstimatedCost && (
                                    <tfoot>
                                        <tr className="bg-slate-50">
                                            <td colSpan={requisition.items.some(i => i.quantityApproved !== null) ? 4 : 3} className="py-3 px-4 text-right font-semibold text-slate-900">
                                                Total Estimated Cost:
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-green-700 text-lg">
                                                ฿{requisition.totalEstimatedCost.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* Approval Timeline */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Approval Timeline</h2>
                        <div className="space-y-4">
                            {/* Created */}
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">Created</p>
                                    <p className="text-sm text-slate-600">{requisition.requestedBy.name || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{new Date(requisition.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* L1 Approval */}
                            {requisition.approvedByL1At && requisition.approvedByL1 && (
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Approved (Level 1)</p>
                                        <p className="text-sm text-slate-600">{requisition.approvedByL1.name || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{new Date(requisition.approvedByL1At).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {/* L2 Approval */}
                            {requisition.approvedByL2At && requisition.approvedByL2 && (
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Approved (Level 2)</p>
                                        <p className="text-sm text-slate-600">{requisition.approvedByL2.name || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{new Date(requisition.approvedByL2At).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {/* Rejected */}
                            {requisition.rejectedAt && requisition.rejectedBy && (
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Rejected</p>
                                        <p className="text-sm text-slate-600">{requisition.rejectedBy.name || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{new Date(requisition.rejectedAt).toLocaleString()}</p>
                                        {requisition.rejectionReason && (
                                            <p className="text-sm text-red-700 mt-2 bg-red-50 p-2 rounded">{requisition.rejectionReason}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Issued */}
                            {requisition.issuedAt && requisition.issuedBy && (
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Issued</p>
                                        <p className="text-sm text-slate-600">{requisition.issuedBy.name || 'N/A'}</p>
                                        <p className="text-xs text-slate-500">{new Date(requisition.issuedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Details Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Details</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-600">Department</label>
                                <p className="text-slate-900 mt-1">{requisition.department.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Requested For</label>
                                <div className="mt-1">
                                    {requisition.requestedForType === 'personal' && requisition.requestedForUser ? (
                                        <div>
                                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 inline-block mb-1">
                                                Personal
                                            </span>
                                            <p className="text-sm font-medium text-slate-900">{requisition.requestedForUser.name || 'N/A'}</p>
                                        </div>
                                    ) : (
                                        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                                            Department
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Urgency</label>
                                <p className="text-slate-900 mt-1 capitalize">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        requisition.urgency === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        {requisition.urgency}
                                    </span>
                                </p>
                            </div>
                            {requisition.purpose && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Purpose</label>
                                    <p className="text-slate-900 mt-1">{requisition.purpose}</p>
                                </div>
                            )}
                            {requisition.comments && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Comments</label>
                                    <p className="text-slate-900 mt-1">{requisition.comments}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="text-sm font-medium text-green-100 mb-2">Total Items</div>
                        <div className="text-4xl font-bold">{requisition.items.length}</div>
                        {requisition.totalEstimatedCost && (
                            <div className="mt-4 pt-4 border-t border-green-400">
                                <div className="text-sm font-medium text-green-100">Estimated Cost</div>
                                <div className="text-2xl font-bold">฿{requisition.totalEstimatedCost.toFixed(2)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
