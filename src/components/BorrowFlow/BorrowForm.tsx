'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AssetSelector from '@/components/BorrowFlow/AssetSelector';
import SignaturePad from '@/components/SignaturePad';
import { createBorrowTransaction, createAssignment } from '@/app/lib/borrow-actions';

// Upload is handled via /api/upload endpoint

interface BorrowFormProps {
    userId: number;
    activeAssignmentId?: number; // Pre-fill if exists
    academicYear: string;
    semester: number;
}

interface SelectedItem {
    id: number;
    name: string;
    assetCode: string;
    quantity: number;
    maxStock: number;
}

export default function BorrowForm({ userId, activeAssignmentId, academicYear, semester }: BorrowFormProps) {
    const router = useRouter();
    const [items, setItems] = useState<SelectedItem[]>([]);
    const [signature, setSignature] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddItem = (asset: any, quantity: number) => {
        setItems(prev => [...prev, {
            id: asset.id,
            name: asset.name,
            assetCode: asset.assetCode,
            quantity: 1, // Default 1, allow edit later
            maxStock: asset.currentStock
        }]);
    };

    const handleRemoveItem = (id: number) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleUpdateQuantity = (id: number, qty: number) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.min(qty, i.maxStock) } : i));
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            setError('Please select at least one item.');
            return;
        }
        if (!signature) {
            setError('Please sign to confirm borrowing.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // First, upload signature
            const formData = new FormData();
            formData.append('file', signature);

            // We need a route to handle upload.
            // Let's create `src/app/api/upload/route.ts` quickly or reuse logic.
            // Or change server action to accept FormData directly?
            // Next.js Server Actions allow FormData.
            // But `createBorrowTransaction` arguments are typed.
            // Let's use a specialized action wrapper that takes FormData.
            // OR simple fetch to an upload API.

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Failed to upload signature');
            const { path: signaturePath } = await uploadRes.json();

            let targetAssignmentId = activeAssignmentId;

            // If no active assignment, Create one first.
            if (!targetAssignmentId) {
                // Actually we can do this in one go logic-wise, but split actions ok.
                const newAssignment = await createAssignment({
                    userId,
                    academicYear,
                    semester,
                    signaturePath // Use same signature for assignment creation?
                });
                targetAssignmentId = newAssignment.id;
            }

            // Create Borrow Transaction
            await createBorrowTransaction({
                assignmentId: targetAssignmentId!, // asserted
                items: items.map(i => ({ assetId: i.id, quantity: i.quantity })),
                signaturePath,
                notes: 'Self-service borrow'
            });

            router.push('/assignments');
            router.refresh();

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Asset Selection */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">1. Select Items</h3>
                <AssetSelector
                    onSelect={handleAddItem}
                    selectedIds={items.map(i => i.id)}
                />

                {/* Cart View */}
                {items.length > 0 && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                <div>
                                    <div className="font-medium text-slate-900">{item.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{item.assetCode}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Qty:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={item.maxStock}
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                                            className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-center"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Signature */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">2. Sign & Confirm</h3>
                <SignaturePad onChange={setSignature} />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || items.length === 0 || !signature}
                    className={`px-6 py-2 bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/80/30 flex items-center gap-2 transition-all ${loading ? 'opacity-70 cursor-wait' : 'hover:bg-primary/90'}`}
                >
                    {loading ? 'Processing...' : 'Confirm Borrowing'}
                </button>
            </div>
        </div>
    );
}
