'use client';

import { useState } from 'react';
import { Building2, Shield } from 'lucide-react';
import DepartmentsTab from './DepartmentsTab';
import RolesTab from './RolesTab';

type TabType = 'departments' | 'roles';

export default function OrganizationSettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('departments');

    const tabs = [
        { id: 'departments' as TabType, label: 'Departments', icon: Building2, description: 'Manage departments' },
        { id: 'roles' as TabType, label: 'Roles & Permissions', icon: Shield, description: 'Manage roles' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Organization Settings</h1>
                <p className="text-slate-600 mt-2">Manage departments, roles, and permissions</p>
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
                {activeTab === 'departments' && <DepartmentsTab />}
                {activeTab === 'roles' && <RolesTab />}
            </div>
        </div>
    );
}
