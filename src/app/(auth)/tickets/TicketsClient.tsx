'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Tag,
    User,
    Calendar,
    LayoutList,
    LayoutGrid,
    BarChart3,
    Download
} from 'lucide-react';
import TicketModal from '@/components/TicketModal';

interface Ticket {
    id: number;
    ticketNumber: string;
    type: 'IT' | 'FM';
    title: string;
    description: string;
    priority: string;
    status: string;
    category: string;
    slaDeadline: string | null;
    slaStatus: string | null;
    reportedAt: string;
    reportedBy: {
        id: number;
        name: string;
        email: string;
    };
    assignedTo: {
        id: number;
        name: string;
        email: string;
    } | null;
    _count: {
        comments: number;
        activities: number;
    };
}

export default function TicketsClient() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPriority, setFilterPriority] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        overdue: 0,
        resolvedThisMonth: 0,
    });

    useEffect(() => {
        fetchTickets();
    }, [filterType, filterStatus, filterPriority]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterType) params.set('type', filterType);
            if (filterStatus) params.set('status', filterStatus);
            if (filterPriority) params.set('priority', filterPriority);

            const response = await fetch(`/api/tickets?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setTickets(data.tickets || []);
                calculateStats(data.tickets || []);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (ticketList: Ticket[]) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        setStats({
            total: ticketList.length,
            open: ticketList.filter(t => ['open', 'assigned', 'in_progress'].includes(t.status)).length,
            overdue: ticketList.filter(t =>
                t.slaDeadline && new Date(t.slaDeadline) < now &&
                !['resolved', 'closed', 'cancelled'].includes(t.status)
            ).length,
            resolvedThisMonth: ticketList.filter(t =>
                t.status === 'resolved' &&
                new Date(t.reportedAt) >= startOfMonth
            ).length,
        });
    };

    const filteredTickets = tickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            open: 'bg-blue-100 text-blue-800',
            assigned: 'bg-purple-100 text-purple-800',
            in_progress: 'bg-yellow-100 text-yellow-800',
            resolved: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityBadge = (priority: string) => {
        const colors: Record<string, string> = {
            urgent: 'bg-red-100 text-red-800',
            high: 'bg-orange-100 text-orange-800',
            medium: 'bg-yellow-100 text-yellow-800',
            low: 'bg-green-100 text-green-800',
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    };

    const getSLABadge = (slaStatus: string | null) => {
        if (!slaStatus) return null;
        const colors: Record<string, string> = {
            within_sla: 'bg-green-100 text-green-800',
            at_risk: 'bg-yellow-100 text-yellow-800',
            breached: 'bg-red-100 text-red-800',
        };
        const labels: Record<string, string> = {
            within_sla: 'On Track',
            at_risk: 'At Risk',
            breached: 'Breached',
        };
        return (
            <span className={`px-2 py-1 text-xs rounded-full ${colors[slaStatus]}`}>
                {labels[slaStatus]}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Tickets
                            </h1>
                            <p className="text-slate-500 mt-1">Manage support requests and issues</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    window.open('/api/tickets/export', '_blank');
                                }}
                                className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                            >
                                <Download size={20} />
                                Export CSV
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                <Plus size={20} />
                                Create Ticket
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total Tickets</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Tag className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Open</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.open}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Clock className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Overdue</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Resolved (Month)</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolvedThisMonth}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <CheckCircle2 className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* View Toggle & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    {/* View Mode Toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === 'table'
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <LayoutList size={18} />
                                Table View
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === 'kanban'
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <LayoutGrid size={18} />
                                Kanban Board
                            </button>
                        </div>
                        <Link
                            href="/tickets/metrics"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
                        >
                            <BarChart3 size={18} />
                            View Metrics
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="">All Types</option>
                                <option value="IT">IT</option>
                                <option value="FM">FM</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="">All Status</option>
                                <option value="open">Open</option>
                                <option value="assigned">Assigned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="">All Priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tickets View */}
                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-slate-500 mt-4">Loading tickets...</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <XCircle className="mx-auto text-slate-300" size={48} />
                        <p className="text-slate-500 font-medium mt-4">No tickets found</p>
                        <p className="text-slate-400 text-sm mt-2">Try adjusting your filters</p>
                    </div>
                ) : viewMode === 'kanban' ? (
                    /* Kanban Board */
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Open Column */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="p-4 border-b border-slate-200 bg-blue-50">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    Open
                                    <span className="ml-auto text-sm text-slate-600">
                                        {filteredTickets.filter(t => t.status === 'open' || t.status === 'assigned').length}
                                    </span>
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredTickets
                                    .filter(t => t.status === 'open' || t.status === 'assigned')
                                    .map((ticket) => (
                                        <Link
                                            key={ticket.ticketNumber}
                                            href={`/tickets/${ticket.ticketNumber}`}
                                            className="block p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="font-mono text-xs text-primary font-medium">
                                                    {ticket.ticketNumber}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadge(ticket.priority)}`}>
                                                    {ticket.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-slate-900 mb-2 line-clamp-2">
                                                {ticket.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                                                {ticket.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={`px-2 py-1 rounded-full ${ticket.type === 'IT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {ticket.type}
                                                </span>
                                                {ticket.assignedTo ? (
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <User size={12} />
                                                        <span className="truncate max-w-[100px]">{ticket.assignedTo.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">Unassigned</span>
                                                )}
                                            </div>
                                            {ticket.slaStatus === 'at_risk' || ticket.slaStatus === 'breached' ? (
                                                <div className="mt-2 pt-2 border-t border-slate-100">
                                                    {getSLABadge(ticket.slaStatus)}
                                                </div>
                                            ) : null}
                                        </Link>
                                    ))}
                            </div>
                        </div>

                        {/* In Progress Column */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="p-4 border-b border-slate-200 bg-yellow-50">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    In Progress
                                    <span className="ml-auto text-sm text-slate-600">
                                        {filteredTickets.filter(t => t.status === 'in_progress').length}
                                    </span>
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredTickets
                                    .filter(t => t.status === 'in_progress')
                                    .map((ticket) => (
                                        <Link
                                            key={ticket.ticketNumber}
                                            href={`/tickets/${ticket.ticketNumber}`}
                                            className="block p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="font-mono text-xs text-primary font-medium">
                                                    {ticket.ticketNumber}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadge(ticket.priority)}`}>
                                                    {ticket.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-slate-900 mb-2 line-clamp-2">
                                                {ticket.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                                                {ticket.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={`px-2 py-1 rounded-full ${ticket.type === 'IT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {ticket.type}
                                                </span>
                                                {ticket.assignedTo && (
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <User size={12} />
                                                        <span className="truncate max-w-[100px]">{ticket.assignedTo.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {ticket.slaStatus === 'at_risk' || ticket.slaStatus === 'breached' ? (
                                                <div className="mt-2 pt-2 border-t border-slate-100">
                                                    {getSLABadge(ticket.slaStatus)}
                                                </div>
                                            ) : null}
                                        </Link>
                                    ))}
                            </div>
                        </div>

                        {/* Resolved Column */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="p-4 border-b border-slate-200 bg-green-50">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    Resolved
                                    <span className="ml-auto text-sm text-slate-600">
                                        {filteredTickets.filter(t => t.status === 'resolved').length}
                                    </span>
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredTickets
                                    .filter(t => t.status === 'resolved')
                                    .map((ticket) => (
                                        <Link
                                            key={ticket.ticketNumber}
                                            href={`/tickets/${ticket.ticketNumber}`}
                                            className="block p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="font-mono text-xs text-primary font-medium">
                                                    {ticket.ticketNumber}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadge(ticket.priority)}`}>
                                                    {ticket.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-slate-900 mb-2 line-clamp-2">
                                                {ticket.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                                                {ticket.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={`px-2 py-1 rounded-full ${ticket.type === 'IT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {ticket.type}
                                                </span>
                                                {ticket.assignedTo && (
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <User size={12} />
                                                        <span className="truncate max-w-[100px]">{ticket.assignedTo.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                            </div>
                        </div>

                        {/* Closed Column */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                    Closed
                                    <span className="ml-auto text-sm text-slate-600">
                                        {filteredTickets.filter(t => t.status === 'closed' || t.status === 'cancelled').length}
                                    </span>
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredTickets
                                    .filter(t => t.status === 'closed' || t.status === 'cancelled')
                                    .map((ticket) => (
                                        <Link
                                            key={ticket.ticketNumber}
                                            href={`/tickets/${ticket.ticketNumber}`}
                                            className="block p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer opacity-75 hover:opacity-100"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="font-mono text-xs text-primary font-medium">
                                                    {ticket.ticketNumber}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadge(ticket.priority)}`}>
                                                    {ticket.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-slate-900 mb-2 line-clamp-2">
                                                {ticket.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                                                {ticket.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className={`px-2 py-1 rounded-full ${ticket.type === 'IT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {ticket.type}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full ${getStatusBadge(ticket.status)}`}>
                                                    {ticket.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ticket</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Title</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">SLA</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Assigned To</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTickets.map((ticket) => (
                                        <tr key={ticket.ticketNumber} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-mono text-sm font-medium text-primary">
                                                    {ticket.ticketNumber}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {new Date(ticket.reportedAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/tickets/${ticket.ticketNumber}`}
                                                    className="block hover:text-primary transition-colors cursor-pointer group"
                                                >
                                                    <div className="font-medium text-slate-900 group-hover:text-primary">
                                                        {ticket.title}
                                                    </div>
                                                    <div className="text-sm text-slate-500 truncate max-w-xs">
                                                        {ticket.description.substring(0, 60)}...
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${ticket.type === 'IT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {ticket.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(ticket.priority)}`}>
                                                    {ticket.priority.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getSLABadge(ticket.slaStatus)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {ticket.assignedTo ? (
                                                    <div className="flex items-center gap-2">
                                                        <User size={16} className="text-slate-400" />
                                                        <span className="text-sm text-slate-700">{ticket.assignedTo.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">Unassigned</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-slate-500">
                    Showing {filteredTickets.length} of {tickets.length} tickets
                </div>

                {/* Ticket Modal */}
                <TicketModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchTickets(); // Refresh list
                    }}
                />
            </div>
        </div>
    );
}
