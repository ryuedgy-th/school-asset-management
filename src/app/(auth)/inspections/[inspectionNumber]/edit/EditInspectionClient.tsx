'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateInspectionCost } from '@/app/lib/inspection-actions';

interface EditInspectionClientProps {
    inspection: {
        id: number;
        damageDescription: string | null;
        estimatedCost: number | null;
        asset: {
            name: string;
            assetCode: string;
        };
    };
}

export default function EditInspectionClient({ inspection }: EditInspectionClientProps) {
    const router = useRouter();
    const [estimatedCost, setEstimatedCost] = useState(inspection.estimatedCost?.toString() || '');
    const [damageDescription, setDamageDescription] = useState(inspection.damageDescription || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const cost = parseFloat(estimatedCost);

            if (isNaN(cost) || cost < 0) {
                setError('Please enter a valid cost amount');
                setIsSubmitting(false);
                return;
            }

            await updateInspectionCost(inspection.id, {
                estimatedCost: cost,
                damageDescription: damageDescription || undefined
            });

            // Show success and redirect
            alert('✅ Inspection cost updated successfully! Email notification sent.');
            router.push(`/inspections/${inspection.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to update inspection cost');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-primary hover:text-blue-800 mb-4 flex items-center gap-2"
                    >
                        ← Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Update Damage Cost</h1>
                    <p className="mt-2 text-gray-600">
                        Update the estimated repair cost after receiving quotation
                    </p>
                </div>

                {/* Asset Info Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Asset Name</p>
                            <p className="text-base font-medium text-gray-900">{inspection.asset.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Asset Code</p>
                            <p className="text-base font-medium text-gray-900">{inspection.asset.assetCode}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="space-y-6">
                        {/* Estimated Cost */}
                        <div>
                            <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-2">
                                Estimated Repair Cost (THB) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    id="estimatedCost"
                                    value={estimatedCost}
                                    onChange={(e) => setEstimatedCost(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/80 focus:border-transparent"
                                    placeholder="0.00"
                                />
                                <span className="absolute right-4 top-3 text-gray-500">THB</span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Enter the quotation amount from the repair shop or vendor
                            </p>
                        </div>

                        {/* Damage Description */}
                        <div>
                            <label htmlFor="damageDescription" className="block text-sm font-medium text-gray-700 mb-2">
                                Damage Description (Optional)
                            </label>
                            <textarea
                                id="damageDescription"
                                value={damageDescription}
                                onChange={(e) => setDamageDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/80 focus:border-transparent resize-none"
                                placeholder="Update or add more details about the damage..."
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                You can update the damage description if needed
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-primary/10 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <span className="text-primary text-xl">ℹ️</span>
                                <div>
                                    <p className="text-sm font-medium text-blue-900 mb-1">What happens next?</p>
                                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                        <li>Status will change to "Quotation Received"</li>
                                        <li>Email notification will be sent to all stakeholders</li>
                                        <li>Directors will be notified to approve or waive charges</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? 'Updating...' : 'Update Cost & Send Notification'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
