'use client';

import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

interface TransferStockModalProps {
    items: any[];
    locations: any[];
    stock: any[];
    onClose: () => void;
}

export default function TransferStockModal({ items, locations, stock, onClose }: TransferStockModalProps) {
    const [formData, setFormData] = useState({
        itemId: '',
        fromLocationId: '',
        toLocationId: '',
        quantity: '',
        reason: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.fromLocationId === formData.toLocationId) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Transfer',
                text: 'From and To locations must be different',
            });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                itemId: parseInt(formData.itemId),
                fromLocationId: parseInt(formData.fromLocationId),
                toLocationId: parseInt(formData.toLocationId),
                quantity: parseInt(formData.quantity),
                reason: formData.reason || undefined,
            };

            const res = await fetch('/api/stationary/stock/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to transfer stock');
            }

            await Swal.fire({
                icon: 'success',
                title: 'Stock Transferred!',
                text: 'Stock has been transferred successfully',
                timer: 2000,
                showConfirmButton: false,
            });

            window.location.reload();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to transfer stock',
            });
        } finally {
            setLoading(false);
        }
    };

    // Get available stock for selected item and from location
    const availableStock = stock.find(
        s => s.itemId === parseInt(formData.itemId) && s.locationId === parseInt(formData.fromLocationId)
    );

    const selectedItem = items.find(i => i.id === parseInt(formData.itemId));
    const fromLocation = locations.find(l => l.id === parseInt(formData.fromLocationId));
    const toLocation = locations.find(l => l.id === parseInt(formData.toLocationId));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Transfer Stock</h2>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                From Location <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.fromLocationId}
                                onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            >
                                <option value="">Select Location</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.code} - {loc.name}
                                    </option>
                                ))}
                            </select>
                            {availableStock && (
                                <p className="mt-1 text-sm text-green-600 font-medium">
                                    Available: {availableStock.quantity} {selectedItem?.uom}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <ArrowRight className="text-primary" size={24} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                To Location <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.toLocationId}
                                onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    </div>

                    {formData.itemId && formData.fromLocationId && !availableStock && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                No stock available at the selected location for this item.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Quantity to Transfer <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={availableStock?.quantity || undefined}
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
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
                            placeholder="e.g., Restock, Relocation, etc."
                        />
                    </div>

                    {/* Transfer Summary */}
                    {formData.itemId && formData.fromLocationId && formData.toLocationId && formData.quantity && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <h3 className="font-semibold text-purple-900 mb-2">Transfer Summary</h3>
                            <div className="space-y-1 text-sm text-purple-800">
                                <p>
                                    <span className="font-medium">Item:</span> {selectedItem?.name}
                                </p>
                                <p>
                                    <span className="font-medium">Quantity:</span> {formData.quantity} {selectedItem?.uom}
                                </p>
                                <p>
                                    <span className="font-medium">From:</span> {fromLocation?.name}
                                </p>
                                <p>
                                    <span className="font-medium">To:</span> {toLocation?.name}
                                </p>
                            </div>
                        </div>
                    )}

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
                            disabled={loading || !availableStock}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Transferring...' : 'Transfer Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
