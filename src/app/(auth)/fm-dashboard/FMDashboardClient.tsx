'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    BarChart3, TrendingUp, AlertCircle, Package, Wrench, Calendar,
    DollarSign, Activity, RefreshCw, Download
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DashboardData {
    kpis: {
        totalAssets: number;
        activeAssets: number;
        inMaintenance: number;
        retiredAssets: number;
        overduePMs: number;
        upcomingPMs: number;
        lowStockParts: number;
        totalPurchaseCost: number;
        totalCurrentValue: number;
    };
    charts: {
        assetsByCategory: Record<string, number>;
        assetsByCondition: Record<string, number>;
        assetsByStatus: Record<string, number>;
        costTrend: Record<string, number>;
    };
    lists: {
        recentMaintenance: any[];
        upcomingPMSchedules: any[];
        lowStockParts: any[];
        topAssetsByCost: any[];
    };
}

export default function FMDashboardClient({ user }: { user: any }) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/analytics/fm-overview');
            if (response.ok) {
                const json = await response.json();
                setData(json);
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (err) {
            setError('Error loading dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-8 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="animate-spin text-primary mx-auto mb-4" size={48} />
                    <p className="text-slate-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-8 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                    <p className="text-slate-600">{error || 'No data available'}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Prepare chart options
    const categoryChartOptions: any = {
        chart: { type: 'pie', fontFamily: 'inherit' },
        labels: Object.keys(data.charts.assetsByCategory),
        colors: ['#574193', '#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE'],
        legend: { position: 'bottom' },
        responsive: [{
            breakpoint: 480,
            options: { chart: { width: 300 }, legend: { position: 'bottom' } }
        }]
    };

    const conditionChartOptions: any = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: Object.keys(data.charts.assetsByCondition),
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        legend: { position: 'bottom' },
        plotOptions: { pie: { donut: { size: '65%' } } }
    };

    const statusChartOptions: any = {
        chart: { type: 'bar', stacked: true, fontFamily: 'inherit' },
        plotOptions: { bar: { horizontal: false, columnWidth: '50%' } },
        xaxis: { categories: Object.keys(data.charts.assetsByStatus) },
        colors: ['#10B981', '#F59E0B', '#EF4444', '#6B7280'],
        legend: { position: 'bottom' }
    };

    const costTrendOptions: any = {
        chart: { type: 'line', fontFamily: 'inherit', toolbar: { show: false } },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: Object.keys(data.charts.costTrend) },
        colors: ['#574193'],
        yaxis: {
            title: { text: 'Cost (฿)' },
            labels: {
                formatter: (val: number) => `฿${val.toLocaleString()}`
            }
        },
        dataLabels: { enabled: false }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <BarChart3 className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">FM Dashboard</h1>
                                <p className="text-slate-500 mt-1">Facility Management Analytics & Insights</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchData}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <RefreshCw size={18} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KPICard
                        icon={Package}
                        label="Total Assets"
                        value={data.kpis.totalAssets}
                        color="bg-primary"
                        trend={`${data.kpis.activeAssets} active`}
                    />
                    <KPICard
                        icon={Wrench}
                        label="In Maintenance"
                        value={data.kpis.inMaintenance}
                        color="bg-yellow-500"
                        trend={`${((data.kpis.inMaintenance / data.kpis.totalAssets) * 100).toFixed(1)}% of total`}
                    />
                    <KPICard
                        icon={AlertCircle}
                        label="Overdue PMs"
                        value={data.kpis.overduePMs}
                        color="bg-red-500"
                        trend={`${data.kpis.upcomingPMs} upcoming`}
                    />
                    <KPICard
                        icon={Activity}
                        label="Low Stock Parts"
                        value={data.kpis.lowStockParts}
                        color="bg-orange-500"
                        trend="Requires attention"
                    />
                </div>

                {/* Financial KPIs - Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Purchase Cost</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    ฿{data.kpis.totalPurchaseCost.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingUp className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Current Value</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    ฿{data.kpis.totalCurrentValue.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts - Row 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Assets by Category</h3>
                        <Chart
                            options={categoryChartOptions}
                            series={Object.values(data.charts.assetsByCategory)}
                            type="pie"
                            height={300}
                        />
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Asset Condition</h3>
                        <Chart
                            options={conditionChartOptions}
                            series={Object.values(data.charts.assetsByCondition)}
                            type="donut"
                            height={300}
                        />
                    </div>
                </div>

                {/* Charts - Row 4 */}
                <div className="grid grid-cols-1 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Maintenance Cost Trend (Last 6 Months)</h3>
                        <Chart
                            options={costTrendOptions}
                            series={[{
                                name: 'Maintenance Cost',
                                data: Object.values(data.charts.costTrend)
                            }]}
                            type="line"
                            height={250}
                        />
                    </div>
                </div>

                {/* Lists - Row 5 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Maintenance */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Maintenance</h3>
                        <div className="space-y-3">
                            {data.lists.recentMaintenance.length > 0 ? (
                                data.lists.recentMaintenance.map((log: any) => (
                                    <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{log.asset?.name || 'N/A'}</p>
                                            <p className="text-sm text-slate-600">{log.description || log.type}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(log.date).toLocaleDateString()}
                                                {log.cost && ` • ฿${Number(log.cost).toLocaleString()}`}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm">No recent maintenance</p>
                            )}
                        </div>
                    </div>

                    {/* Upcoming PMs */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming PM Schedules</h3>
                        <div className="space-y-3">
                            {data.lists.upcomingPMSchedules.length > 0 ? (
                                data.lists.upcomingPMSchedules.map((pm: any) => (
                                    <div key={pm.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                        <Calendar className="text-primary flex-shrink-0 mt-1" size={18} />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{pm.name}</p>
                                            <p className="text-sm text-slate-600">{pm.asset?.name || 'N/A'}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Due: {new Date(pm.nextDueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm">No upcoming schedules</p>
                            )}
                        </div>
                    </div>

                    {/* Low Stock Parts */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Low Stock Parts</h3>
                            <Link
                                href="/spare-parts"
                                className="text-sm text-primary hover:text-primary/80"
                            >
                                View All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {data.lists.lowStockParts.length > 0 ? (
                                data.lists.lowStockParts.map((part: any) => (
                                    <div key={part.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900">{part.name}</p>
                                            <p className="text-sm text-slate-600">{part.partNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-orange-600">
                                                {part.currentStock} / {part.reorderPoint}
                                            </p>
                                            <p className="text-xs text-slate-500">Stock / Reorder</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm">All parts stocked properly</p>
                            )}
                        </div>
                    </div>

                    {/* Top Assets by Cost */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top 5 Assets by Cost</h3>
                        <div className="space-y-3">
                            {data.lists.topAssetsByCost.map((asset: any, idx: number) => (
                                <Link
                                    key={asset.id}
                                    href={`/fm-assets/${asset.id}`}
                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-bold text-primary">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{asset.name}</p>
                                        <p className="text-sm text-slate-600">{asset.assetCode}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-primary">
                                        ฿{asset.cost.toLocaleString()}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ icon: Icon, label, value, color, trend }: any) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-3 ${color} rounded-xl shadow-lg shadow-${color}/20`}>
                    <Icon className="text-white" size={24} />
                </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
            <p className="text-xs text-slate-400">{trend}</p>
        </div>
    );
}
