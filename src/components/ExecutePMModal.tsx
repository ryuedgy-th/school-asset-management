'use client';

import { useState } from 'react';
import { X, Check, Upload, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

interface ExecutePMModalProps {
    isOpen: boolean;
    onClose: () => void;
    schedule: {
        id: number;
        name: string;
        asset: {
            assetCode: string;
            name: string;
        };
        checklistItems: any[];
    };
    onSuccess: () => void;
}

export default function ExecutePMModal({ isOpen, onClose, schedule, onSuccess }: ExecutePMModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        performedDate: new Date().toISOString().split('T')[0],
        performedBy: '',
        notes: '',
        partsReplaced: '',
        readings: '',
        cost: '',
        nextDueDate: '',
    });
    const [checklistStatus, setChecklistStatus] = useState<{ [key: number]: boolean }>({});

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const checklistSummary = schedule.checklistItems.map((item: any, idx: number) =>
                `- ${item.description}: ${checklistStatus[idx] ? '✓ Completed' : '✗ Not Done'}`
            ).join('\n');

            // Create maintenance log
            const maintenanceRes = await fetch('/api/maintenance-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetCode: schedule.asset.assetCode,
                    date: formData.performedDate,
                    type: 'Preventive',
                    description: `PM: ${schedule.name}\n\nNotes: ${formData.notes}\n\nChecklist:\n${checklistSummary}`,
                    performedBy: formData.performedBy,
                    cost: formData.cost ? parseFloat(formData.cost) : null,
                    partsChanged: formData.partsReplaced || null,
                    readings: formData.readings || null,
                }),
            });

            if (!maintenanceRes.ok) {
                throw new Error('Failed to create maintenance log');
            }

            // Update PM schedule
            const scheduleRes = await fetch(`/api/pm-schedules/${schedule.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lastPerformed: formData.performedDate,
                    nextDueDate: formData.nextDueDate || null,
                }),
            });

            if (!scheduleRes.ok) {
                throw new Error('Failed to update PM schedule');
            }

            await Swal.fire({
                icon: 'success',
                title: 'PM Executed Successfully',
                text: 'Maintenance log created and schedule updated',
                timer: 2000,
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to execute PM',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Execute PM: {schedule.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Asset: {schedule.asset.name} ({schedule.asset.assetCode})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Checklist */}
                    {schedule.checklistItems && schedule.checklistItems.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                <FileText className="inline w-4 h-4 mr-1" />
                                PM Checklist
                            </label>
                            <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                                {schedule.checklistItems.map((item: any, idx: number) => (
                                    <label key={idx} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={checklistStatus[idx] || false}
                                            onChange={(e) => setChecklistStatus({ ...checklistStatus, [idx]: e.target.checked })}
                                            className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary/20"
                                        />
                                        <span className="text-sm text-slate-700">{item.description}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Performed Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Performed Date *
                        </label>
                        <input
                            type="date"
                            value={formData.performedDate}
                            onChange={(e) => setFormData({ ...formData, performedDate: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                        />
                    </div>

                    {/* Performed By */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Performed By *
                        </label>
                        <input
                            type="text"
                            value={formData.performedBy}
                            onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
                            placeholder="Technician name"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional notes or observations..."
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Parts Replaced */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Parts Replaced
                            </label>
                            <input
                                type="text"
                                value={formData.partsReplaced}
                                onChange={(e) => setFormData({ ...formData, partsReplaced: e.target.value })}
                                placeholder="e.g., Air Filter, Oil"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {/* Cost */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Cost (THB)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                placeholder="0.00"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Readings */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Meter Readings
                        </label>
                        <input
                            type="text"
                            value={formData.readings}
                            onChange={(e) => setFormData({ ...formData, readings: e.target.value })}
                            placeholder="e.g., 12,345 km"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Next Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Next Due Date
                        </label>
                        <input
                            type="date"
                            value={formData.nextDueDate}
                            onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <p className="text-xs text-slate-500 mt-1">Leave blank to keep current schedule</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Executing...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Execute PM
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
