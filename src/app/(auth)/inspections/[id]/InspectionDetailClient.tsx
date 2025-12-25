'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

interface InspectionDetailClientProps {
    inspection: any;
}

export default function InspectionDetailClient({ inspection }: InspectionDetailClientProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const getConditionBadge = (condition: string | null) => {
        if (!condition) return null;
        const colors: Record<string, string> = {
            'no_damage': 'bg-green-100 text-green-800',
            'perfect': 'bg-green-100 text-green-800',
            'fully_functional': 'bg-green-100 text-green-800',
            'all_functional': 'bg-green-100 text-green-800',
            'normal': 'bg-green-100 text-green-800',
            'minor_wear': 'bg-yellow-100 text-yellow-800',
            'minor_scratches': 'bg-yellow-100 text-yellow-800',
            'moderate': 'bg-orange-100 text-orange-800',
            'replace_soon': 'bg-red-100 text-red-800',
            'cracked': 'bg-red-100 text-red-800',
            'non_functional': 'bg-red-100 text-red-800'
        };
        return colors[condition] || 'bg-gray-100 text-gray-800';
    };

    const formatCondition = (condition: string | null) => {
        if (!condition) return 'N/A';
        return condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const photoUrls = inspection.photoUrls ? JSON.parse(inspection.photoUrls as string) : [];

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxIndex(null);
            } else if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
                setLightboxIndex(lightboxIndex - 1);
            } else if (e.key === 'ArrowRight' && lightboxIndex < photoUrls.length - 1) {
                setLightboxIndex(lightboxIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, photoUrls.length]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/inspections" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Inspections
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Inspection Details</h1>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{inspection.asset.name}</h2>
                                <p className="text-blue-100 mt-1">Code: {inspection.asset.assetCode}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-blue-100">
                                    <Calendar size={16} />
                                    <span>{new Date(inspection.inspectionDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-blue-100 mt-1">
                                    <User size={16} />
                                    <span>{inspection.inspector.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Inspection Type */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">Inspection Type</h3>
                            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                                {formatCondition(inspection.inspectionType)}
                            </span>
                        </div>

                        {/* Condition Checks */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">Condition Assessment</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {inspection.exteriorCondition && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-600 mb-1">Exterior Casing</div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(inspection.exteriorCondition)}`}>
                                            {formatCondition(inspection.exteriorCondition)}
                                        </span>
                                    </div>
                                )}
                                {inspection.screenCondition && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-600 mb-1">Screen</div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(inspection.screenCondition)}`}>
                                            {formatCondition(inspection.screenCondition)}
                                        </span>
                                    </div>
                                )}
                                {inspection.keyboardCondition && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-600 mb-1">Keyboard</div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(inspection.keyboardCondition)}`}>
                                            {formatCondition(inspection.keyboardCondition)}
                                        </span>
                                    </div>
                                )}
                                {inspection.batteryHealth && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-600 mb-1">Battery Health</div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(inspection.batteryHealth)}`}>
                                            {formatCondition(inspection.batteryHealth)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Photos */}
                        {photoUrls.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">Photos ({photoUrls.length})</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {photoUrls.map((url: string, index: number) => (
                                        <div
                                            key={index}
                                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-blue-500 transition-all group"
                                            onClick={() => setLightboxIndex(index)}
                                        >
                                            <img
                                                src={url}
                                                alt={`Inspection photo ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {inspection.notes && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">Notes</h3>
                                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{inspection.notes}</p>
                            </div>
                        )}

                        {/* Damage Info */}
                        {inspection.damageFound && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
                                    <AlertTriangle size={20} />
                                    Damage Reported
                                </h3>
                                {inspection.damageDescription && (
                                    <p className="text-red-800 mb-2">{inspection.damageDescription}</p>
                                )}
                                {inspection.estimatedCost && (
                                    <p className="text-red-900 font-semibold">
                                        Estimated Cost: ฿{Number(inspection.estimatedCost).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
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
                        src={photoUrls[lightboxIndex]}
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

                    {lightboxIndex < photoUrls.length - 1 && (
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
                        {lightboxIndex + 1} / {photoUrls.length}
                    </div>
                </div>
            )}
        </div>
    );
}
