'use client';

import { useEffect, useState } from 'react';
import {
    BarChart3,
    Clock,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Users,
    Filter,
    Calendar,
} from 'lucide-react';

interface TicketMetrics {
    statusDistribution: Array<{ status: string; count: number }>;
    priorityDistribution: Array<{ priority: string; count: number }>;
    slaDistribution: Array<{ status: string; count: number }>;
    categoryDistribution: Array<{ category: string; count: number }>;
    typeDistribution: Array<{ type: string; count: number }>;
    avgResolutionTime: number;
    slaComplianceRate: number;
    ticketsOverTime: Array<{ date: string; count: number }>;
    topAssignees: Array<{ assigneeId: number; assigneeName: string; count: number }>;
    summary: {
        total: number;
        open: number;
        inProgress: number;
        resolvedToday: number;
    };
}

export default function TicketMetricsPage() {
    const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30');

    useEffect(() => {
        fetchMetrics();
    }, [dateRange]);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tickets/metrics?range=${dateRange}`);
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading metrics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="container py-8">
                <div className="text-center text-slate-600">Failed to load metrics</div>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        open: 'bg-blue-500',
        assigned: 'bg-purple-500',
        in_progress: 'bg-yellow-500',
        resolved: 'bg-green-500',
        closed: 'bg-slate-500',
        cancelled: 'bg-red-500',
    };

    const priorityColors: Record<string, string> = {
        urgent: 'bg-red-500',
        high: 'bg-orange-500',
        medium: 'bg-yellow-500',
        low: 'bg-blue-500',
    };

    const slaColors: Record<string, string> = {
        within_sla: 'bg-green-500',
        at_risk: 'bg-yellow-500',
        breached: 'bg-red-500',
    };

    return (
        <div className="container py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <BarChart3 className="text-primary" size={32} />
                        Ticket Metrics Dashboard
                    </h1>
                    <p className="text-slate-600 mt-2">Performance analytics and insights</p>
                </div>

                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-slate-600" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/80 outline-none bg-white"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="60">Last 60 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">Total Tickets</h3>
                        <BarChart3 size={20} className="opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{metrics.summary.total}</p>
                    <p className="text-xs opacity-75 mt-1">All time</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">Open Tickets</h3>
                        <AlertTriangle size={20} className="opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{metrics.summary.open}</p>
                    <p className="text-xs opacity-75 mt-1">Awaiting assignment</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">In Progress</h3>
                        <TrendingUp size={20} className="opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{metrics.summary.inProgress}</p>
                    <p className="text-xs opacity-75 mt-1">Being worked on</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium opacity-90">Resolved Today</h3>
                        <CheckCircle2 size={20} className="opacity-80" />
                    </div>
                    <p className="text-3xl font-bold">{metrics.summary.resolvedToday}</p>
                    <p className="text-xs opacity-75 mt-1">Completed today</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Clock className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-600">Avg Resolution Time</h3>
                            <p className="text-2xl font-bold text-slate-900">
                                {metrics.avgResolutionTime} <span className="text-sm font-normal text-slate-600">hours</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        Based on {metrics.ticketsOverTime.reduce((sum, t) => sum + t.count, 0)} resolved tickets in selected period
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="text-green-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-600">SLA Compliance Rate</h3>
                            <p className="text-2xl font-bold text-slate-900">
                                {metrics.slaComplianceRate}%
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        Percentage of tickets resolved within SLA deadline
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Status Distribution</h3>
                    <div className="space-y-3">
                        {metrics.statusDistribution.map((item) => (
                            <div key={item.status}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-slate-700 capitalize">{item.status.replace('_', ' ')}</span>
                                    <span className="font-semibold text-slate-900">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${statusColors[item.status] || 'bg-slate-400'}`}
                                        style={{
                                            width: `${(item.count / metrics.summary.total) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Priority Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Priority Distribution</h3>
                    <div className="space-y-3">
                        {metrics.priorityDistribution.map((item) => (
                            <div key={item.priority}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-slate-700 capitalize">{item.priority}</span>
                                    <span className="font-semibold text-slate-900">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${priorityColors[item.priority] || 'bg-slate-400'}`}
                                        style={{
                                            width: `${(item.count / metrics.summary.total) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SLA Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">SLA Status</h3>
                    <div className="space-y-3">
                        {metrics.slaDistribution.length > 0 ? (
                            metrics.slaDistribution.map((item) => (
                                <div key={item.status}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-slate-700 capitalize">{item.status?.replace('_', ' ')}</span>
                                        <span className="font-semibold text-slate-900">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${slaColors[item.status || ''] || 'bg-slate-400'}`}
                                            style={{
                                                width: `${(item.count / metrics.slaDistribution.reduce((sum, s) => sum + s.count, 0)) * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">No SLA data available</p>
                        )}
                    </div>
                </div>

                {/* Type Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Ticket Type</h3>
                    <div className="space-y-3">
                        {metrics.typeDistribution.map((item) => (
                            <div key={item.type}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-slate-700">{item.type} Tickets</span>
                                    <span className="font-semibold text-slate-900">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${item.type === 'IT' ? 'bg-blue-500' : 'bg-purple-500'}`}
                                        style={{
                                            width: `${(item.count / metrics.summary.total) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Categories & Assignees */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Categories */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Filter size={20} />
                        Top Categories
                    </h3>
                    <div className="space-y-2">
                        {metrics.categoryDistribution.slice(0, 5).map((item, index) => (
                            <div key={item.category} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-slate-500 w-6">#{index + 1}</span>
                                    <span className="text-sm text-slate-700">{item.category}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">{item.count} tickets</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Assignees */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Users size={20} />
                        Top Assignees
                    </h3>
                    <div className="space-y-2">
                        {metrics.topAssignees.map((item, index) => (
                            <div key={item.assigneeId} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-slate-500 w-6">#{index + 1}</span>
                                    <span className="text-sm text-slate-700">{item.assigneeName}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">{item.count} tickets</span>
                            </div>
                        ))}
                        {metrics.topAssignees.length === 0 && (
                            <p className="text-slate-500 text-sm">No assignee data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
