'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';

interface ItemModalProps {
    item: any;
    categories: any[];
    onClose: () => void;
}

export default function ItemModal({ item, categories, onClose }: ItemModalProps) {
    const [formData, setFormData] = useState({
        itemCode: '',
        name: '',
        description: '',
        categoryId: '',
        uom: 'pcs',
        unitCost: '',
        reorderLevel: '',
        maxQuantity: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                itemCode: item.itemCode || '',
                name: item.name || '',
                description: item.description || '',
                categoryId: item.categoryId?.toString() || '',
                uom: item.uom || 'pcs',
                unitCost: item.unitCost?.toString() || '',
                reorderLevel: item.reorderLevel?.toString() || '',
                maxQuantity: item.maxQuantity?.toString() || '',
                isActive: item.isActive ?? true,
            });
        }
    }, [item]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = item
                ? `/api/stationary/items/${item.itemCode}`
                : '/api/stationary/items';

            const method = item ? 'PUT' : 'POST';

            const payload: any = {
                ...formData,
                categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
                unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
                reorderLevel: formData.reorderLevel ? parseInt(formData.reorderLevel) : null,
                maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity) : null,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save item');
            }

            await Swal.fire({
                icon: 'success',
                title: item ? 'Updated!' : 'Created!',
                text: `Item has been ${item ? 'updated' : 'created'} successfully`,
                timer: 2000,
                showConfirmButton: false,
            });

            window.location.reload();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to save item',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        {item ? 'Edit Item' : 'Add New Item'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Item Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.itemCode}
                                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={!!item}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">No Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Unit of Measure (UOM) <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.uom}
                                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="pcs">Pieces (pcs)</option>
                                <option value="box">Box</option>
                                <option value="ream">Ream</option>
                                <option value="pack">Pack</option>
                                <option value="set">Set</option>
                                <option value="bottle">Bottle</option>
                                <option value="roll">Roll</option>
                                <option value="unit">Unit</option>
                            </select>
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
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Reorder Level
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.reorderLevel}
                                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Max Quantity
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.maxQuantity}
                                onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                            Active
                        </label>
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
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (item ? 'Update Item' : 'Create Item')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
