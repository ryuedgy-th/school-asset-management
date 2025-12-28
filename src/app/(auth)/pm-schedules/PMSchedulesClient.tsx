'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, AlertCircle, CheckCircle, Clock, Plus, Edit, Trash2, Play } from 'lucide-react';

interface PMSchedule {
    id: number;
    name: string;
    description: string | null;
    scheduleType: string;
    frequency: string | null;
    nextDueDate: Date | null;
    lastPerformed: Date | null;
    priority: string;
    checklistItems: any[];
    asset: {
        id: number;
        assetCode: string;
        name: string;
    };
    assignedTo: {
        id: number;
        name: string | null;
    } | null;
}

interface PMSchedulesClientProps {
    schedules: PMSchedule[];
    users: any[];
    assets: any[];
    user: any;
}

export default function PMSchedulesClient({ schedules, users, assets, user }: PMSchedulesClientProps) {
    const router = useRouter();
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const filteredSchedules = schedules.filter((schedule) => {
        const matchesSearch =
            schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            schedule.asset.name.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'overdue') {
            return schedule.nextDueDate && new Date(schedule.nextDueDate) < now;
        } else if (filter === 'upcoming') {
            return (
                schedule.nextDueDate &&
                new Date(schedule.nextDueDate) >= now &&
                new Date(schedule.nextDueDate) <= nextWeek
            );
        }
        return true;
    });

    const stats = {
        total: schedules.length,
        overdue: schedules.filter((s) => s.nextDueDate && new Date(s.nextDueDate) < now).length,
        dueThisWeek: schedules.filter(
            (s) =>
                s.nextDueDate &&
                new Date(s.nextDueDate) >= now &&
                new Date(s.nextDueDate) <= nextWeek
        ).length,
        upcoming: schedules.filter((s) => s.nextDueDate && new Date(s.nextDueDate) > nextWeek)
            .length,
    };

    const getStatusBadge = (schedule: PMSchedule) => {
        if (!schedule.nextDueDate) return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">No Schedule</span>;

        const dueDate = new Date(schedule.nextDueDate);
        if (dueDate < now) {
            return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Overdue</span>;
        } else if (dueDate <= nextWeek) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Due Soon</span>;
        }
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Scheduled</span>;
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <Calendar className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">PM Schedules</h1>
                            <p className="text-slate-500 mt-1">Preventive Maintenance Schedule Management</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total Schedules</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            </div>
                            <Calendar className="text-primary" size={32} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-600">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                            </div>
                            <AlertCircle className="text-red-600" size={32} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-600">Due This Week</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.dueThisWeek}</p>
                            </div>
                            <Clock className="text-yellow-600" size={32} />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600">Upcoming</p>
                                <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
                            </div>
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <input
                                type="text"
                                placeholder="Search schedules..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex-1 max-w-md"
                            />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">All Schedules</option>
                                <option value="overdue">Overdue</option>
                                <option value="upcoming">Due This Week</option>
                            </select>
                        </div>
                        <button
                            onClick={() => alert('Create PM Schedule - Modal coming soon')}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                            Create Schedule
                        </button>
                    </div>
                </div>

                {/* Schedules List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Schedule Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Asset</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Frequency</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Next Due</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Performed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredSchedules.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            No schedules found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSchedules.map((schedule) => (
                                        <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{schedule.name}</div>
                                                {schedule.description && (
                                                    <div className="text-sm text-slate-500">{schedule.description}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="font-medium text-slate-900">{schedule.asset.name}</div>
                                                    <div className="text-primary font-mono text-xs">{schedule.asset.assetCode}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {schedule.scheduleType === 'time' ? 'Time-Based' : 'Usage-Based'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {schedule.frequency || 'Custom'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {formatDate(schedule.nextDueDate)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {formatDate(schedule.lastPerformed)}
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(schedule)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => alert('Execute PM - Modal coming soon')}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Execute PM"
                                                    >
                                                        <Play size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => alert('Edit - Modal coming soon')}
                                                        className="p-1 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this schedule?')) {
                                                                alert('Delete functionality coming soon');
                                                            }
                                                        }}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
