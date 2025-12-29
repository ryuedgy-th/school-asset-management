'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AssetSelector from '@/components/BorrowFlow/AssetSelector';
import { createAssignment, createBorrowTransaction } from '@/app/lib/borrow-actions';

interface User {
    id: number;
    name: string | null;
    email: string | null;
    userDepartment: {
        name: string;
    } | null;
}

interface NewAssignmentFormProps {
    users: User[];
    currentYear: string;
    currentSemester: number;
}

interface SelectedItem {
    id: number;
    name: string;
    assetCode: string;
    quantity: number;
    maxStock: number;
}

export default function NewAssignmentForm({ users, currentYear, currentSemester }: NewAssignmentFormProps) {
    const router = useRouter();
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [items, setItems] = useState<SelectedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddItem = (asset: any) => {
        setItems(prev => [...prev, {
            id: asset.id,
            name: asset.name,
            assetCode: asset.assetCode,
            quantity: 1,
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
        if (!selectedUserId) {
            setError('Please select a user.');
            return;
        }
        if (items.length === 0) {
            setError('Please select at least one item.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check for active assignment for the selected user
            // Create new assignment
            const newAssignment = await createAssignment({
                userId: selectedUserId,
                academicYear: currentYear,
                semester: currentSemester
            });

            // Create borrow transaction
            await createBorrowTransaction({
                assignmentId: newAssignment.id,
                items: items.map(i => ({ assetId: i.id, quantity: i.quantity })),
                notes: 'Created by admin'
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

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="space-y-8">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* User Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">1. Select User</h3>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Assign equipment to:
                    </label>
                    <select
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        disabled={loading}
                    >
                        <option value="">-- Select a user --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name || user.email} {user.userDepartment?.name && `(${user.userDepartment.name})`}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedUser && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <div className="font-medium text-blue-900">Selected User:</div>
                        <div className="text-blue-700">{selectedUser.name}</div>
                        <div className="text-blue-600 text-xs">{selectedUser.email}</div>
                    </div>
                )}
            </div>

            {/* Asset Selection */}
            {selectedUserId && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">2. Select Items</h3>
                    <AssetSelector
                        onSelect={handleAddItem}
                        selectedIds={items.map(i => i.id)}
                    />

                    {/* Cart View */}
                    {items.length > 0 && (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 mt-4">
                            <div className="font-medium text-slate-700">Selected Items ({items.length})</div>
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
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !selectedUserId || items.length === 0}
                    className={`px-6 py-2 bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/30 flex items-center gap-2 transition-all ${loading || !selectedUserId || items.length === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-primary/90'
                        }`}
                >
                    {loading ? 'Creating...' : 'Create Assignment'}
                </button>
            </div>
        </div>
    );
}
