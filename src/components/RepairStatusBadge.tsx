'use client';

type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'cannot_repair' | 'accepted_as_is';

interface RepairStatusBadgeProps {
    status: RepairStatus | null | undefined;
    className?: string;
}

export default function RepairStatusBadge({ status, className = '' }: RepairStatusBadgeProps) {
    if (!status) return null;

    const statusConfig = {
        pending: {
            label: 'Pending Repair',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-300',
            icon: '⏳'
        },
        in_progress: {
            label: 'Repair In Progress',
            bgColor: 'bg-primary/20',
            textColor: 'text-blue-800',
            borderColor: 'border-primary/60',
            icon: '🔧'
        },
        completed: {
            label: 'Repair Completed',
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-300',
            icon: '✅'
        },
        cannot_repair: {
            label: 'Cannot Repair',
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-300',
            icon: '❌'
        },
        accepted_as_is: {
            label: 'Accepted As-Is',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-300',
            icon: '✓'
        }
    };

    const config = statusConfig[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
        >
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}
