'use client';

import { useState, useEffect } from 'react';
import { Bell, Shield, Database, Save, Mail, Building2, Phone, Globe, TestTube, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getSettings, updateSetting, testEmailSettings } from '@/app/lib/settings-actions';

export default function SettingsPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
    const [lineNotify, setLineNotify] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // SMTP Settings
    const [smtpSettings, setSmtpSettings] = useState({
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_from: ''
    });

    // Load settings on mount
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
            setSmtpSettings(prev => ({ ...prev, ...settingsMap }));
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleTestEmail = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const result = await testEmailSettings({
                smtp_host: smtpSettings.smtp_host,
                smtp_port: smtpSettings.smtp_port,
                smtp_user: smtpSettings.smtp_user,
                smtp_password: smtpSettings.smtp_password
            });
            setTestResult({
                success: result.success,
                message: result.success
                    ? 'Test email sent successfully! Check your inbox.'
                    : result.error || 'Failed to send test email'
            });
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.message || 'Connection failed'
            });
        } finally {
            setIsTesting(false);
            setTimeout(() => setTestResult(null), 8000);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSetting('smtp_host', smtpSettings.smtp_host);
            await updateSetting('smtp_port', smtpSettings.smtp_port);
            await updateSetting('smtp_user', smtpSettings.smtp_user);
            if (smtpSettings.smtp_password) {
                await updateSetting('smtp_password', smtpSettings.smtp_password, true);
            }
            await updateSetting('smtp_from', smtpSettings.smtp_from);
            alert('✅ Settings saved successfully!');
        } catch (error: any) {
            alert('❌ ' + (error.message || 'Failed to save settings'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                        <Shield className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
                        <p className="text-slate-500">Configure system preferences and notifications</p>
                    </div>
                </div>
            </div>

            {/* Organization Profile */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <Building2 className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">Organization Profile</h2>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">School Name</label>
                        <input
                            type="text"
                            defaultValue="International School Bangkok"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    defaultValue="it-support@school.ac.th"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    defaultValue="02-123-4567"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <Bell className="text-amber-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <ToggleSwitch
                        label="Email Alerts (Borrowing)"
                        description="Receive notifications when assets are borrowed or returned"
                        checked={emailAlerts}
                        onChange={setEmailAlerts}
                    />
                    <ToggleSwitch
                        label="Email Alerts (Maintenance Due)"
                        description="Get reminders for upcoming maintenance schedules"
                        checked={maintenanceAlerts}
                        onChange={setMaintenanceAlerts}
                    />
                    <ToggleSwitch
                        label="LINE Notify Integration"
                        description="Send notifications via LINE messaging platform"
                        checked={lineNotify}
                        onChange={setLineNotify}
                    />
                </div>
            </div>

            {/* Email Settings (SMTP) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center gap-3">
                        <Mail className="text-blue-600" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Email Settings (SMTP)</h2>
                            <p className="text-sm text-slate-500">Configure email delivery for assignment notifications</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Host</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="smtp.gmail.com"
                                value={smtpSettings.smtp_host}
                                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Port</label>
                            <input
                                type="text"
                                value={smtpSettings.smtp_port}
                                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_port: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP User</label>
                            <input
                                type="email"
                                placeholder="your-email@gmail.com"
                                value={smtpSettings.smtp_user}
                                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_user: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">SMTP Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••••••••"
                                value={smtpSettings.smtp_password}
                                onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_password: e.target.value })}
                                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            For Gmail: <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-blue-600 hover:underline font-medium">Create App Password →</a>
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">From Address</label>
                        <input
                            type="text"
                            placeholder="School Asset Management <noreply@school.edu>"
                            value={smtpSettings.smtp_from}
                            onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_from: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {testResult && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            {testResult.success ? (
                                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                            ) : (
                                <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            )}
                            <div>
                                <p className={`font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                    {testResult.message}
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleTestEmail}
                        disabled={isTesting || !smtpSettings.smtp_host || !smtpSettings.smtp_user}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isTesting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Testing Connection...
                            </>
                        ) : (
                            <>
                                <TestTube size={18} />
                                Test Email Connection
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* System Maintenance */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <Database className="text-purple-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">System Maintenance</h2>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                            <p className="font-semibold text-slate-900">Backup Database</p>
                            <p className="text-sm text-slate-500 mt-1">Last backup: 2 hours ago</p>
                        </div>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
                            <Database size={18} />
                            Download Backup
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-4 -mx-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Save All Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function ToggleSwitch({ label, description, checked, onChange }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex-1">
                <p className="font-semibold text-slate-900">{label}</p>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-14 h-7 rounded-full transition-all duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
            >
                <div
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200 ${checked ? 'left-7' : 'left-0.5'
                        }`}
                />
            </button>
        </div>
    );
}
