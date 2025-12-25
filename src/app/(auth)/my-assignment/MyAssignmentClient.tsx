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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
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
        transaction.items.filter((item: any) => item.status === 'Borrowed')
    );

    // Calculate returned items
    const returnedItems = assignment.returnTransactions.flatMap((transaction: any) =>
        transaction.items
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-blue-600 rounded-xl shadow-lg">
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
                        <div className="p-4 bg-blue-50 rounded-xl">
                            <div className="text-xs text-blue-600 font-semibold uppercase mb-1">Assignment Number</div>
                            <div className="text-lg font-bold text-slate-900">{assignment.assignmentNumber}</div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl">
                            <div className="text-xs text-purple-600 font-semibold uppercase mb-1">Academic Year</div>
                            <div className="text-lg font-bold text-slate-900">{assignment.academicYear}</div>
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
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
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
                                    tx.items.some((txItem: any) => txItem.id === item.id)
                                );
                                const isSigned = transaction?.isSigned || false;

                                return (
                                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <Package size={24} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <Link
                                                href={`/assets/${item.asset.id}`}
                                                className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
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

                {/* Return History */}
                {returnedItems.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Return History</h2>
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                                {returnedItems.length} {returnedItems.length === 1 ? 'Return' : 'Returns'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {returnedItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <CheckCircle size={24} className="text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-slate-900">
                                            {item.borrowItem.asset.name}
                                        </div>
                                        <div className="text-sm text-slate-500 mt-1">
                                            Quantity: {item.quantity} • Condition: {item.condition}
                                        </div>
                                        {item.damageNotes && (
                                            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                                                <AlertCircle size={12} />
                                                {item.damageNotes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Returned
                                        </span>
                                        {item.damageCharge > 0 && (
                                            <div className="text-xs text-red-600 mt-1 font-semibold">
                                                Charge: ฿{Number(item.damageCharge).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
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
