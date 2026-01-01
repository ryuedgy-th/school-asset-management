'use client';

import { Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { DOMAINS_MOCK } from '@/data/it-mock';
import { cn } from '@/lib/utils';

export default function DomainsTab({ domains, setDomains }: { domains: any[]; setDomains: (domains: any[]) => void }) {
    // Use mock data for now
    const domainsData = DOMAINS_MOCK;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Domain Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Registrar</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Expiry Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">SSL Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Auto-Renew</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {domainsData.map((domain) => {
                        const isExpiringSoon = new Date(domain.expiry) < new Date('2025-01-30');
                        return (
                            <tr key={domain.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                                            <Globe size={18} />
                                        </div>
                                        <span className="font-medium text-slate-900">{domain.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{domain.registrar}</td>
                                <td className="px-6 py-4">
                                    <div className={cn("text-sm", isExpiringSoon ? "text-red-600 font-semibold" : "text-slate-700")}>
                                        {domain.expiry}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {domain.ssl === 'Active' ? (
                                            <CheckCircle size={16} className="text-emerald-600" />
                                        ) : (
                                            <AlertTriangle size={16} className="text-amber-600" />
                                        )}
                                        <span className="text-sm text-slate-700">{domain.ssl}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">Expires: {domain.sslExpiry}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                        domain.autoRenew
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-slate-100 text-slate-600 border border-slate-200"
                                    )}>
                                        {domain.autoRenew ? 'On' : 'Off'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors">
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
