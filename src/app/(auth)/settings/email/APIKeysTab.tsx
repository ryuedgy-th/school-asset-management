'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, TestTube, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface OAuthConfig {
    googleClientId: string;
    googleClientSecret: string;
}

export default function APIKeysTab() {
    const [config, setConfig] = useState<OAuthConfig>({
        googleClientId: '',
        googleClientSecret: ''
    });
    const [showSecrets, setShowSecrets] = useState({
        clientSecret: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/settings/oauth-config');
            const data = await res.json();

            if (res.status === 403) {
                setPermissionDenied(true);
                setLoading(false);
                return;
            }

            if (data.error) {
                console.error('Error fetching config:', data.error);
            } else {
                setConfig(data);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/settings/oauth-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await res.json();
            if (res.ok) {
                setTestResult({ success: true, message: 'Configuration saved successfully!' });
                // Refresh to get masked values
                fetchConfig();
            } else {
                setTestResult({ success: false, message: data.error || 'Failed to save configuration' });
            }
        } catch (error) {
            setTestResult({ success: false, message: 'Failed to save configuration' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/settings/oauth-config/test');
            const data = await res.json();
            setTestResult({ success: res.ok, message: data.message || data.error });
        } catch (error) {
            setTestResult({ success: false, message: 'Test failed' });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading configuration...</p>
                </div>
            </div>
        );
    }

    // Permission Denied UI
    if (permissionDenied) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h3>
                    <p className="text-slate-600 mb-6">
                        You don't have permission to view or manage API Keys. This feature is restricted to administrators only.
                    </p>
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-left">
                        <p className="text-sm text-primary">
                            <strong>Need access?</strong> Contact your system administrator to request the <code className="px-2 py-0.5 bg-primary/10 rounded">settings.edit</code> permission.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Result Alert */}
            {testResult && (
                <div className={`p-4 rounded-xl border ${testResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-start gap-3">
                        {testResult.success ? (
                            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                            {testResult.message}
                        </p>
                    </div>
                </div>
            )}

            {/* Google OAuth Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start gap-4 mb-6">
                    {/* Google Logo */}
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Google OAuth Configuration</h3>
                        <p className="text-sm text-slate-600">
                            Configure Google OAuth for NextAuth login and Gmail API integration
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Client ID */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Google Client ID
                        </label>
                        <input
                            type="text"
                            value={config.googleClientId}
                            onChange={(e) => setConfig({ ...config, googleClientId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                            placeholder="xxxxx.apps.googleusercontent.com"
                        />
                    </div>

                    {/* Client Secret */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Google Client Secret
                        </label>
                        <div className="relative">
                            <input
                                type={showSecrets.clientSecret ? 'text' : 'password'}
                                value={config.googleClientSecret}
                                onChange={(e) => setConfig({ ...config, googleClientSecret: e.target.value })}
                                className="w-full px-4 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                                placeholder="GOCSPX-xxxxx"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecrets({ ...showSecrets, clientSecret: !showSecrets.clientSecret })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showSecrets.clientSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Values are encrypted in the database for security
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                        onClick={handleTest}
                        disabled={testing || !config.googleClientId}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {testing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                Testing...
                            </>
                        ) : (
                            <>
                                <TestTube size={18} />
                                Test Connection
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !config.googleClientId || !config.googleClientSecret}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Important:</strong> After saving, you must restart the development server for changes to take effect.
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                        Run: <code className="px-2 py-0.5 bg-yellow-100 rounded">npm run dev</code> (or restart your server)
                    </p>
                </div>
            </div>

            {/* Google Cloud Console Setup Guide */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                    <Key size={24} className="text-primary flex-shrink-0" />
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Setup Guide</h3>
                        <p className="text-sm text-slate-600">Follow these steps to configure Google OAuth</p>
                    </div>
                </div>

                <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700">
                    <li className="pl-2">
                        Go to{' '}
                        <a
                            href="https://console.cloud.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                            Google Cloud Console
                            <ExternalLink size={14} />
                        </a>
                    </li>
                    <li className="pl-2">Create a new project or select an existing one</li>
                    <li className="pl-2">
                        Enable the following APIs:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                            <li>Google+ API (for login)</li>
                            <li>Gmail API (for email sending)</li>
                        </ul>
                    </li>
                    <li className="pl-2">Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"</li>
                    <li className="pl-2">
                        Add authorized redirect URIs:
                        <div className="mt-2 p-2 bg-white rounded border border-slate-200 font-mono text-xs">
                            http://localhost:3000/api/auth/callback/google<br />
                            https://yourdomain.com/api/auth/callback/google
                        </div>
                    </li>
                    <li className="pl-2">Copy the Client ID and Client Secret and paste them above</li>
                    <li className="pl-2">Click "Save Changes" to store the configuration</li>
                </ol>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                        ⚠️ <strong>Security:</strong> Never commit these credentials to version control. They are encrypted in the database.
                    </p>
                </div>
            </div>
        </div>
    );
}
