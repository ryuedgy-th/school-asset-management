'use client';

import { Package, Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface MyAssignmentClientProps {
    assignment: any;
    user: any;
}

export default function MyAssignmentClient({ assignment, user }: MyAssignmentClientProps) {
    if (!assignment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/10 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Package size={64} className="mx-auto mb-4 text-slate-300" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Assignment</h2>
                        <p className="text-slate-500 mb-6">
                            You don't have any active equipment assignment at the moment.
                        </p>
                        <p className="text-sm text-slate-400">
                            Contact IT staff if you need to borrow equipment.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate borrowed items (not yet returned)
    const borrowedItems = assignment.borrowTransactions.flatMap((transaction: any) =>
        transaction.borrowItems.filter((item: any) => item.status === 'Borrowed')
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/10 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-primary rounded-xl shadow-lg">
                        <Package className="text-white" size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Assignment</h1>
                        <p className="text-slate-500 mt-1">View your borrowed equipment and history</p>
                    </div>
                </div>

                {/* Assignment Info Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Assignment Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-primary/10 rounded-xl">
                            <div className="text-xs text-primary font-semibold uppercase mb-1">Assignment Number</div>
                            <div className="text-lg font-bold text-slate-900">{assignment.assignmentNumber}</div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl">
                            <div className="text-xs text-purple-600 font-semibold uppercase mb-1">Academic Year</div>
                            <div className="text-lg font-bold text-slate-900">{assignment.academicYear} / Term {assignment.term}</div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl">
                            <div className="text-xs text-green-600 font-semibold uppercase mb-1">Term</div>
                            <div className="text-lg font-bold text-slate-900">Term {assignment.semester}</div>
                        </div>
                    </div>
                </div>

                {/* Currently Borrowed Items */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Currently Borrowed</h2>
                        <span className="px-3 py-1 bg-primary/20 text-primary/90 rounded-full text-sm font-semibold">
                            {borrowedItems.length} {borrowedItems.length === 1 ? 'Item' : 'Items'}
                        </span>
                    </div>

                    {borrowedItems.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <CheckCircle size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="font-medium">All items returned</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {borrowedItems.map((item: any) => {
                                // Find the transaction this item belongs to
                                const transaction = assignment.borrowTransactions.find((tx: any) =>
                                    tx.borrowItems.some((txItem: any) => txItem.id === item.id)
                                );
                                const isSigned = transaction?.isSigned || false;

                                return (
                                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="p-3 bg-primary/20 rounded-lg">
                                            <Package size={24} className="text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <Link
                                                href={`/assets/${item.asset.assetCode}`}
                                                className="font-semibold text-slate-900 hover:text-primary transition-colors"
                                            >
                                                {item.asset.name}
                                            </Link>
                                            <div className="text-sm text-slate-500 mt-1">
                                                Quantity: {item.quantity} • {item.asset.category}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isSigned ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                    <Clock size={12} className="mr-1" />
                                                    Borrowed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                    <AlertCircle size={12} className="mr-1" />
                                                    Reserved
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>



                {/* Info Box */}
                <div className="bg-primary/10 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold mb-1">Important Reminders:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800">
                                <li>Please take good care of borrowed equipment</li>
                                <li>Report any damage or issues immediately to IT staff</li>
                                <li>Return equipment on time at the end of the term</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
