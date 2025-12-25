'use client';

import { Globe, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { DOMAINS_MOCK } from '@/data/it-mock';
import { cn } from '@/lib/utils';

export default function DomainsPage() {
    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Domains & SSL</h1>
                <p>Monitor domain expirations and SSL certificate status.</p>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'hsl(var(--input-bg))' }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Domain Name</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Registrar</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Expiry Date</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>SSL Status</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Auto-Renew</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DOMAINS_MOCK.map((domain) => {
                            const isExpiringSoon = new Date(domain.expiry) < new Date('2025-01-30'); // Mock logic
                            return (
                                <tr key={domain.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))' }}>
                                                <Globe size={18} />
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{domain.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>{domain.registrar}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ color: isExpiringSoon ? 'hsl(var(--error))' : 'inherit', fontWeight: isExpiringSoon ? 600 : 400 }}>
                                            {domain.expiry}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {domain.ssl === 'Active' ? <CheckCircle size={16} className="text-success" style={{ color: 'hsl(var(--success))' }} /> : <AlertTriangle size={16} style={{ color: 'hsl(var(--warning))' }} />}
                                            <span>{domain.ssl}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>Expires: {domain.sslExpiry}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span className={cn('badge')} style={{
                                            background: domain.autoRenew ? 'hsl(var(--success)/0.1)' : 'hsl(var(--text-tertiary)/0.1)',
                                            color: domain.autoRenew ? 'hsl(var(--success))' : 'hsl(var(--text-secondary))'
                                        }}>
                                            {domain.autoRenew ? 'On' : 'Off'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Manage</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
