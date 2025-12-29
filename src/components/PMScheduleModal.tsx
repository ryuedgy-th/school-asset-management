'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface PMScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    schedule?: any; // Existing schedule for editing (null for creating)
    assets: Array<{ id: number; name: string; assetCode: string }>;
    users: Array<{ id: number; name: string }>;
    preselectedAssetId?: number; // Lock asset selection to this ID
    components?: Array<{ id: number; name: string; componentType: string }>; // Available components
}

export default function PMScheduleModal({
    isOpen,
    onClose,
    onSubmit,
    schedule,
    assets,
    users,
    preselectedAssetId,
    components = [],
}: PMScheduleModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        assetId: '',
        componentId: '',
        name: '',
        description: '',
        scheduleType: 'time',
        frequency: 'monthly',
        intervalValue: '1',
        intervalUnit: 'months',
        nextDueDate: '',
        priority: 'medium',
        assignedToId: '',
        checklistItems: [] as string[],
    });
    const [newChecklistItem, setNewChecklistItem] = useState('');

    useEffect(() => {
        if (schedule) {
            // Populate form with existing schedule data
            setFormData({
                assetId: schedule.assetId?.toString() || '',
                componentId: schedule.componentId?.toString() || '',
                name: schedule.name || '',
                description: schedule.description || '',
                scheduleType: schedule.scheduleType || 'time',
                frequency: schedule.frequency || 'monthly',
                intervalValue: schedule.intervalValue?.toString() || '1',
                intervalUnit: schedule.intervalUnit || 'months',
                nextDueDate: schedule.nextDueDate
                    ? new Date(schedule.nextDueDate).toISOString().split('T')[0]
                    : '',
                priority: schedule.priority || 'medium',
                assignedToId: schedule.assignedToId?.toString() || '',
                checklistItems: schedule.checklistItems || [],
            });
        } else {
            // Reset form for new schedule
            setFormData({
                assetId: preselectedAssetId?.toString() || '',
                componentId: '',
                name: '',
                description: '',
                scheduleType: 'time',
                frequency: 'monthly',
                intervalValue: '1',
                intervalUnit: 'months',
                nextDueDate: '',
                priority: 'medium',
                assignedToId: '',
                checklistItems: [],
            });
        }
    }, [schedule, preselectedAssetId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSubmit({
                assetId: parseInt(formData.assetId),
                componentId: formData.componentId ? parseInt(formData.componentId) : null,
                name: formData.name,
                description: formData.description || null,
                scheduleType: formData.scheduleType,
                frequency: formData.frequency,
                intervalValue: parseInt(formData.intervalValue),
                intervalUnit: formData.intervalUnit,
                nextDueDate: formData.nextDueDate || null,
                priority: formData.priority,
                assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : null,
                checklistItems: formData.checklistItems,
            });
            onClose();
        } catch (error) {
            console.error('Error submitting PM schedule:', error);
            alert('Failed to save PM schedule');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addChecklistItem = () => {
        if (newChecklistItem.trim()) {
            setFormData({
                ...formData,
                checklistItems: [...formData.checklistItems, newChecklistItem.trim()],
            });
            setNewChecklistItem('');
        }
    };

    const removeChecklistItem = (index: number) => {
        setFormData({
            ...formData,
            checklistItems: formData.checklistItems.filter((_, i) => i !== index),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {schedule ? 'Edit PM Schedule' : 'Create PM Schedule'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Asset Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Asset <span className="text-red-500">*</span>
                        </label>
                        {preselectedAssetId ? (
                            <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-900">
                                {assets.find((a) => a.id === preselectedAssetId)?.assetCode} -{' '}
                                {assets.find((a) => a.id === preselectedAssetId)?.name}
                            </div>
                        ) : (
                            <select
                                required
                                value={formData.assetId}
                                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="">Select an asset...</option>
                                {assets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.assetCode} - {asset.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Component Selection (Optional) */}
                    {components.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Component (Optional)
                            </label>
                            <select
                                value={formData.componentId}
                                onChange={(e) => setFormData({ ...formData, componentId: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="">Whole Asset (No specific component)</option>
                                {components.map((component) => (
                                    <option key={component.id} value={component.id}>
                                        {component.name} ({component.componentType})
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-500">
                                Leave blank for asset-level maintenance, or select a specific component
                            </p>
                        </div>
                    )}

                    {/* Schedule Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Schedule Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Monthly AC Filter Inspection"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Additional details about this schedule..."
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Schedule Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Schedule Type
                        </label>
                        <select
                            value={formData.scheduleType}
                            onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="time">Time-Based</option>
                            <option value="usage">Usage-Based</option>
                            <option value="condition">Condition-Based</option>
                        </select>
                    </div>

                    {/* Frequency (for time-based) */}
                    {formData.scheduleType === 'time' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Frequency
                                </label>
                                <select
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Interval
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.intervalValue}
                                        onChange={(e) =>
                                            setFormData({ ...formData, intervalValue: e.target.value })
                                        }
                                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <select
                                        value={formData.intervalUnit}
                                        onChange={(e) =>
                                            setFormData({ ...formData, intervalUnit: e.target.value })
                                        }
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="days">Days</option>
                                        <option value="weeks">Weeks</option>
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Next Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Next Due Date
                        </label>
                        <input
                            type="date"
                            value={formData.nextDueDate}
                            onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Assign To
                        </label>
                        <select
                            value={formData.assignedToId}
                            onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">Unassigned</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Checklist Items */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Checklist Items
                        </label>
                        <div className="space-y-2">
                            {formData.checklistItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                                        {item}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeChecklistItem(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newChecklistItem}
                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                                    placeholder="Add checklist item..."
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={addChecklistItem}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
