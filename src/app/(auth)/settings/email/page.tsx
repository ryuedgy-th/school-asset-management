'use client';

import { useState } from 'react';
import { Mail, FileText, Users } from 'lucide-react';
import EmailAccountsTab from './EmailAccountsTab';
import EmailTemplatesTab from './EmailTemplatesTab';
import NotificationRecipientsTab from './NotificationRecipientsTab';

type TabType = 'accounts' | 'templates' | 'recipients';

export default function EmailSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('accounts');

    const tabs = [
        { id: 'accounts' as TabType, label: 'Email Accounts', icon: Mail, description: 'SMTP & OAuth accounts' },
        { id: 'templates' as TabType, label: 'Templates', icon: FileText, description: 'Email templates' },
        { id: 'recipients' as TabType, label: 'Recipients', icon: Users, description: 'Notification recipients' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Email & Integration Settings</h1>
                <p className="text-slate-600 mt-2">Manage email accounts, templates, and API integrations</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 w-fit mb-6">
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
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div role="tabpanel">
                {activeTab === 'accounts' && <EmailAccountsTab />}
                {activeTab === 'templates' && <EmailTemplatesTab />}
                {activeTab === 'recipients' && <NotificationRecipientsTab />}
            </div>
        </div>
    );
}
