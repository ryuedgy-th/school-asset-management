'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Calendar, DollarSign, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function MaintenanceLogsClient({ logs, user }: any) {
    const router = useRouter();
    const [filter, setFilter] = useState('all');

    const filtered = logs.filter((log: any) =>
        filter === 'all' ? true : log.type === filter
    );

    const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    const getTypeBadge = (type: string) => {
        const colors: any = {
            preventive: 'bg-primary/10 text-primary',
            corrective: 'bg-red-100 text-red-700',
            inspection: 'bg-green-100 text-green-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>
                {type.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <Wrench className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Maintenance Logs</h1>
                            <p className="text-slate-500 mt-1">Track and review all maintenance activities</p>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">All Types</option>
                        <option value="preventive">Preventive</option>
                        <option value="corrective">Corrective</option>
                        <option value="inspection">Inspection</option>
                    </select>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Asset
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Performed By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    Cost
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No maintenance logs found
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-700">{formatDate(log.date)}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{log.asset.name}</div>
                                            <div className="text-xs text-primary font-mono">
                                                {log.asset.assetCode}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getTypeBadge(log.type)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700">{log.description}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700">{log.performedBy}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            {log.cost ? `฿${log.cost.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            icon: 'warning',
                                                            title: 'Delete Maintenance Log?',
                                                            html: `Are you sure you want to delete this maintenance log?<br><br><strong>${log.asset.name}</strong><br>${formatDate(log.date)} - ${log.type}<br><br>This action cannot be undone.`,
                                                            showCancelButton: true,
                                                            confirmButtonColor: '#ef4444',
                                                            cancelButtonColor: '#6b7280',
                                                            confirmButtonText: 'Yes, delete it',
                                                            cancelButtonText: 'Cancel'
                                                        });

                                                        if (result.isConfirmed) {
                                                            try {
                                                                const res = await fetch(`/api/maintenance-logs/${log.id}`, {
                                                                    method: 'DELETE',
                                                                });

                                                                if (!res.ok) {
                                                                    const error = await res.json();
                                                                    throw new Error(error.error || 'Failed to delete');
                                                                }

                                                                await Swal.fire({
                                                                    icon: 'success',
                                                                    title: 'Deleted!',
                                                                    text: 'Maintenance log has been deleted successfully.',
                                                                    timer: 2000
                                                                });

                                                                router.refresh();
                                                            } catch (error: any) {
                                                                Swal.fire({
                                                                    icon: 'error',
                                                                    title: 'Delete Failed',
                                                                    text: error.message || 'Failed to delete maintenance log'
                                                                });
                                                            }
                                                        }
                                                    }}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Log"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
