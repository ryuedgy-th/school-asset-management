'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Package, Clock, Archive, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Assignment {
    id: number;
    assignmentNumber: string;
    academicYear: string;
    term: number;
    status: string;
    createdAt: Date;
    closedAt: Date | null;
    closureNotes: string | null;
    user: {
        id: number;
        name: string | null;
        email: string | null;
        department: string | null;
    };
    closedBy: {
        name: string | null;
    } | null;
    borrowTransactions: Array<{
        items: Array<{
            asset: {
                name: string;
            };
        }>;
    }>;
    returnTransactions: Array<{
        items: any[];
    }>;
}

interface AssignmentsClientProps {
    assignments: Assignment[];
    isAdmin: boolean;
    currentUserId: number;
}

export default function AssignmentsClient({ assignments, isAdmin, currentUserId }: AssignmentsClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('Active');

    const activeAssignments = assignments.filter(a => a.status === 'Active');
    const pastAssignments = assignments.filter(a => a.status === 'Closed');

    // Filter assignments for admin view
    const filteredAssignments = useMemo(() => {
        if (!isAdmin) return assignments; // User sees all their assignments

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
                    assignment.user.email?.toLowerCase().includes(search) ||
                    assignment.user.department?.toLowerCase().includes(search)
                );
            }

            return true;
        });
    }, [assignments, searchTerm, statusFilter, isAdmin]);

    const stats = {
        total: assignments.length,
        active: activeAssignments.length,
        closed: pastAssignments.length
    };

    // Admin View - Table
    if (isAdmin) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Assignment Management</h1>
                        <p className="text-slate-500">Monitor and manage all equipment assignments.</p>
                    </div>
                    <Link
                        href="/assignments/new"
                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Assignment
                    </Link>
                </div>

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
                                    className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Closed')}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                        <td className="px-6 py-4 font-medium text-slate-900 border-l-4 border-l-transparent hover:border-l-primary transition-all">
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
                                                href={`/assignments/${assignment.id}`}
                                                className="text-primary font-medium hover:text-blue-800 transition-colors"
                                            >
                                                {assignment.status === 'Active' ? 'Manage' : 'View'}
                                            </Link>
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

    // User View - Card Layout
    return (
        <div className="max-w-6xl mx-auto space-y-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Assignments</h1>
                    <p className="text-slate-500">Manage your borrowed assets and requests.</p>
                </div>
                <Link
                    href="/assignments/new"
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Request
                </Link>
            </div>

            {/* Active Assignments */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="text-primary" size={20} />
                    Active Assignments
                </h2>

                {activeAssignments.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                        You don't have any active assignments.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {activeAssignments.map(assignment => {
                            const totalBorrowed = assignment.borrowTransactions.reduce((acc, tx) => acc + tx.items.length, 0);
                            const totalReturned = assignment.returnTransactions.reduce((acc, tx) => acc + tx.items.length, 0);
                            const remaining = totalBorrowed - totalReturned;

                            return (
                                <div key={assignment.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-slate-900">{assignment.assignmentNumber}</h3>
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                    Active
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                Academic Year: {assignment.academicYear} | Term: {assignment.semester}
                                            </p>
                                        </div>
                                        <Link href={`/assignments/${assignment.id}`} className="text-sm font-medium text-primary hover:text-blue-800">
                                            View Details →
                                        </Link>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <div className="text-sm font-medium text-slate-700 mb-2">Borrowed Items ({remaining} remaining)</div>
                                        <div className="flex flex-wrap gap-2">
                                            {assignment.borrowTransactions.flatMap(tx => tx.items).map((item, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                                                    <Package size={14} className="text-slate-400" />
                                                    {item.asset.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* History */}
            {pastAssignments.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Archive className="text-slate-500" size={20} />
                        Past History
                    </h2>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Assignment No.</th>
                                    <th className="px-6 py-4">Year/Sem</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4">Closed Date</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pastAssignments.map(assignment => (
                                    <tr key={assignment.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{assignment.assignmentNumber}</td>
                                        <td className="px-6 py-4 text-slate-500">{assignment.academicYear}/{assignment.semester}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {assignment.borrowTransactions.reduce((acc, tx) => acc + tx.items.length, 0)} items
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {assignment.closedAt?.toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/assignments/${assignment.id}`} className="text-primary hover:underline">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
