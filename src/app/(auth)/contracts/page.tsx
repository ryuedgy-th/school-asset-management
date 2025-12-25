'use client';

import { FileText, Download, Building } from 'lucide-react';
import { CONTRACTS_MOCK } from '@/data/admin-mock';

export default function ContractsPage() {
    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1>Contracts</h1>
                <p>Manage vendor contracts, leases, and service agreements.</p>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {CONTRACTS_MOCK.map((contract) => (
                    <div key={contract.id} className="card flex-between" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                padding: '0.75rem',
                                background: contract.type === 'Lease' ? 'hsl(var(--primary)/0.1)' : 'hsl(var(--accent)/0.1)',
                                borderRadius: '8px',
                                color: contract.type === 'Lease' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'
                            }}>
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{contract.title}</h3>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <Building size={14} /> {contract.partner}
                                    </span>
                                    <span>•</span>
                                    <span>{contract.startDate} - {contract.endDate}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{contract.value}</div>
                                <div
                                    className="badge"
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '0.25rem',
                                        background: contract.status === 'Active' ? 'hsl(var(--success)/0.1)' : 'hsl(var(--warning)/0.1)',
                                        color: contract.status === 'Active' ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                                    }}
                                >
                                    {contract.status}
                                </div>
                            </div>
                            <button className="btn btn-secondary" title="Download PDF">
                                <Download size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
