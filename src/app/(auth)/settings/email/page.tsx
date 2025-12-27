'use client';

import { useState } from 'react';
import { Mail, FileText, Key, Users } from 'lucide-react';
import EmailAccountsTab from './EmailAccountsTab';
import EmailTemplatesTab from './EmailTemplatesTab';
import APIKeysTab from './APIKeysTab';
import NotificationRecipientsTab from './NotificationRecipientsTab';

type TabType = 'accounts' | 'templates' | 'api-keys' | 'recipients';

export default function EmailSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('accounts');

    const tabs = [
        { id: 'accounts' as TabType, label: 'Email Accounts', icon: Mail, description: 'SMTP & OAuth accounts' },
        { id: 'templates' as TabType, label: 'Templates', icon: FileText, description: 'Email templates' },
        { id: 'recipients' as TabType, label: 'Recipients', icon: Users, description: 'Notification recipients' },
        { id: 'api-keys' as TabType, label: 'API Keys', icon: Key, description: 'Google OAuth & Integration' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Email & Integration Settings</h1>
                <p className="text-slate-600 mt-2">Manage email accounts, templates, and API integrations</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
                <nav className="flex gap-8" role="tablist">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`
                                    flex items-center gap-2 pb-4 px-1 border-b-2 transition-all
                                    ${activeTab === tab.id
                                        ? 'border-primary text-primary font-semibold'
                                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                    }
                                `}
                            >
                                <Icon size={20} />
                                <div className="text-left">
                                    <div className="text-sm">{tab.label}</div>
                                    <div className="text-xs opacity-70">{tab.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div role="tabpanel">
                {activeTab === 'accounts' && <EmailAccountsTab />}
                {activeTab === 'templates' && <EmailTemplatesTab />}
                {activeTab === 'recipients' && <NotificationRecipientsTab />}
                {activeTab === 'api-keys' && <APIKeysTab />}
            </div>
        </div>
    );
}
