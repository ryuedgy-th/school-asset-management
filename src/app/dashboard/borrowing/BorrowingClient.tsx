'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import DeleteAssignmentButton from './DeleteAssignmentButton';

interface Assignment {
    id: number;
    assignmentNumber: string;
    academicYear: string;
    semester: number;
    status: string;
    createdAt: Date;
    closedAt: Date | null;
    closureNotes: string | null;
    user: {
        name: string | null;
        department: string | null;
    };
    closedBy: {
        name: string | null;
    } | null;
    borrowTransactions: Array<{
        items: any[];
    }>;
}

interface BorrowingClientProps {
    assignments: Assignment[];
}

export default function BorrowingClient({ assignments }: BorrowingClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('Active');

    // Filter assignments
    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment => {
            // Status filter
            if (statusFilter !== 'All' && assignment.status !== statusFilter) {
                return false;
            }

            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    assignment.assignmentNumber.toLowerCase().includes(search) ||
                    assignment.user.name?.toLowerCase().includes(search) ||
                    assignment.user.department?.toLowerCase().includes(search)
                );
            }

            return true;
        });
    }, [assignments, searchTerm, statusFilter]);

    const stats = {
        total: assignments.length,
        active: assignments.filter(a => a.status === 'Active').length,
        closed: assignments.filter(a => a.status === 'Closed').length
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Total Assignments</div>
                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Active</div>
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Closed</div>
                    <div className="text-2xl font-bold text-slate-600">{stats.closed}</div>
                </div>
            </div>

            {/* Assignments Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                placeholder="Search assignment or user..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 w-64"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Closed')}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/80/20"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active Only</option>
                            <option value="Closed">Closed Only</option>
                        </select>
                    </div>
                    <div className="text-sm text-slate-500">
                        Showing {filteredAssignments.length} of {assignments.length} assignments
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Assignment No.</th>
                                <th className="px-6 py-4 whitespace-nowrap">User</th>
                                <th className="px-6 py-4 whitespace-nowrap">Department</th>
                                <th className="px-6 py-4 whitespace-nowrap">Year / Term</th>
                                <th className="px-6 py-4 whitespace-nowrap">Items</th>
                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        No assignments found.
                                    </td>
                                </tr>
                            ) : filteredAssignments.map(assignment => (
                                <tr
                                    key={assignment.id}
                                    className={`hover:bg-slate-50/50 ${assignment.status === 'Closed' ? 'opacity-60' : ''}`}
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900 border-l-4 border-l-transparent hover:border-l-primary/80 transition-all">
                                        {assignment.assignmentNumber}
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">
                                        {assignment.user.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {assignment.user.department || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {assignment.academicYear} / Term {assignment.semester}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                            {assignment.borrowTransactions.reduce((acc, tx) => acc + tx.items.length, 0)} Items
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {assignment.status === 'Active' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <CheckCircle2 size={12} />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                <XCircle size={12} />
                                                Closed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="text-xs">
                                            {assignment.status === 'Closed' && assignment.closedAt ? (
                                                <>
                                                    <div className="text-slate-400">Closed:</div>
                                                    <div>{new Date(assignment.closedAt).toLocaleDateString('en-GB')}</div>
                                                    {assignment.closedBy && (
                                                        <div className="text-slate-400 mt-1">by {assignment.closedBy.name}</div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-slate-400">Opened:</div>
                                                    <div>{new Date(assignment.createdAt).toLocaleDateString('en-GB')}</div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/dashboard/borrowing/${assignment.id}`}
                                            className="text-primary font-medium hover:text-blue-800 transition-colors mr-2"
                                        >
                                            {assignment.status === 'Active' ? 'Manage' : 'View'}
                                        </Link>
                                        {assignment.status === 'Active' && (
                                            <DeleteAssignmentButton id={assignment.id} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
