'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';

interface AdjustStockModalProps {
    items: any[];
    locations: any[];
    onClose: () => void;
}

export default function AdjustStockModal({ items, locations, onClose }: AdjustStockModalProps) {
    const [formData, setFormData] = useState({
        itemId: '',
        locationId: '',
        quantity: '',
        adjustmentType: 'add',
        unitCost: '',
        reason: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                itemId: parseInt(formData.itemId),
                locationId: parseInt(formData.locationId),
                quantity: parseInt(formData.quantity),
                adjustmentType: formData.adjustmentType,
                unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
                reason: formData.reason || undefined,
            };

            const res = await fetch('/api/stationary/stock/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to adjust stock');
            }

            await Swal.fire({
                icon: 'success',
                title: 'Stock Adjusted!',
                text: 'Stock has been adjusted successfully',
                timer: 2000,
                showConfirmButton: false,
            });

            window.location.reload();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to adjust stock',
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedItem = items.find(i => i.id === parseInt(formData.itemId));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Adjust Stock</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Item <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.itemId}
                            onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select Item</option>
                            {items.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.itemCode} - {item.name}
                                </option>
                            ))}
                        </select>
                        {selectedItem && (
                            <p className="mt-1 text-sm text-slate-500">
                                UOM: {selectedItem.uom}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.locationId}
                            onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select Location</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.code} - {loc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Adjustment Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, adjustmentType: 'add' })}
                                className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                                    formData.adjustmentType === 'add'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, adjustmentType: 'remove' })}
                                className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                                    formData.adjustmentType === 'remove'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                Remove
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, adjustmentType: 'set' })}
                                className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                                    formData.adjustmentType === 'set'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                Set To
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                            {formData.adjustmentType === 'add' && 'Increase stock quantity'}
                            {formData.adjustmentType === 'remove' && 'Decrease stock quantity'}
                            {formData.adjustmentType === 'set' && 'Set stock to specific quantity'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Unit Cost (฿)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.unitCost}
                                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Reason
                        </label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="e.g., Stock count adjustment, Damaged items, etc."
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adjusting...' : 'Adjust Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
