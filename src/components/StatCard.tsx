'use client';

import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    Package,
    ShoppingBag,
    CheckCircle2,
    Wrench,
    LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
    Package,
    ShoppingBag,
    CheckCircle2,
    Wrench,
};

interface StatCardProps {
    title: string;
    value: string | number;
    iconName: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    iconBgColor?: string;
    iconColor?: string;
}

export default function StatCard({
    title,
    value,
    iconName,
    trend,
    iconBgColor = 'bg-gray-100 dark:bg-gray-800',
    iconColor = 'text-gray-800 dark:text-white/90',
}: StatCardProps) {
    const Icon = iconMap[iconName];

    if (!Icon) {
        console.error(`Icon "${iconName}" not found in iconMap`);
        return null;
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            {/* Icon */}
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBgColor)}>
                <Icon className={cn('h-6 w-6', iconColor)} />
            </div>

            {/* Content */}
            <div className="mt-5 flex items-end justify-between">
                <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {title}
                    </span>
                    <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                        {value}
                    </h4>
                </div>

                {/* Trend Badge */}
                {trend && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium',
                            trend.isPositive
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-500'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-500'
                        )}
                    >
                        {trend.isPositive ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
        </div>
    );
}
