'use client';

import { Key } from 'lucide-react';
import { LICENSES_MOCK } from '@/data/it-mock';

export default function LicensesTab({ licenses, setLicenses }: { licenses: any[]; setLicenses: (licenses: any[]) => void }) {
    // Use mock data for now
    const licensesData = LICENSES_MOCK;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {licensesData.map((license) => {
                const usagePercent = Math.round((license.used / license.seats) * 100);
                const isFull = usagePercent >= 90;

                return (
                    <div key={license.id} className="card bg-white rounded-xl border border-slate-200 shadow-sm p-6" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="flex-between" style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                                    <Key size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900" style={{ marginBottom: '0.1rem' }}>{license.software}</h3>
                                    <span className="text-xs text-slate-500">{license.type}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div className="flex-between text-sm" style={{ marginBottom: '0.5rem' }}>
                                <span className="text-slate-700">Usage ({usagePercent}%)</span>
                                <span className="text-slate-500">{license.used} / {license.seats} seats</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div style={{
                                    width: `${usagePercent}%`,
                                    height: '100%',
                                    background: isFull ? '#f59e0b' : 'var(--primary)',
                                    transition: 'width 0.5s ease'
                                }}></div>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100">
                            <div className="flex-between text-sm">
                                <span className="text-slate-500">Renew: {license.expiry}</span>
                                <span className="font-semibold text-slate-900">{license.cost}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
