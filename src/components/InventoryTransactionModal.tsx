'use client';

import { useState } from 'react';
import { X, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { recordTransaction } from '@/app/lib/inventory-actions';
import { useRouter } from 'next/navigation';

interface InventoryTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sparePart: any;
}

export default function InventoryTransactionModal({
    isOpen,
    onClose,
    sparePart,
}: InventoryTransactionModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'in' as 'in' | 'out' | 'adjustment',
        quantity: '',
        unitCost: sparePart?.unitCost || '',
        notes: '',
    });

    if (!isOpen || !sparePart) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const quantity = parseInt(formData.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                throw new Error('Invalid quantity');
            }

            const submitData = {
                sparePartId: sparePart.id,
                type: formData.type,
                quantity: formData.type === 'adjustment' ? quantity : quantity,
                ...(formData.unitCost && { unitCost: parseFloat(formData.unitCost.toString()) }),
                ...(formData.notes && { notes: formData.notes }),
            };

            await recordTransaction(submitData);

            alert('Transaction recorded successfully');
            router.refresh();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to record transaction');
        } finally {
            setLoading(false);
        }
    };

    const calculateNewStock = () => {
        const quantity = parseInt(formData.quantity) || 0;
        if (formData.type === 'in') {
            return sparePart.currentStock + quantity;
        } else if (formData.type === 'out') {
            return sparePart.currentStock - quantity;
        } else if (formData.type === 'adjustment') {
            return quantity;
        }
        return sparePart.currentStock;
    };

    const newStock = calculateNewStock();
    const isInsufficientStock = formData.type === 'out' && newStock < 0;

    const transactionTypes = [
        {
            value: 'in',
            label: 'Stock In',
            description: 'Receive new stock (purchase, return)',
            icon: TrendingUp,
            color: 'text-green-600 bg-green-50',
        },
        {
            value: 'out',
            label: 'Stock Out',
            description: 'Remove stock (usage, sale, damage)',
            icon: TrendingDown,
            color: 'text-red-600 bg-red-50',
        },
        {
            value: 'adjustment',
            label: 'Adjustment',
            description: 'Set exact stock level (inventory count)',
            icon: RefreshCw,
            color: 'text-blue-600 bg-blue-50',
        },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Record Transaction</h2>
                        <p className="text-sm text-slate-600 mt-1">
                            {sparePart.name} ({sparePart.partNumber})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Current Stock Info */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-sm text-slate-600">Current Stock</div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {sparePart.currentStock} {sparePart.unit || 'units'}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-600">Reorder Point</div>
                                <div className="text-2xl font-bold text-slate-900">{sparePart.reorderPoint}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-600">New Stock</div>
                                <div
                                    className={`text-2xl font-bold ${
                                        isInsufficientStock
                                            ? 'text-red-600'
                                            : newStock <= sparePart.reorderPoint
                                            ? 'text-orange-600'
                                            : 'text-green-600'
                                    }`}
                                >
                                    {newStock} {sparePart.unit || 'units'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-3">
                            Transaction Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {transactionTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                type: type.value as 'in' | 'out' | 'adjustment',
                                            }))
                                        }
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.type === type.value
                                                ? `${type.color} border-current`
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <Icon className="w-5 h-5 mt-0.5" />
                                            <div>
                                                <div className="font-semibold">{type.label}</div>
                                                <div className="text-xs text-slate-600 mt-1">
                                                    {type.description}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                            {formData.type === 'adjustment' ? 'New Stock Level' : 'Quantity'}{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                            min="1"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder={
                                formData.type === 'adjustment'
                                    ? 'Enter exact stock level'
                                    : 'Enter quantity'
                            }
                        />
                        {isInsufficientStock && (
                            <p className="text-sm text-red-600 mt-1">
                                Insufficient stock! Current: {sparePart.currentStock}
                            </p>
                        )}
                    </div>

                    {/* Unit Cost (for IN transactions) */}
                    {formData.type === 'in' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-900 mb-1">
                                Unit Cost (฿)
                            </label>
                            <input
                                type="number"
                                name="unitCost"
                                value={formData.unitCost}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                            <p className="text-sm text-slate-600 mt-1">
                                Optional: Record the cost per unit for this purchase
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Additional notes..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-slate-400 transition-colors shadow-lg shadow-primary/20"
                            disabled={loading || isInsufficientStock}
                        >
                            {loading ? 'Recording...' : 'Record Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
