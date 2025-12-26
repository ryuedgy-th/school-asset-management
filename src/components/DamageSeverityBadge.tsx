'use client';

type DamageSeverity = 'minor' | 'moderate' | 'severe';

interface DamageSeverityBadgeProps {
    severity: DamageSeverity | null | undefined;
    className?: string;
}

export default function DamageSeverityBadge({ severity, className = '' }: DamageSeverityBadgeProps) {
    if (!severity) return null;

    const severityConfig = {
        minor: {
            label: 'Minor Damage',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-300',
            icon: '⚠️'
        },
        moderate: {
            label: 'Moderate Damage',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-300',
            icon: '⚠️'
        },
        severe: {
            label: 'Severe Damage',
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-300',
            icon: '🔴'
        }
    };

    const config = severityConfig[severity];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
        >
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}
