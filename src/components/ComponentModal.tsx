'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Component {
    id: number;
    name: string;
    type: string | null;
    manufacturer: string | null;
    model: string | null;
    serialNumber: string | null;
    specifications: string | null;
    installDate: Date | null;
    warrantyExpiry: Date | null;
    lastServiceDate: Date | null;
    nextServiceDue: Date | null;
    condition: string;
    notes: string | null;
}

interface ComponentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assetId: number;
    component?: Component | null;
}

const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'poor', 'needs_replacement'];

export default function ComponentModal({
    isOpen,
    onClose,
    onSuccess,
    assetId,
    component,
}: ComponentModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        specifications: '',
        installDate: '',
        warrantyExpiry: '',
        lastServiceDate: '',
        nextServiceDue: '',
        condition: 'good',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (component) {
            setFormData({
                name: component.name,
                type: component.type || '',
                manufacturer: component.manufacturer || '',
                model: component.model || '',
                serialNumber: component.serialNumber || '',
                specifications: component.specifications || '',
                installDate: component.installDate
                    ? new Date(component.installDate).toISOString().split('T')[0]
                    : '',
                warrantyExpiry: component.warrantyExpiry
                    ? new Date(component.warrantyExpiry).toISOString().split('T')[0]
                    : '',
                lastServiceDate: component.lastServiceDate
                    ? new Date(component.lastServiceDate).toISOString().split('T')[0]
                    : '',
                nextServiceDue: component.nextServiceDue
                    ? new Date(component.nextServiceDue).toISOString().split('T')[0]
                    : '',
                condition: component.condition || 'good',
                notes: component.notes || '',
            });
        } else {
            setFormData({
                name: '',
                type: '',
                manufacturer: '',
                model: '',
                serialNumber: '',
                specifications: '',
                installDate: '',
                warrantyExpiry: '',
                lastServiceDate: '',
                nextServiceDue: '',
                condition: 'good',
                notes: '',
            });
        }
        setError('');
    }, [component, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Component name is required');
            return;
        }

        setLoading(true);

        try {
            const url = component
                ? `/api/components/${component.id}`
                : `/api/fm-assets/${assetId}/components`;

            const payload = {
                ...formData,
                assetId,
                installDate: formData.installDate || null,
                warrantyExpiry: formData.warrantyExpiry || null,
                lastServiceDate: formData.lastServiceDate || null,
                nextServiceDue: formData.nextServiceDue || null,
            };

            const response = await fetch(url, {
                method: component ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save component');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">
                        {component ? 'Edit Component' : 'Add Component'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Component Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Compressor Unit A1"
                                required
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <input
                                type="text"
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({ ...formData, type: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Compressor"
                            />
                        </div>

                        {/* Manufacturer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manufacturer
                            </label>
                            <input
                                type="text"
                                value={formData.manufacturer}
                                onChange={(e) =>
                                    setFormData({ ...formData, manufacturer: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Daikin"
                            />
                        </div>

                        {/* Model */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Model
                            </label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={(e) =>
                                    setFormData({ ...formData, model: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., RZQ125C"
                            />
                        </div>

                        {/* Serial Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Serial Number
                            </label>
                            <input
                                type="text"
                                value={formData.serialNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, serialNumber: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., SN123456789"
                            />
                        </div>

                        {/* Condition */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Condition
                            </label>
                            <select
                                value={formData.condition}
                                onChange={(e) =>
                                    setFormData({ ...formData, condition: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {CONDITION_OPTIONS.map((condition) => (
                                    <option key={condition} value={condition}>
                                        {condition.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Install Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Install Date
                            </label>
                            <input
                                type="date"
                                value={formData.installDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, installDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Warranty Expiry */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Warranty Expiry
                            </label>
                            <input
                                type="date"
                                value={formData.warrantyExpiry}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        warrantyExpiry: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Last Service Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Service Date
                            </label>
                            <input
                                type="date"
                                value={formData.lastServiceDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        lastServiceDate: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Next Service Due */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Next Service Due
                            </label>
                            <input
                                type="date"
                                value={formData.nextServiceDue}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        nextServiceDue: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Specifications */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Specifications
                            </label>
                            <textarea
                                value={formData.specifications}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        specifications: e.target.value,
                                    })
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Technical specifications..."
                            />
                        </div>

                        {/* Notes */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Additional notes..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : component ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
