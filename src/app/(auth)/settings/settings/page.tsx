'use client';

import { useState } from 'react';
import SLASettingsClient from '@/components/Settings/SLASettingsClient';
import NumberingConfigClient from '@/components/Settings/NumberingConfigClient';
import { Settings as SettingsIcon, Clock, Hash } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'sla' | 'numbering'>('sla');

    const tabs = [
        {
            id: 'sla' as const,
            label: 'SLA Configuration',
            icon: Clock,
            component: SLASettingsClient
        },
        {
            id: 'numbering' as const,
            label: 'Numbering Format',
            icon: Hash,
            component: NumberingConfigClient
        }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <SettingsIcon className="text-slate-600" size={32} />
                    <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
                </div>
                <p className="text-slate-500">Configure system-wide settings and preferences</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex gap-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Active Tab Content */}
            <div>
                {ActiveComponent && <ActiveComponent />}
            </div>
        </div>
    );
}
