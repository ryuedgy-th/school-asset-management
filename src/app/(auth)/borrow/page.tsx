'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Package, Clock, Archive } from 'lucide-react';

export default async function BorrowPage() {
    const session = await auth();
    if (!session?.user?.id) return <div>Unauthorized</div>;

    const userId = Number(session.user.id);

    // Fetch user's assignments
    const assignments = await prisma.assignment.findMany({
        where: { userId },
        include: {
            borrowTransactions: {
                include: {
                    items: {
                        include: { asset: true }
                    }
                }
            },
            returnTransactions: {
                include: {
                    items: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const activeAssignments = assignments.filter(a => a.status === 'Active');
    const pastAssignments = assignments.filter(a => a.status === 'Closed');

    return (
        <div className="max-w-6xl mx-auto space-y-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Equipment</h1>
                    <p className="text-slate-500">Manage your borrowed assets and requests.</p>
                </div>
                <Link
                    href="/borrow/new"
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/80/30 hover:bg-primary/90 transition-all flex items-center gap-2"
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
                            // Calculate borrow stats
                            const totalBorrowed = assignment.borrowTransactions.reduce((acc, tx) => acc + tx.items.length, 0);
                            // Simple return counting logic (approximate for now)
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
                                                Academic Year: {assignment.academicYear} | Semester: {assignment.semester}
                                            </p>
                                        </div>
                                        <Link href={`/borrow/${assignment.id}`} className="text-sm font-medium text-primary hover:text-blue-800">
                                            View Details →
                                        </Link>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <div className="text-sm font-medium text-slate-700 mb-2">Borrowed Items ({remaining} remaining)</div>
                                        <div className="flex flex-wrap gap-2">
                                            {assignment.borrowTransactions.flatMap(tx => tx.items).map((item, idx) => {
                                                // Check if this specific item is returned (complex logic in view, simplified here)
                                                // Ideally detailed status is per item.
                                                // Just show list of what was borrowed.
                                                return (
                                                    <span key={`${item.id}-${idx}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                                                        <Package size={14} className="text-slate-400" />
                                                        {item.asset.name}
                                                    </span>
                                                )
                                            })}
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
                                            <Link href={`/borrow/${assignment.id}`} className="text-primary hover:underline">
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
