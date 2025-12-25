'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Search, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Minus, Camera, Image as ImageIcon } from 'lucide-react';
import { createInspection } from '@/app/lib/inspection-actions';
import { useRouter } from 'next/navigation';

interface InspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    assets: Array<{ id: number; name: string; assetCode: string }>;
}

const INSPECTION_TYPES = [
    { value: 'checkout', label: '📤 Checkout', desc: 'Before lending out' },
    { value: 'checkin', label: '📥 Check-in', desc: 'When returned' },
    { value: 'periodic', label: '🔄 Periodic', desc: 'Regular inspection' },
    { value: 'incident', label: '⚠️ Incident', desc: 'Damage report' }
];

const EXTERIOR_CONDITIONS = [
    { value: 'no_damage', label: 'No visible damage' },
    { value: 'minor_wear', label: 'Minor cosmetic wear' },
    { value: 'moderate_wear', label: 'Moderate wear' },
    { value: 'visible_dent', label: 'Visible dent(s)' },
    { value: 'structural_damage', label: 'Structural damage' }
];

const SCREEN_CONDITIONS = [
    { value: 'perfect', label: 'Perfect - no marks' },
    { value: 'minor_scratches', label: 'Minor scratches' },
    { value: 'noticeable_scratches', label: 'Noticeable scratches' },
    { value: 'screen_blemish', label: 'Screen blemish' },
    { value: 'cracked', label: 'Cracked/damaged' }
];

const BUTTON_PORT_CONDITIONS = [
    { value: 'all_functional', label: 'All functional' },
    { value: 'sticky_button', label: 'Sticky button' },
    { value: 'loose_port', label: 'Loose port' },
    { value: 'non_functional', label: 'Non-functional' }
];

const KEYBOARD_CONDITIONS = [
    { value: 'fully_functional', label: 'Fully functional' },
    { value: 'minor_wear', label: 'Minor wear' },
    { value: 'sticking_keys', label: 'Sticking keys' },
    { value: 'missing_keys', label: 'Missing keys' },
    { value: 'not_applicable', label: 'N/A' }
];

const TOUCHPAD_CONDITIONS = [
    { value: 'fully_functional', label: 'Fully functional' },
    { value: 'inconsistent', label: 'Inconsistent' },
    { value: 'non_functional', label: 'Non-functional' },
    { value: 'not_applicable', label: 'N/A' }
];

const BATTERY_HEALTH = [
    { value: 'normal', label: 'Normal (90-100%)' },
    { value: 'moderate', label: 'Moderate (80-89%)' },
    { value: 'replace_soon', label: 'Replace soon (<80%)' },
    { value: 'not_applicable', label: 'N/A' }
];

