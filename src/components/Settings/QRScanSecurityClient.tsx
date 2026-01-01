'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

interface SecuritySettings {
    scanPasscodeEnabled: boolean;
    lastUpdated: string | null;
    updatedBy: string | null;
}

export default function QRScanSecurityClient() {
    const [settings, setSettings] = useState<SecuritySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [showChangeModal, setShowChangeModal] = useState(false);

    // Form state
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const [showNewPasscode, setShowNewPasscode] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load settings
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings/security');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePasscode = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (newPasscode !== confirmPasscode) {
            Swal.fire({
                icon: 'error',
                title: 'Passcodes do not match',
                text: 'Please make sure both passcodes are identical'
            });
            return;
        }

        if (!/^[A-Za-z0-9]{6,20}$/.test(newPasscode)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid passcode format',
                text: 'Passcode must be 6-20 alphanumeric characters'
            });
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/settings/security/scan-passcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newPasscode
                })
            });

            const data = await res.json();

            if (res.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Passcode Updated',
                    text: 'Scan passcode has been updated successfully',
                    timer: 2000
                });

                // Reset form
                setNewPasscode('');
                setConfirmPasscode('');
                setShowChangeModal(false);

                // Reload settings
                fetchSettings();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: data.error || 'Failed to update passcode'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while updating the passcode'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* QR Scan Protection Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            QR Scan Protection
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Protect asset information accessed via QR codes
                        </p>
                    </div>
                </div>

                {/* Current Status */}
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-slate-700">Current Passcode</div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {settings?.lastUpdated ? (
                                        <>
                                            Last updated: {new Date(settings.lastUpdated).toLocaleDateString('en-GB')}
                                            {settings.updatedBy && ` by ${settings.updatedBy}`}
                                        </>
                                    ) : (
                                        'Using default passcode from environment'
                                    )}
                                </div>
                            </div>
                            <div className="text-2xl font-mono text-slate-400 tracking-wider">
                                ••••••••
                            </div>
                        </div>
                    </div>

                    {/* Change Passcode Button */}
                    <button
                        onClick={() => setShowChangeModal(true)}
                        className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Lock className="w-4 h-4" />
                        Change Passcode
                    </button>

                    {/* Info Box */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold mb-1">About QR Scan Protection</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800">
                                <li>Users must enter this passcode to view asset details via QR scan</li>
                                <li>Passcode session lasts for 20 minutes</li>
                                <li>Use 6-20 alphanumeric characters (A-Z, 0-9)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Passcode Modal */}
            {showChangeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">Change Scan Passcode</h3>
                                <button
                                    onClick={() => setShowChangeModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleChangePasscode} className="p-6 space-y-4">
                            {/* New Passcode */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    New Scan Passcode
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPasscode ? 'text' : 'password'}
                                        value={newPasscode}
                                        onChange={(e) => setNewPasscode(e.target.value)}
                                        className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                                        placeholder="Enter new passcode"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPasscode(!showNewPasscode)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">6-20 alphanumeric characters</p>
                            </div>

                            {/* Confirm Passcode */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Confirm New Passcode
                                </label>
                                <input
                                    type="password"
                                    value={confirmPasscode}
                                    onChange={(e) => setConfirmPasscode(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                                    placeholder="Re-enter new passcode"
                                    required
                                />
                                {confirmPasscode && newPasscode !== confirmPasscode && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <X className="w-3 h-3" />
                                        Passcodes do not match
                                    </p>
                                )}
                                {confirmPasscode && newPasscode === confirmPasscode && (
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        Passcodes match
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowChangeModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={submitting || newPasscode !== confirmPasscode}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Update Passcode
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
