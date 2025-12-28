'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createSparePart, updateSparePart } from '@/app/lib/inventory-actions';
import { useRouter } from 'next/navigation';

interface SparePartModalProps {
    isOpen: boolean;
    onClose: () => void;
    sparePart?: any;
}

export default function SparePartModal({ isOpen, onClose, sparePart }: SparePartModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        partNumber: sparePart?.partNumber || '',
        name: sparePart?.name || '',
        description: sparePart?.description || '',
        category: sparePart?.category || '',
        supplier: sparePart?.supplier || '',
        supplierPartNumber: sparePart?.supplierPartNumber || '',
        currentStock: sparePart?.currentStock || 0,
        minStock: sparePart?.minStock || 0,
        maxStock: sparePart?.maxStock || '',
        reorderPoint: sparePart?.reorderPoint || 0,
        unitCost: sparePart?.unitCost || '',
        storageLocation: sparePart?.storageLocation || '',
        unit: sparePart?.unit || 'units',
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            const submitData = {
                partNumber: formData.partNumber,
                name: formData.name,
                ...(formData.description && { description: formData.description }),
                ...(formData.category && { category: formData.category }),
                ...(formData.supplier && { supplier: formData.supplier }),
                ...(formData.supplierPartNumber && { supplierPartNumber: formData.supplierPartNumber }),
                currentStock: parseInt(formData.currentStock.toString()) || 0,
                minStock: parseInt(formData.minStock.toString()) || 0,
                ...(formData.maxStock && { maxStock: parseInt(formData.maxStock.toString()) }),
                reorderPoint: parseInt(formData.reorderPoint.toString()) || 0,
                ...(formData.unitCost && { unitCost: parseFloat(formData.unitCost.toString()) }),
                ...(formData.storageLocation && { storageLocation: formData.storageLocation }),
                ...(formData.unit && { unit: formData.unit }),
            };

            if (sparePart) {
                await updateSparePart(sparePart.id, submitData);
                alert('Spare part updated successfully');
            } else {
                await createSparePart(submitData);
                alert('Spare part created successfully');
            }

            router.refresh();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to save spare part');
        } finally {
            setLoading(false);
        }
    };

    const commonCategories = [
        'Electrical',
        'Mechanical',
        'HVAC',
        'Plumbing',
        'IT Equipment',
        'Safety',
        'Cleaning',
        'Other',
    ];

    const commonUnits = ['units', 'pieces', 'kg', 'liters', 'meters', 'boxes', 'sets'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold">
                        {sparePart ? 'Edit Spare Part' : 'Add New Spare Part'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Part Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="partNumber"
                                    value={formData.partNumber}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g., SP-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g., HEPA Filter H14"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Part description..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Select category</option>
                                    {commonCategories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Unit</label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    {commonUnits.map((unit) => (
                                        <option key={unit} value={unit}>
                                            {unit}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Supplier Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Supplier Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Supplier</label>
                                <input
                                    type="text"
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Supplier name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Supplier Part Number
                                </label>
                                <input
                                    type="text"
                                    name="supplierPartNumber"
                                    value={formData.supplierPartNumber}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Supplier's part number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Inventory Levels */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Inventory Levels</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {sparePart ? 'Current Stock (read-only)' : 'Initial Stock'}
                                </label>
                                <input
                                    type="number"
                                    name="currentStock"
                                    value={formData.currentStock}
                                    onChange={handleChange}
                                    disabled={!!sparePart}
                                    className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                                    min="0"
                                />
                                {sparePart && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use transactions to adjust
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Min Stock <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="minStock"
                                    value={formData.minStock}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Max Stock</label>
                                <input
                                    type="number"
                                    name="maxStock"
                                    value={formData.maxStock}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Reorder Point <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="reorderPoint"
                                    value={formData.reorderPoint}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                />
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            * Reorder Point: Stock level that triggers a reorder notification
                        </p>
                    </div>

                    {/* Cost & Location */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Cost & Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Unit Cost (฿)
                                </label>
                                <input
                                    type="number"
                                    name="unitCost"
                                    value={formData.unitCost}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Storage Location
                                </label>
                                <input
                                    type="text"
                                    name="storageLocation"
                                    value={formData.storageLocation}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g., Warehouse A, Shelf B3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : sparePart ? 'Update Part' : 'Create Part'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
