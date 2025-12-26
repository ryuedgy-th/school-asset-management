'use client';

import { useState, useEffect } from 'react';
import { Mail, Save, TestTube, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { getSettings, updateSetting, testEmailSettings } from '@/app/lib/settings-actions';

export default function EmailSettingsClient() {
    const [settings, setSettings] = useState({
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_from: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getSettings('email');
            const settingsMap: any = {};
            data.forEach((s: any) => {
                settingsMap[s.key] = s.value || '';
            });
            setSettings(prev => ({ ...prev, ...settingsMap }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSetting('smtp_host', settings.smtp_host);
            await updateSetting('smtp_port', settings.smtp_port);
            await updateSetting('smtp_user', settings.smtp_user);
            await updateSetting('smtp_password', settings.smtp_password, true); // Encrypted
            await updateSetting('smtp_from', settings.smtp_from);
            alert('Settings saved successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const result = await testEmailSettings();
            setTestResult(result);
        } catch (error: any) {
            setTestResult({ success: false, error: error.message });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Mail className="text-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Email Settings (SMTP)</h2>
                            <p className="text-sm text-slate-500">Configure email delivery for assignment notifications</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Host</label>
                        <input
                            type="text"
                            value={settings.smtp_host}
                            onChange={e => setSettings({ ...settings, smtp_host: e.target.value })}
                            placeholder="smtp.gmail.com"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Port</label>
                        <input
                            type="text"
                            value={settings.smtp_port}
                            onChange={e => setSettings({ ...settings, smtp_port: e.target.value })}
                            placeholder="587"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Username (Email)</label>
                        <input
                            type="email"
                            value={settings.smtp_user}
                            onChange={e => setSettings({ ...settings, smtp_user: e.target.value })}
                            placeholder="your-email@gmail.com"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Password (App Password)</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={settings.smtp_password}
                                onChange={e => setSettings({ ...settings, smtp_password: e.target.value })}
                                placeholder="••••••••••••••••"
                                className="w-full px-4 py-2 pr-12 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            For Gmail: <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-primary hover:underline">Create App Password</a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">From Address</label>
                        <input
                            type="text"
                            value={settings.smtp_from}
                            onChange={e => setSettings({ ...settings, smtp_from: e.target.value })}
                            placeholder="School Asset <your-email@gmail.com>"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none"
                        />
                    </div>

                    {testResult && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            {testResult.success ? (
                                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                            ) : (
                                <XCircle className="text-red-600 flex-shrink-0" size={20} />
                            )}
                            <div>
                                <p className={`font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                    {testResult.success ? 'Test Email Sent!' : 'Test Failed'}
                                </p>
                                {testResult.error && (
                                    <p className="text-sm text-red-700 mt-1">{testResult.error}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <button
                        onClick={handleTest}
                        disabled={isTesting || !settings.smtp_host || !settings.smtp_user}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <TestTube size={18} />
                        {isTesting ? 'Testing...' : 'Test Email'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
