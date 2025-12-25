'use client';

import { useState } from 'react';
import { Asset, BorrowItem } from '@prisma/client';
import SignaturePad from '@/components/SignaturePad';
import { createReturnTransaction } from '@/app/lib/borrow-actions';
import { useRouter } from 'next/navigation';

// Extended type to include Asset relation
interface ExtendedBorrowItem extends BorrowItem {
    asset: Asset;
}

interface ReturnModalProps {
    assignmentId: number;
    borrowItems: ExtendedBorrowItem[];
    onClose: () => void;
}

interface ReturnItemState {
    borrowItemId: number;
    isSelected: boolean;
    condition: 'Good' | 'Damaged' | 'Lost';
    damageNotes: string;
    damageCharge: number;
    quantity: number;
}

export default function ReturnModal({ assignmentId, borrowItems, onClose }: ReturnModalProps) {
    const router = useRouter();
    // Initialize state with all items NOT selected by default
    const [items, setItems] = useState<ReturnItemState[]>(
        borrowItems.filter(i => i.status === 'Borrowed').map(i => ({
            borrowItemId: i.id,
            isSelected: false,
            condition: 'Good',
            damageNotes: '',
            damageCharge: 0,
            quantity: i.quantity
        }))
    );
    const [signature, setSignature] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggle = (id: number) => {
        setItems(prev => prev.map(i => i.borrowItemId === id ? { ...i, isSelected: !i.isSelected } : i));
    };

    const handleChange = (id: number, field: keyof ReturnItemState, value: any) => {
        setItems(prev => prev.map(i => i.borrowItemId === id ? { ...i, [field]: value } : i));
    };

    const handleSubmit = async () => {
        const selectedItems = items.filter(i => i.isSelected);
        if (selectedItems.length === 0) {
            setError('Please select items to return.');
            return;
        }
        if (!signature) {
            setError('IT Staff signature required.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Upload signature
            const formData = new FormData();
            formData.append('file', signature);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Failed to upload signature');
            const { path: signaturePath } = await uploadRes.json();

            // Create Return Transaction
            await createReturnTransaction({
                assignmentId,
                items: selectedItems.map(i => ({
                    borrowItemId: i.borrowItemId,
                    condition: i.condition,
                    damageNotes: i.damageNotes || undefined,
                    damageCharge: i.damageCharge || undefined,
                    quantity: i.quantity // assuming full return for now
                })),
                signaturePath,
                notes: 'Processed return'
            });

            onClose();
            router.refresh();

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error processing return');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Process Return</h2>
                    <p className="text-slate-500 text-sm">Select items being returned and verify their condition.</p>
                </div>

                <div className="p-6 space-y-6">
                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="text-center text-slate-500 py-8">No items to return in this assignment.</div>
                        ) : items.map((itemState) => {
                            const originalItem = borrowItems.find(i => i.id === itemState.borrowItemId)!;
                            return (
                                <div key={itemState.borrowItemId} className={`p-4 rounded-xl border transition-all ${itemState.isSelected ? 'border-blue-500 bg-blue-50/10 shadow-sm' : 'border-slate-200 opacity-80 hover:opacity-100'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={itemState.isSelected}
                                                onChange={() => handleToggle(itemState.borrowItemId)}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <div className="font-medium text-slate-900">{originalItem.asset.name}</div>
                                                <div className="text-sm text-slate-500 font-mono">{originalItem.asset.assetCode}</div>
                                            </div>

                                            {itemState.isSelected && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100/50">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Condition</label>
                                                        <select
                                                            value={itemState.condition}
                                                            onChange={(e) => handleChange(itemState.borrowItemId, 'condition', e.target.value)}
                                                            className="w-full text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                        >
                                                            <option value="Good">Good</option>
                                                            <option value="Damaged">Damaged</option>
                                                            <option value="Lost">Lost</option>
                                                        </select>
                                                    </div>
                                                    {itemState.condition !== 'Good' && (
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Damage Notes</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Describe damage..."
                                                                    value={itemState.damageNotes}
                                                                    onChange={(e) => handleChange(itemState.borrowItemId, 'damageNotes', e.target.value)}
                                                                    className="w-full text-sm border-slate-200 rounded-lg"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Charge (฿)</label>
                                                                <input
                                                                    type="number"
                                                                    value={itemState.damageCharge}
                                                                    onChange={(e) => handleChange(itemState.borrowItemId, 'damageCharge', parseFloat(e.target.value))}
                                                                    className="w-full text-sm border-slate-200 rounded-lg"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">IT Staff Signature (Inspector)</label>
                        <SignaturePad onChange={setSignature} />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all disabled:opacity-70"
                    >
                        {loading ? 'Processing...' : 'Confirm Return'}
                    </button>
                </div>
            </div>
        </div>
    );
}
