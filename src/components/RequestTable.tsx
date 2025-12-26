'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, RotateCcw, Box, User, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConfirm, useAlert } from '@/contexts/DialogProvider';

interface BorrowRequest {
    id: number;
    userId: number;
    assetId: number;
    startDate: string;
    endDate: string;
    reason: string | null;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string;
    };
    asset: {
        name: string;
        assetCode: string;
        image: string | null;
    };
}

export default function RequestTable() {
    const { confirm } = useConfirm();
    const { alert } = useAlert();
    const [requests, setRequests] = useState<BorrowRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/borrow');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, status: string) => {
        const actionText = status === 'Approved' ? 'approve' : status === 'Rejected' ? 'reject' : 'mark as returned';
        const confirmed = await confirm({
            title: `${status} Request`,
            message: `Are you sure you want to ${actionText} this request?`,
            confirmText: status,
            variant: status === 'Rejected' ? 'danger' : 'info'
        });

        if (!confirmed) return;

        setActionLoading(id);
        try {
            const res = await fetch(`/api/borrow/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update status');
            }

            // Success: update local state
            setRequests(prev => prev.map(req =>
                req.id === id ? { ...req, status } : req
            ));
            await alert({
                title: 'Success',
                message: `Request ${actionText}d successfully!`,
                variant: 'success'
            });
            router.refresh();
        } catch (error: any) {
            await alert({
                title: 'Error',
                message: error.message,
                variant: 'error'
            });
        } finally {
            setActionLoading(null);
        }
    };;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading requests...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                        <th className="p-4">Asset</th>
                        <th className="p-4">User</th>
                        <th className="p-4">Dates</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                        <Box size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{req.asset.name}</div>
                                        <div className="text-xs text-slate-500">{req.asset.assetCode}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-slate-400" />
                                    <span className="text-slate-700">{req.user.name || req.user.email}</span>
                                </div>
                                {req.reason && <div className="text-xs text-slate-400 mt-1 max-w-[150px] truncate" title={req.reason}>{req.reason}</div>}
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col gap-1 text-slate-600">
                                    <div className="flex items-center gap-2 text-xs">
                                        <CalendarIcon size={12} className="text-emerald-500" />
                                        <span>{new Date(req.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <CalendarIcon size={12} className="text-rose-500" />
                                        <span>{new Date(req.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${req.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            req.status === 'Returned' ? 'bg-primary/10 text-primary/90 border-blue-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                    {req.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {req.status === 'Pending' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(req.id, 'Approved')}
                                                disabled={actionLoading === req.id}
                                                className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors"
                                                title="Approve"
                                            >
                                                {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'Rejected')}
                                                disabled={actionLoading === req.id}
                                                className="p-1.5 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors"
                                                title="Reject"
                                            >
                                                {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                                            </button>
                                        </>
                                    )}
                                    {req.status === 'Approved' && (
                                        <button
                                            onClick={() => handleAction(req.id, 'Returned')}
                                            disabled={actionLoading === req.id}
                                            className="p-1.5 bg-primary/20 text-primary rounded hover:bg-blue-200 transition-colors flex items-center gap-1 px-2"
                                            title="Mark as Returned"
                                        >
                                            <RotateCcw size={14} />
                                            <span className="text-xs font-medium">Return</span>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {requests.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                                No requests found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
