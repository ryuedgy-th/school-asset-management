'use client';

import { useState } from 'react';
import SLASettingsClient from '@/components/Settings/SLASettingsClient';
import NumberingConfigClient from '@/components/Settings/NumberingConfigClient';
import QRScanSecurityClient from '@/components/Settings/QRScanSecurityClient';
import { Settings as SettingsIcon, Clock, Hash, Shield } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'sla' | 'numbering' | 'qr-security'>('sla');

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
        },
        {
            id: 'qr-security' as const,
            label: 'QR Scan Protection',
            icon: Shield,
            component: QRScanSecurityClient
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
            <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 w-fit">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Active Tab Content */}
            <div>
                {ActiveComponent && <ActiveComponent />}
            </div>
        </div>
    );
}
