'use client';

import { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface SLASettings {
    urgent: number;
    high: number;
    medium: number;
    low: number;
    atRiskThreshold: number;
}

export default function SLASettingsClient() {
    const [settings, setSettings] = useState<SLASettings>({
        urgent: 2,
        high: 8,
        medium: 24,
        low: 72,
        atRiskThreshold: 20,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/settings/sla');
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            } else {
                throw new Error('Failed to fetch SLA settings');
            }
        } catch (error) {
            console.error('Error fetching SLA settings:', error);
            setMessage({ type: 'error', text: 'Failed to load SLA settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);

            const response = await fetch('/api/settings/sla', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'SLA settings updated successfully!' });
                setTimeout(() => setMessage(null), 5000);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update settings');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update SLA settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof SLASettings, value: string) => {
        const numValue = parseInt(value) || 0;
        setSettings({ ...settings, [field]: numValue });
    };

    const handleReset = () => {
        setSettings({
            urgent: 2,
            high: 8,
            medium: 24,
            low: 72,
            atRiskThreshold: 20,
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin text-primary" size={24} />
                    <span className="ml-2 text-slate-600">Loading SLA settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="text-blue-600" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">SLA Configuration</h2>
                    <p className="text-sm text-slate-500">
                        Configure Service Level Agreement response times for different priority levels
                    </p>
                </div>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                        message.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                    }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                    ) : (
                        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    )}
                    <p
                        className={`text-sm ${
                            message.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}
                    >
                        {message.text}
                    </p>
                </div>
            )}

            {/* Priority SLA Settings */}
            <div className="space-y-6">
                <div className="grid gap-6">
                    {/* Urgent Priority */}
                    <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-red-800">URGENT</span>
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                    Critical Issues
                                </span>
                            </div>
                            <p className="text-xs text-red-600">
                                System down, critical hardware failure, data loss
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                value={settings.urgent}
                                onChange={(e) => handleInputChange('urgent', e.target.value)}
                                className="w-20 px-3 py-2 border border-red-300 rounded-lg text-center font-semibold text-red-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            />
                            <span className="text-sm text-red-700 font-medium">hours</span>
                        </div>
                    </div>

                    {/* High Priority */}
                    <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-orange-800">HIGH</span>
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                    Major Issues
                                </span>
                            </div>
                            <p className="text-xs text-orange-600">
                                Significant impact on productivity, major malfunctions
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                value={settings.high}
                                onChange={(e) => handleInputChange('high', e.target.value)}
                                className="w-20 px-3 py-2 border border-orange-300 rounded-lg text-center font-semibold text-orange-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                            <span className="text-sm text-orange-700 font-medium">hours</span>
                        </div>
                    </div>

                    {/* Medium Priority */}
                    <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-yellow-800">MEDIUM</span>
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                    Moderate Issues
                                </span>
                            </div>
                            <p className="text-xs text-yellow-600">
                                Minor impact, workarounds available, non-critical repairs
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                value={settings.medium}
                                onChange={(e) => handleInputChange('medium', e.target.value)}
                                className="w-20 px-3 py-2 border border-yellow-300 rounded-lg text-center font-semibold text-yellow-900 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                            />
                            <span className="text-sm text-yellow-700 font-medium">hours</span>
                        </div>
                    </div>

                    {/* Low Priority */}
                    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-blue-800">LOW</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    Minor Issues
                                </span>
                            </div>
                            <p className="text-xs text-blue-600">
                                Cosmetic issues, requests, routine maintenance
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                value={settings.low}
                                onChange={(e) => handleInputChange('low', e.target.value)}
                                className="w-20 px-3 py-2 border border-blue-300 rounded-lg text-center font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <span className="text-sm text-blue-700 font-medium">hours</span>
                        </div>
                    </div>
                </div>

                {/* At Risk Threshold */}
                <div className="pt-6 border-t border-slate-200">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-900 mb-1">
                                At Risk Threshold
                            </h3>
                            <p className="text-xs text-slate-600">
                                Tickets are marked as "At Risk" when remaining time falls below this percentage
                                of total SLA time. For example, 20% means a 24-hour ticket will be "At Risk"
                                with less than 4.8 hours remaining.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={settings.atRiskThreshold}
                                onChange={(e) => handleInputChange('atRiskThreshold', e.target.value)}
                                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            <span className="text-sm text-slate-700 font-medium">%</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        Reset to Defaults
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={fetchSettings}
                            disabled={loading || saving}
                            className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={16} className="inline mr-2" />
                            Reload
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Important Notes:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Changes take effect immediately for all new tickets</li>
                            <li>Existing tickets retain their original SLA deadlines</li>
                            <li>Cron job will use updated thresholds for status checks</li>
                            <li>All times are in hours (1 day = 24 hours, 3 days = 72 hours)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
