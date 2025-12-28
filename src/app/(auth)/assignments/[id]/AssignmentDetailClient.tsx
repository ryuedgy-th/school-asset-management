'use client';

import { useState } from 'react';
import { Assignment, BorrowTransaction, ReturnTransaction, User, Asset, BorrowItem, ReturnItem } from '@prisma/client';
import ReturnModal from '@/components/BorrowFlow/ReturnModal';
import AddAssetModal from '@/components/BorrowFlow/AddAssetModal';
import { Package, Clock, CheckCircle2, XCircle, Lock } from 'lucide-react';
import Image from 'next/image';
import CloseAssignmentModal from '@/components/BorrowFlow/CloseAssignmentModal';

// Complex types need careful definition or use of Prisma generated types if avail
interface FullAssignment extends Assignment {
    user: User;
    borrowTransactions: (BorrowTransaction & {
        items: (BorrowItem & { asset: Asset })[];
        createdBy: { name: string | null };
    })[];
    returnTransactions: (ReturnTransaction & {
        items: (ReturnItem & { borrowItem: BorrowItem & { asset: Asset } })[];
        checkedBy: { name: string | null };
    })[];
}

// Helper to copy text reliably
async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        throw new Error('Clipboard API unavailable');
    } catch (err) {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (fallbackErr) {
            console.error('Copy failed:', fallbackErr);
            return false;
        }
    }
}