export default function InspectionModal({ isOpen, onClose, assets }: InspectionModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [assetSearch, setAssetSearch] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        inspectionType: 'periodic',
        exteriorCondition: '',
        screenCondition: '',
        buttonPortCondition: '',
        keyboardCondition: '',
        touchpadCondition: '',
        batteryHealth: '',
        overallNotes: '',
        damageDescription: '',
        estimatedCost: ''
    });

    // Filter assets based on search
    const filteredAssets = useMemo(() => {
        if (!assetSearch) return assets.slice(0, 8);
        const search = assetSearch.toLowerCase();
        return assets.filter(a =>
            a.name.toLowerCase().includes(search) ||
            a.assetCode.toLowerCase().includes(search)
        ).slice(0, 8);
    }, [assetSearch, assets]);

    // Handle photo upload
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + photoFiles.length > 15) {
            alert('Maximum 15 photos allowed');
            return;
        }

        // Add new files
        setPhotoFiles([...photoFiles, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setPhotoFiles(photoFiles.filter((_, i) => i !== index));
        setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
    };

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxIndex(null);
            } else if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
                setLightboxIndex(lightboxIndex - 1);
            } else if (e.key === 'ArrowRight' && lightboxIndex < photoPreviews.length - 1) {
                setLightboxIndex(lightboxIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, photoPreviews.length]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAsset) {
            alert('Please select an asset');
            return;
        }

        setLoading(true);
        try {
            await createInspection({
                assetId: selectedAsset.id,
                inspectionType: formData.inspectionType as any,
                exteriorCondition: formData.exteriorCondition || undefined,
                screenCondition: formData.screenCondition || undefined,
                buttonPortCondition: formData.buttonPortCondition || undefined,
                keyboardCondition: formData.keyboardCondition || undefined,
                touchpadCondition: formData.touchpadCondition || undefined,
                batteryHealth: formData.batteryHealth || undefined,
                damageDescription: formData.damageDescription || undefined,
                estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : undefined,
                notes: formData.overallNotes || undefined,
                photoFiles: photoFiles.length > 0 ? photoFiles : undefined
            });

            router.refresh();
            onClose();
            // Reset form
            setSelectedAsset(null);
            setAssetSearch('');
            setPhotoFiles([]);
            setPhotoPreviews([]);
            setFormData({
                inspectionType: 'periodic',
                exteriorCondition: '',
                screenCondition: '',
                buttonPortCondition: '',
                keyboardCondition: '',
                touchpadCondition: '',
                batteryHealth: '',
                overallNotes: '',
                damageDescription: '',
                estimatedCost: ''
            });
        } catch (error) {
            console.error('Failed to create inspection:', error);
            alert('Failed to create inspection');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                padding: '16px'
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    width: '100%',
                    maxWidth: '768px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Create Inspection</h2>
                        <p className="text-blue-100 text-sm mt-1">Quick asset condition check</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="text-white" size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Step 1: Select Asset */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <h3 className="font-semibold text-slate-900 mb-3">1. Select Asset</h3>

                            {!selectedAsset ? (
                                <>
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            value={assetSearch}
                                            onChange={(e) => setAssetSearch(e.target.value)}
                                            placeholder="Search by name or code..."
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                        {filteredAssets.map((asset) => (
                                            <button
                                                key={asset.id}
                                                type="button"
                                                onClick={() => setSelectedAsset(asset)}
                                                className="p-3 text-left bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                                            >
                                                <div className="font-medium text-slate-900 text-sm">{asset.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-1">{asset.assetCode}</div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-300">
                                    <div>
                                        <div className="font-medium text-slate-900">{selectedAsset.name}</div>
                                        <div className="text-sm text-slate-500 font-mono">{selectedAsset.assetCode}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAsset(null)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Inspection Type */}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-3">2. Inspection Type</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {INSPECTION_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, inspectionType: type.value })}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${formData.inspectionType === type.value
                                            ? 'border-blue-500 bg-blue-50 shadow-md'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="text-lg mb-1">{type.label}</div>
                                        <div className="text-xs text-slate-500">{type.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 3: Detailed Condition Check */}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-3">3. Detailed Condition Check</h3>
                            <div className="space-y-4">
                                {/* Exterior */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        🖥️ Exterior Casing
                                    </label>
                                    <select
                                        value={formData.exteriorCondition}
                                        onChange={(e) => setFormData({ ...formData, exteriorCondition: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select condition...</option>
                                        {EXTERIOR_CONDITIONS.map((cond) => (
                                            <option key={cond.value} value={cond.value}>
                                                {cond.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Screen */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        📱 Screen Condition
                                    </label>
                                    <select
                                        value={formData.screenCondition}
                                        onChange={(e) => setFormData({ ...formData, screenCondition: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select condition...</option>
                                        {SCREEN_CONDITIONS.map((cond) => (
                                            <option key={cond.value} value={cond.value}>
                                                {cond.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Buttons & Ports */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        🔌 Buttons & Ports
                                    </label>
                                    <select
                                        value={formData.buttonPortCondition}
                                        onChange={(e) => setFormData({ ...formData, buttonPortCondition: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select condition...</option>
                                        {BUTTON_PORT_CONDITIONS.map((cond) => (
                                            <option key={cond.value} value={cond.value}>
                                                {cond.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Keyboard */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        ⌨️ Keyboard
                                    </label>
                                    <select
                                        value={formData.keyboardCondition}
                                        onChange={(e) => setFormData({ ...formData, keyboardCondition: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select condition...</option>
                                        {KEYBOARD_CONDITIONS.map((cond) => (
                                            <option key={cond.value} value={cond.value}>
                                                {cond.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Touchpad */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        👆 Touchpad
                                    </label>
                                    <select
                                        value={formData.touchpadCondition}
                                        onChange={(e) => setFormData({ ...formData, touchpadCondition: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select condition...</option>
                                        {TOUCHPAD_CONDITIONS.map((cond) => (
                                            <option key={cond.value} value={cond.value}>
                                                {cond.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Battery */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        🔋 Battery Health
                                    </label>
                                    <select
                                        value={formData.batteryHealth}
                                        onChange={(e) => setFormData({ ...formData, batteryHealth: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select condition...</option>
                                        {BATTERY_HEALTH.map((health) => (
                                            <option key={health.value} value={health.value}>
                                                {health.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Step 3.5: Photo Upload */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-slate-900">📸 Photos (Optional)</h3>
                                <span className="text-xs text-slate-500">Max 15 photos</span>
                            </div>

                            {/* Photo Grid - 5 per row, small thumbnails */}
                            {photoPreviews.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {photoPreviews.map((preview, index) => (
                                        <div key={index} className="relative" style={{ width: '100px', height: '100px' }}>
                                            {/* Fixed size thumbnail */}
                                            <div
                                                onClick={() => setLightboxIndex(index)}
                                                className="relative w-full h-full rounded-lg overflow-hidden border-2 border-slate-300 cursor-pointer hover:border-blue-500 transition-all group"
                                            >
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                />
                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                    <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                                                </div>
                                            </div>

                                            {/* Delete button - ALWAYS VISIBLE */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removePhoto(index);
                                                }}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-20"
                                                title="Remove"
                                            >
                                                <X size={14} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Button */}
                            {photoFiles.length < 15 && (
                                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                                    <Camera className="text-slate-400" size={32} />
                                    <div className="text-center">
                                        <span className="text-sm font-medium text-slate-700 block">
                                            {photoFiles.length === 0 ? 'Click to add photos' : 'Add more photos'}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {photoFiles.length}/15 uploaded
                                        </span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>

                        {/* Step 4: Notes (Optional) */}
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-3">4. Additional Notes (Optional)</h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        General Notes
                                    </label>
                                    <textarea
                                        value={formData.overallNotes}
                                        onChange={(e) => setFormData({ ...formData, overallNotes: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={2}
                                        placeholder="Any observations..."
                                    />
                                </div>

                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <label className="block text-sm font-medium text-red-700 mb-2">
                                        ⚠️ Damage Description (if any)
                                    </label>
                                    <textarea
                                        value={formData.damageDescription}
                                        onChange={(e) => setFormData({ ...formData, damageDescription: e.target.value })}
                                        className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        rows={2}
                                        placeholder="Describe any damage..."
                                    />

                                    {formData.damageDescription && (
                                        <div className="mt-2">
                                            <label className="block text-sm font-medium text-red-700 mb-2">
                                                Estimated Repair Cost (THB)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.estimatedCost}
                                                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                                                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="0.00"
                                                step="0.01"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedAsset}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-600/20"
                        >
                            {loading ? 'Creating...' : 'Create Inspection'}
                        </button>
                    </div>
                </form>
            </div>
            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99999,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex(null);
                        }}
                        style={{
                            position: 'fixed',
                            top: '16px',
                            right: '16px',
                            zIndex: 100000,
                            padding: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                    >
                        <X size={24} strokeWidth={2} />
                    </button>

                    <img
                        src={photoPreviews[lightboxIndex]}
                        alt={`Photo ${lightboxIndex + 1}`}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {lightboxIndex > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(lightboxIndex - 1);
                            }}
                            style={{
                                position: 'fixed',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 100000,
                                padding: '12px 16px',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '32px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                        >
                            ‹
                        </button>
                    )}

                    {lightboxIndex < photoPreviews.length - 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(lightboxIndex + 1);
                            }}
                            style={{
                                position: 'fixed',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 100000,
                                padding: '12px 16px',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '32px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                        >
                            ›
                        </button>
                    )}

                    <div
                        style={{
                            position: 'fixed',
                            bottom: '16px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 100000,
                            padding: '8px 16px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        {lightboxIndex + 1} / {photoPreviews.length}
                    </div>
                </div>
            )}

        </div>
    );
}
