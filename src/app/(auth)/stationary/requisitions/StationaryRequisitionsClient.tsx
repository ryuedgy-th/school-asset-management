'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Plus, Eye, CheckCircle, XCircle, Send, Clock } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import CreateRequisitionModal from './CreateRequisitionModal';

interface StationaryRequisitionsClientProps {
    requisitions: any[];
    items: any[];
    departments: any[];
    user: any;
}

export default function StationaryRequisitionsClient({ requisitions, items, departments, user }: StationaryRequisitionsClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filter requisitions
    const filteredRequisitions = useMemo(() => {
        return requisitions.filter(req => {
            const matchesSearch = searchQuery === '' ||
                req.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.requestedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                req.purpose?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
            const matchesDepartment = filterDepartment === 'all' || req.departmentId === parseInt(filterDepartment);

            return matchesSearch && matchesStatus && matchesDepartment;
        });
    }, [requisitions, searchQuery, filterStatus, filterDepartment]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = requisitions.length;
        const draft = requisitions.filter(r => r.status === 'draft').length;
        const pending = requisitions.filter(r => r.status === 'pending').length;
        const approved = requisitions.filter(r => r.status === 'approved').length;

        return { total, draft, pending, approved };
    }, [requisitions]);

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; icon: any }> = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
            approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
            cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
        };

        const badge = badges[status] || badges.draft;
        const Icon = badge.icon;

        return (
            <span className={`px-2 py-1 text-xs rounded-full ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
                <Icon size={12} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const handleAction = async (requisitionNo: string, action: 'submit' | 'approve' | 'reject') => {
        const actionText = action === 'submit' ? 'Submit' : action === 'approve' ? 'Approve' : 'Reject';

        const result = await Swal.fire({
            title: `${actionText} Requisition?`,
            text: `Are you sure you want to ${action} this requisition?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: action === 'reject' ? '#ef4444' : '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: `Yes, ${action} it`,
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/stationary/requisitions/${requisitionNo}/${action}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || `Failed to ${action} requisition`);
                }

                await Swal.fire({
                    icon: 'success',
                    title: `${actionText}ed!`,
                    text: `Requisition has been ${action}ed successfully`,
                    timer: 2000,
                    showConfirmButton: false,
                });

                window.location.reload();
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || `Failed to ${action} requisition`,
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-600 rounded-xl shadow-lg shadow-green-600/20">
                                <Send className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Requisitions</h1>
                                <p className="text-slate-500 mt-1">Request stationary items from stock</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                        >
                            <Plus size={20} />
                            New Requisition
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-slate-100 rounded-lg">
                                <Send className="text-slate-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Draft</p>
                                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                            </div>
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Clock className="text-gray-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="text-yellow-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Approved</p>
                                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-slate-600" />
                        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search requisitions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Requisitions Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Requisition No</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Requested By</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">For</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredRequisitions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            No requisitions found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequisitions.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/stationary/requisitions/${req.requisitionNo}`}
                                                    className="font-mono text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    {req.requisitionNo}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">{req.requestedBy.name}</p>
                                                    <p className="text-sm text-slate-500">{req.requestedBy.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {req.requestedForType === 'personal' && req.requestedForUser ? (
                                                    <div>
                                                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 inline-block mb-1">
                                                            Personal
                                                        </span>
                                                        <p className="text-sm font-medium text-slate-900">{req.requestedForUser.name}</p>
                                                    </div>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                                                        Department
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-700">{req.department.name}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-slate-900">{req.items.length} items</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-700">
                                                    {new Date(req.createdAt).toLocaleDateString('th-TH')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/stationary/requisitions/${req.requisitionNo}`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    {req.status === 'draft' && req.requestedById === user.id && (
                                                        <button
                                                            onClick={() => handleAction(req.requisitionNo, 'submit')}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Submit"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                    )}
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(req.requisitionNo, 'approve')}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(req.requisitionNo, 'reject')}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results count */}
                <div className="mt-4 text-center text-sm text-slate-600">
                    Showing {filteredRequisitions.length} of {requisitions.length} requisitions
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateRequisitionModal
                    items={items}
                    departments={departments}
                    user={user}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
}