export default function AssignmentDetailClient({ assignment, isAdmin }: { assignment: FullAssignment; isAdmin: boolean }) {
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

    // Calculate remaining items
    // Flat map all borrowed items
    // Flat map all borrowed items and attach transaction info
    const allBorrowed = assignment.borrowTransactions.flatMap(tx =>
        tx.items.map(item => ({ ...item, borrowTransaction: tx }))
    );
    // Find which are Returned
    const returnedIds = assignment.returnTransactions.flatMap(tx => tx.items.map(ri => ri.borrowItemId));

    const activeItems = allBorrowed.filter(item => !returnedIds.includes(item.id));

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-slate-900">{assignment.assignmentNumber}</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${assignment.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {assignment.status}
                        </span>
                    </div>
                    <div className="text-slate-500">
                        Borrowed by <span className="font-semibold text-slate-900">{assignment.user.name}</span> • {assignment.user.department}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                        AY {assignment.academicYear} / Term {assignment.term}
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    {assignment.status === 'Active' && (
                        <>
                            <button
                                onClick={() => setIsAddAssetModalOpen(true)}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                            >
                                <span className="text-xl font-bold leading-none">+</span>
                                Add Items
                            </button>

                            {activeItems.length > 0 && (
                                <>
                                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                                    <button
                                        onClick={() => setIsReturnModalOpen(true)}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={18} />
                                        Process Return
                                    </button>
                                </>
                            )}

                            {activeItems.length === 0 && allBorrowed.length > 0 && (
                                <>
                                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                                    <button
                                        onClick={() => setIsCloseModalOpen(true)}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-2"
                                    >
                                        <Lock size={18} />
                                        Close Assignment
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {assignment.status === 'Closed' && (
                        <div className="flex items-center gap-2 text-slate-500">
                            <XCircle size={18} />
                            <span className="text-sm font-medium">Assignment Closed</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Currently Borrowed */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 font-semibold text-slate-700">
                    <Clock size={18} className="text-primary/80" />
                    Currently Borrowed ({activeItems.length} items)
                </div>
                {activeItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic flex flex-col items-center gap-4">
                        <p>No currently borrowed items.</p>
                        <button
                            onClick={() => setIsAddAssetModalOpen(true)}
                            className="px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <span className="text-xl font-bold">+</span>
                            Add Assets
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {activeItems.map(item => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                        {item.asset.image ? (
                                            <img src={item.asset.image} className="w-full h-full object-cover" />
                                        ) : <Package className="text-slate-400" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{item.asset.name}</div>
                                        <div className="text-sm text-slate-500 font-mono">{item.asset.assetCode}</div>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500">
                                    Since {item.borrowTransaction.borrowDate ? new Date(item.borrowTransaction.borrowDate).toISOString().split('T')[0] : '-'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Timeline / History */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">History</h3>

                {/* Borrow Transactions */}
                {assignment.borrowTransactions.map(tx => (
                    <div key={tx.id} className="relative pl-8 border-l-2 border-slate-200 pb-8 last:pb-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary/80 border-4 border-white shadow-sm"></div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <div className="flex justify-between mb-4">
                                <div>
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        Borrowed Items
                                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tx.transactionNumber}</span>
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        {new Date(tx.borrowDate).toISOString().replace('T', ' ').substring(0, 19)} by {tx.createdBy?.name || 'Staff'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* PDF Download Button */}
                                    {tx.isSigned ? (
                                        <div className="flex items-center gap-3">
                                            {/* PDF Button - Contextually only when signed */}
                                            <a
                                                href={`/api/borrow/${tx.id}/pdf`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                                            >
                                                📄 PDF
                                            </a>
                                            {tx.borrowerSignature && (
                                                <div className="text-right">
                                                    <div className="text-xs text-emerald-600 mb-1">✅ Signed</div>
                                                    <img src={tx.borrowerSignature} alt="Signature" className="h-8 object-contain border border-slate-100 bg-slate-50 rounded" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { generateBorrowTransactionToken } = await import('@/app/lib/borrow-transaction-signature');
                                                        const res = await generateBorrowTransactionToken(tx.id);
                                                        if (res.success && res.url) {
                                                            const success = await copyToClipboard(res.url);
                                                            if (success) {
                                                                alert('✅ Signature link copied to clipboard!');
                                                            } else {
                                                                window.prompt('Copy this link:', res.url);
                                                            }
                                                        } else {
                                                            alert('❌ ' + (res.error || 'Failed to generate link'));
                                                        }
                                                    } catch (e: any) {
                                                        console.error(e);
                                                        alert('❌ Error: ' + e.message);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium transition-all"
                                            >
                                                🔗 Copy Signature Link
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Send signature request email to the borrower?')) return;
                                                    try {
                                                        const { generateBorrowTransactionToken } = await import('@/app/lib/borrow-transaction-signature');
                                                        // Pass true as second argument to send email
                                                        const res = await generateBorrowTransactionToken(tx.id, true);

                                                        if (res.success) {
                                                            if (res.emailSent) {
                                                                alert('✅ Email sent successfully!');
                                                            } else {
                                                                alert('⚠️ Link generated but email could not be sent. Please invoke Copy Link instead.');
                                                            }
                                                        } else {
                                                            alert('❌ ' + (res.error || 'Failed to process request'));
                                                        }
                                                    } catch (e: any) {
                                                        console.error(e);
                                                        alert('❌ Error: ' + e.message);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary/90 border border-blue-200 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                                            >
                                                📧 Send Email
                                            </button>

                                            {/* Cancel Button */}
                                            <button
                                                onClick={async () => {
                                                    if (!confirm(`Cancel transaction ${tx.transactionNumber}? The reserved assets will become available again.`)) {
                                                        return;
                                                    }
                                                    try {
                                                        const { deleteBorrowTransaction } = await import('@/app/lib/borrow-actions');
                                                        const res = await deleteBorrowTransaction(tx.id);
                                                        if (res.success) {
                                                            alert('✅ Transaction cancelled successfully');
                                                            window.location.reload();
                                                        } else {
                                                            alert('❌ ' + res.error);
                                                        }
                                                    } catch (e: any) {
                                                        console.error(e);
                                                        alert('❌ Error: ' + e.message);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium transition-all"
                                            >
                                                ✖️ Cancel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tx.items.map(item => (
                                    <span key={item.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700">
                                        {item.asset.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Return Transactions */}
                {assignment.returnTransactions.map(tx => (
                    <div key={tx.id} className="relative pl-8 border-l-2 border-slate-200 pb-8 last:pb-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <div className="flex justify-between mb-4">
                                <div>
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        Returned Items
                                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">RT-{tx.id}</span>
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        {new Date(tx.returnDate).toISOString().replace('T', ' ').substring(0, 19)} by {tx.checkedBy?.name}
                                    </div>
                                </div>
                                {tx.checkerSignature && (
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 mb-1">Checker Signature</div>
                                        <img src={tx.checkerSignature} alt="Signature" className="h-8 object-contain border border-slate-100 bg-slate-50 rounded" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                {tx.items.map(ri => (
                                    <div key={ri.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded border border-slate-100">
                                        <span className="font-medium text-slate-700">{ri.borrowItem.asset.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ri.condition === 'Good' ? 'bg-green-100 text-green-700' :
                                                ri.condition === 'Damaged' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {ri.condition}
                                            </span>
                                            {ri.damageCharge && Number(ri.damageCharge) > 0 && (
                                                <span className="text-red-600 font-mono">฿{Number(ri.damageCharge)}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isReturnModalOpen && (
                <ReturnModal
                    assignmentId={assignment.id}
                    borrowItems={Object.values(allBorrowed)} // Pass all, modal filters active
                    onClose={() => setIsReturnModalOpen(false)}
                />
            )}

            {isAddAssetModalOpen && (
                <AddAssetModal
                    assignmentId={assignment.id}
                    onClose={() => setIsAddAssetModalOpen(false)}
                />
            )}

            {isCloseModalOpen && (
                <CloseAssignmentModal
                    assignmentId={assignment.id}
                    assignmentNumber={assignment.assignmentNumber}
                    totalItems={allBorrowed.length}
                    onClose={() => setIsCloseModalOpen(false)}
                />
            )}
        </div>
    );
}
