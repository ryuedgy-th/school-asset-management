import React from 'react';

interface DamageStatusBadgeProps {
    status: string | null;
}

export default function DamageStatusBadge({ status }: DamageStatusBadgeProps) {
    if (!status) return null;

    const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
        'pending_review': {
            label: 'Pending Review',
            color: 'bg-gray-100 text-gray-800 border-gray-300',
            icon: '⏳'
        },
        'quotation_received': {
            label: 'Quotation Received',
            color: 'bg-primary/20 text-blue-800 border-primary/60',
            icon: '📋'
        },
        'approved': {
            label: 'Approved',
            color: 'bg-green-100 text-green-800 border-green-300',
            icon: '✅'
        },
        'form_sent': {
            label: 'Form Sent',
            color: 'bg-purple-100 text-purple-800 border-purple-300',
            icon: '📧'
        },
        'completed': {
            label: 'Completed',
            color: 'bg-green-100 text-green-800 border-green-300',
            icon: '✔️'
        },
        'waived': {
            label: 'Waived',
            color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            icon: '🔄'
        }
    };

    const config = statusConfig[status] || {
        label: status,
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: '•'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}
