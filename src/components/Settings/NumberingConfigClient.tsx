'use client';

import { useState, useEffect } from 'react';
import { Hash, Save, AlertCircle, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';

interface NumberingConfig {
    id: number;
    module: string;
    prefix: string;
    includeYear: boolean;
    includeMonth: boolean;
    sequenceDigits: number;
    separator: string;
    resetAnnually: boolean;
    exampleOutput: string | null;
}

interface ModuleInfo {
    module: string;
    label: string;
    description: string;
    color: string;
}

const moduleInfoMap: ModuleInfo[] = [
    {
        module: 'assets',
        label: 'IT Assets',
        description: 'IT equipment and devices',
        color: 'blue'
    },
    {
        module: 'tickets',
        label: 'Tickets',
        description: 'Service requests and incidents',
        color: 'purple'
    },
    {
        module: 'inspections',
        label: 'Inspections',
        description: 'Asset inspection records',
        color: 'green'
    },
    {
        module: 'assignments',
        label: 'Assignments',
        description: 'Equipment borrowing assignments',
        color: 'orange'
    },
    {
        module: 'fm_assets',
        label: 'FM Assets',
        description: 'Facility management assets',
        color: 'cyan'
    }
];

export default function NumberingConfigClient() {
    const [configs, setConfigs] = useState<NumberingConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/settings/numbering');
            if (response.ok) {
                const data = await response.json();
                setConfigs(data);
            } else {
                throw new Error('Failed to fetch numbering configurations');
            }
        } catch (error) {
            console.error('Error fetching numbering configs:', error);
            setMessage({ type: 'error', text: 'Failed to load numbering configurations' });
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        try {
            setInitializing(true);
            setMessage(null);

            const response = await fetch('/api/settings/numbering', {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                setConfigs(data);
                setMessage({ type: 'success', text: 'Default configurations initialized successfully!' });
                setTimeout(() => setMessage(null), 5000);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to initialize');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to initialize configurations' });
        } finally {
            setInitializing(false);
        }
    };

    const handleSave = async (module: string) => {
        try {
            setSaving(true);
            setMessage(null);

            const config = configs.find(c => c.module === module);
            if (!config) return;

            const response = await fetch('/api/settings/numbering', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                const updated = await response.json();
                setConfigs(configs.map(c => c.module === module ? updated : c));
                setMessage({ type: 'success', text: `${getModuleLabel(module)} configuration updated successfully!` });
                setTimeout(() => setMessage(null), 5000);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update configuration' });
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (module: string, field: keyof NumberingConfig, value: any) => {
        setConfigs(configs.map(config => {
            if (config.module === module) {
                const updated = { ...config, [field]: value };

                // Generate preview
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const seq = '1'.padStart(updated.sequenceDigits, '0');

                let exampleParts = [updated.prefix];
                if (updated.includeYear) {
                    if (updated.includeMonth) {
                        exampleParts.push(`${year}${updated.separator}${month}`);
                    } else {
                        exampleParts.push(String(year));
                    }
                }
                exampleParts.push(seq);
                updated.exampleOutput = exampleParts.join(updated.separator);

                return updated;
            }
            return config;
        }));
    };

    const getModuleLabel = (module: string) => {
        return moduleInfoMap.find(m => m.module === module)?.label || module;
    };

    const getModuleInfo = (module: string) => {
        return moduleInfoMap.find(m => m.module === module);
    };

    const getColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-50 border-blue-200 text-blue-800',
            purple: 'bg-purple-50 border-purple-200 text-purple-800',
            green: 'bg-green-50 border-green-200 text-green-800',
            orange: 'bg-orange-50 border-orange-200 text-orange-800',
            cyan: 'bg-cyan-50 border-cyan-200 text-cyan-800'
        };
        return colors[color] || colors.blue;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin text-primary" size={24} />
                    <span className="ml-2 text-slate-600">Loading numbering configurations...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Hash className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Numbering Configuration</h2>
                        <p className="text-sm text-slate-500">
                            Configure auto-generated numbering formats for different modules
                        </p>
                    </div>
                </div>
                {configs.length === 0 && (
                    <button
                        onClick={handleInitialize}
                        disabled={initializing}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                    >
                        {initializing ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Initializing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Initialize Defaults
                            </>
                        )}
                    </button>
                )}
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

            {configs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <Hash className="mx-auto mb-3 text-slate-400" size={48} />
                    <p className="text-lg font-medium">No configurations found</p>
                    <p className="text-sm mt-1">Click "Initialize Defaults" to create default configurations for all modules</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {moduleInfoMap.map(moduleInfo => {
                        const config = configs.find(c => c.module === moduleInfo.module);
                        if (!config) return null;

                        return (
                            <div
                                key={moduleInfo.module}
                                className={`border rounded-lg p-6 ${getColorClasses(moduleInfo.color)}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold">{moduleInfo.label}</h3>
                                        <p className="text-sm opacity-70">{moduleInfo.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs opacity-70 mb-1">Preview:</div>
                                        <div className="font-mono font-bold text-lg">
                                            {config.exampleOutput || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Prefix</label>
                                        <input
                                            type="text"
                                            value={config.prefix}
                                            onChange={(e) => updateConfig(moduleInfo.module, 'prefix', e.target.value.toUpperCase())}
                                            className="w-full px-3 py-2 border border-current rounded-lg bg-white/50 focus:ring-2 focus:ring-current/20"
                                            placeholder="IT"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Separator</label>
                                        <input
                                            type="text"
                                            maxLength={1}
                                            value={config.separator}
                                            onChange={(e) => updateConfig(moduleInfo.module, 'separator', e.target.value)}
                                            className="w-full px-3 py-2 border border-current rounded-lg bg-white/50 focus:ring-2 focus:ring-current/20"
                                            placeholder="-"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Sequence Digits</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={6}
                                            value={config.sequenceDigits}
                                            onChange={(e) => updateConfig(moduleInfo.module, 'sequenceDigits', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-current rounded-lg bg-white/50 focus:ring-2 focus:ring-current/20"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.includeYear}
                                            onChange={(e) => updateConfig(moduleInfo.module, 'includeYear', e.target.checked)}
                                            className="w-4 h-4 rounded border-current text-current focus:ring-current"
                                        />
                                        <span className="text-sm font-medium">Include Year</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.includeMonth}
                                            onChange={(e) => updateConfig(moduleInfo.module, 'includeMonth', e.target.checked)}
                                            className="w-4 h-4 rounded border-current text-current focus:ring-current"
                                        />
                                        <span className="text-sm font-medium">Include Month</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.resetAnnually}
                                            onChange={(e) => updateConfig(moduleInfo.module, 'resetAnnually', e.target.checked)}
                                            className="w-4 h-4 rounded border-current text-current focus:ring-current"
                                        />
                                        <span className="text-sm font-medium">Reset Annually</span>
                                    </label>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleSave(moduleInfo.module)}
                                        disabled={saving}
                                        className="px-4 py-2 bg-white border border-current text-current rounded-lg hover:bg-current hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Save
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Important Notes:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Changes will apply to newly generated codes only</li>
                            <li>Existing codes will not be modified</li>
                            <li>Preview shows what the next generated code will look like</li>
                            <li>Reset Annually option will restart sequence at 1 each year</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
