'use client';

import { Key, AlertCircle } from 'lucide-react';
import { LICENSES_MOCK } from '@/data/it-mock';

export default function LicensesPage() {
    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Software Licenses</h1>
                <p>Track software subscriptions, seats, and costs.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {LICENSES_MOCK.map((license) => {
                    const usagePercent = Math.round((license.used / license.seats) * 100);
                    const isFull = usagePercent >= 90;

                    return (
                        <div key={license.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.6rem', borderRadius: '8px', background: 'hsl(var(--secondary)/0.1)', color: 'hsl(var(--secondary))' }}>
                                        <Key size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.1rem' }}>{license.software}</h3>
                                        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{license.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div className="flex-between" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    <span>Usage ({usagePercent}%)</span>
                                    <span style={{ color: 'hsl(var(--text-secondary))' }}>{license.used} / {license.seats} seats</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'hsl(var(--input-bg))', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${usagePercent}%`,
                                        height: '100%',
                                        background: isFull ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
                                        transition: 'width 0.5s ease'
                                    }}></div>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border))' }}>
                                <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Renew: {license.expiry}</span>
                                    <span style={{ fontWeight: 600 }}>{license.cost}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
