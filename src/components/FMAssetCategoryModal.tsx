'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
}

interface FMAssetCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category?: Category | null;
}

const ICON_OPTIONS = [
    'Warehouse',
    'Building',
    'Car',
    'Cpu',
    'Printer',
    'Monitor',
    'Server',
    'Wrench',
    'Zap',
    'Wifi',
];

const COLOR_OPTIONS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' },
];

export default function FMAssetCategoryModal({
    isOpen,
    onClose,
    onSuccess,
    category,
}: FMAssetCategoryModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: 'Warehouse',
        color: '#3B82F6',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description || '',
                icon: category.icon || 'Warehouse',
                color: category.color || '#3B82F6',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                icon: 'Warehouse',
                color: '#3B82F6',
            });
        }
        setError('');
    }, [category, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Category name is required');
            return;
        }

        setLoading(true);

        try {
            const url = category
                ? `/api/fm-asset-categories/${category.id}`
                : '/api/fm-asset-categories';

            const response = await fetch(url, {
                method: category ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save category');
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {category ? 'Edit Category' : 'Create Category'}
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

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., HVAC Systems"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Optional description"
                        />
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Icon
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {ICON_OPTIONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon })}
                                    className={`p-3 border rounded-lg text-center transition-colors ${
                                        formData.icon === icon
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    <span className="text-xs">{icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {COLOR_OPTIONS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() =>
                                        setFormData({ ...formData, color: color.value })
                                    }
                                    className={`p-2 border rounded-lg flex flex-col items-center gap-1 transition-all ${
                                        formData.color === color.value
                                            ? 'border-gray-900 ring-2 ring-gray-900'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                >
                                    <div
                                        className="w-8 h-8 rounded"
                                        style={{ backgroundColor: color.value }}
                                    />
                                    <span className="text-xs text-gray-600">
                                        {color.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
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
                            {loading ? 'Saving...' : category ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
