'use client';

import { useState } from 'react';
import { Key, Globe } from 'lucide-react';
import LicensesTab from './LicensesTab';
import DomainsTab from './DomainsTab';

export default function ITResourcesClient({
    licenses: initialLicenses,
    domains: initialDomains,
}: {
    licenses: any[];
    domains: any[];
}) {
    const [activeTab, setActiveTab] = useState<'licenses' | 'domains'>('licenses');
    const [licenses, setLicenses] = useState(initialLicenses);
    const [domains, setDomains] = useState(initialDomains);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/5 to-slate-50 p-4 md:p-8 pt-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-primary/20">
                            <Key className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">IT Resources</h1>
                            <p className="text-slate-500 mt-1">Manage software licenses and domains</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-slate-200 w-fit">
                        <button
                            onClick={() => setActiveTab('licenses')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                                activeTab === 'licenses'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Key size={18} />
                            <span>Software Licenses</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                activeTab === 'licenses' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {licenses.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('domains')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                                activeTab === 'domains'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Globe size={18} />
                            <span>Domains</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                activeTab === 'domains' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {domains.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'licenses' && (
                        <LicensesTab licenses={licenses} setLicenses={setLicenses} />
                    )}
                    {activeTab === 'domains' && (
                        <DomainsTab domains={domains} setDomains={setDomains} />
                    )}
                </div>
            </div>
        </div>
    );
}
