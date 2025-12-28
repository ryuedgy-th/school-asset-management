'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ServiceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    componentId: number;
    componentName: string;
}

const SERVICE_TYPES = ['routine', 'corrective', 'preventive', 'emergency', 'inspection'];

export default function ServiceHistoryModal({
    isOpen,
    onClose,
    onSuccess,
    componentId,
    componentName,
}: ServiceHistoryModalProps) {
    const [formData, setFormData] = useState({
        serviceDate: new Date().toISOString().split('T')[0],
        serviceType: 'routine',
        performedBy: '',
        description: '',
        partsReplaced: '',
        cost: '',
        nextServiceDue: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.description.trim()) {
            setError('Service description is required');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                componentId,
                cost: formData.cost ? parseFloat(formData.cost) : null,
                nextServiceDue: formData.nextServiceDue || null,
            };

            const response = await fetch(`/api/components/${componentId}/service-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save service record');
            }

            onSuccess();
            onClose();

            // Reset form
            setFormData({
                serviceDate: new Date().toISOString().split('T')[0],
                serviceType: 'routine',
                performedBy: '',
                description: '',
                partsReplaced: '',
                cost: '',
                nextServiceDue: '',
                notes: '',
            });
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
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Log Service Record
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">{componentName}</p>
                    </div>
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
                        {/* Service Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service Date *
                            </label>
                            <input
                                type="date"
                                value={formData.serviceDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, serviceDate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Service Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service Type *
                            </label>
                            <select
                                value={formData.serviceType}
                                onChange={(e) =>
                                    setFormData({ ...formData, serviceType: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                {SERVICE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Performed By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Performed By
                            </label>
                            <input
                                type="text"
                                value={formData.performedBy}
                                onChange={(e) =>
                                    setFormData({ ...formData, performedBy: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Technician name or company"
                            />
                        </div>

                        {/* Cost */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cost (THB)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.cost}
                                onChange={(e) =>
                                    setFormData({ ...formData, cost: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Next Service Due */}
                        <div className="col-span-2">
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

                        {/* Description */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Describe the service work performed..."
                                required
                            />
                        </div>

                        {/* Parts Replaced */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Parts Replaced
                            </label>
                            <textarea
                                value={formData.partsReplaced}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        partsReplaced: e.target.value,
                                    })
                                }
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="List parts that were replaced (optional)"
                            />
                        </div>

                        {/* Notes */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additional Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Any additional observations or recommendations..."
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
                            {loading ? 'Saving...' : 'Save Service Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
