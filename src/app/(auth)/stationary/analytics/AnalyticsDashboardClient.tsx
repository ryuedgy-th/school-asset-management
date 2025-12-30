'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Package,
    DollarSign,
    AlertTriangle,
    BarChart3,
    PieChart as PieChartIcon,
    Download
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { exportAnalyticsToExcel } from '@/lib/exportUtils';

interface AnalyticsDashboardClientProps {
    user: any;
}

export default function AnalyticsDashboardClient({ user }: AnalyticsDashboardClientProps) {
    const [overview, setOverview] = useState<any>(null);
    const [consumption, setConsumption] = useState<any>(null);
    const [departmentUsage, setDepartmentUsage] = useState<any>(null);
    const [costAnalysis, setCostAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    useEffect(() => {
        fetchAllData();
    }, [period]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [overviewRes, consumptionRes, deptUsageRes, costRes] = await Promise.all([
                fetch('/api/stationary/analytics/overview'),
                fetch(`/api/stationary/analytics/consumption?period=${period}`),
                fetch(`/api/stationary/analytics/department-usage?period=${period}`),
                fetch(`/api/stationary/analytics/cost-analysis?period=${period}`),
            ]);

            const [overviewData, consumptionData, deptUsageData, costData] = await Promise.all([
                overviewRes.json(),
                consumptionRes.json(),
                deptUsageRes.json(),
                costRes.json(),
            ]);

            setOverview(overviewData);
            setConsumption(consumptionData);
            setDepartmentUsage(deptUsageData);
            setCostAnalysis(costData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(value);
    };

    const handleExport = () => {
        exportAnalyticsToExcel({
            overview,
            consumption,
            departmentUsage,
            costAnalysis,
        });
    };

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-12 bg-slate-200 rounded w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
                            ))}
                        </div>
                        <div className="h-96 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
                        <p className="text-slate-500 mt-1">View insights and trends for stationary management</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                        >
                            <Download size={18} />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title="Total Items"
                        value={overview?.totalItems || 0}
                        icon={Package}
                        color="blue"
                        trend={null}
                    />
                    <KPICard
                        title="Inventory Value"
                        value={formatCurrency(overview?.totalInventoryValue || 0)}
                        icon={DollarSign}
                        color="green"
                        trend={null}
                    />
                    <KPICard
                        title="Pending Requisitions"
                        value={overview?.pendingRequisitions || 0}
                        icon={TrendingUp}
                        color="yellow"
                        trend={null}
                    />
                    <KPICard
                        title="Low Stock Items"
                        value={overview?.lowStockItems || 0}
                        icon={AlertTriangle}
                        color="red"
                        trend={null}
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Consumption Trends */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Consumption Trends</h2>
                            <BarChart3 className="text-slate-400" size={20} />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={consumption?.timeline || []}>
                                <defs>
                                    <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="quantity"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorQuantity)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Department Usage */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Department Usage</h2>
                            <BarChart3 className="text-slate-400" size={20} />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={departmentUsage?.departments?.slice(0, 5) || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="departmentCode" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Bar dataKey="totalCost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Analysis & Top Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Distribution */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">Cost by Category</h2>
                            <PieChartIcon className="text-slate-400" size={20} />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={costAnalysis?.categories || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="totalCost"
                                >
                                    {(costAnalysis?.categories || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Requested Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Requested Items</h2>
                        <div className="space-y-3">
                            {(consumption?.topItems?.slice(0, 5) || []).map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-900">{item.quantity}</p>
                                        <p className="text-xs text-slate-500">units</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface KPICardProps {
    title: string;
    value: string | number;
    icon: any;
    color: 'blue' | 'green' | 'yellow' | 'red';
    trend: number | null;
}

function KPICard({ title, value, icon: Icon, color, trend }: KPICardProps) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        red: 'bg-red-100 text-red-600',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">{title}</p>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {trend !== null && (
                <p className={`text-xs mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
                </p>
            )}
        </div>
    );
}
