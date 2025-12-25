'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar as CalendarIcon, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface PMCalendarProps {
    initialTasks: any[];
}

export default function PMCalendar({ initialTasks }: PMCalendarProps) {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Calendar Generation
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const getTasksForDay = (day: number) => {
        return initialTasks.filter(task => {
            const taskDate = new Date(task.scheduledDate);
            return taskDate.getDate() === day &&
                taskDate.getMonth() === currentDate.getMonth() &&
                taskDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    async function handleCompleteTask() {
        if (!selectedTask) return;
        setLoading(true);
        try {
            const res = await fetch('/api/pm', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedTask.id,
                    status: 'Completed',
                    resultNotes: 'Completed via Dashboard'
                })
            });
            if (!res.ok) throw new Error('Failed');
            router.refresh();
            setSelectedTask(null);
        } catch (error) {
            alert('Error completing task');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch('/api/pm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.get('title'),
                    date: formData.get('date'),
                    type: formData.get('type'),
                    description: formData.get('description')
                })
            });
            if (!res.ok) throw new Error('Failed');
            router.refresh();
            setIsCreateModalOpen(false);
        } catch (error) {
            alert('Error creating task');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Preventive Maintenance</h1>
                    <p className="text-slate-500 mt-1">Schedule and track regular maintenance tasks.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all active:scale-95"
                >
                    <Plus size={20} className="mr-2" />
                    Create Plan
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="text-blue-500" />
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"><ChevronLeft size={20} /></button>
                        <button onClick={() => changeMonth(1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
                    {DAYS.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 bg-slate-200 gap-px">
                    {calendarDays.map((day, idx) => {
                        const tasks = day ? getTasksForDay(day) : [];
                        const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

                        return (
                            <div key={idx} className={`min-h-[140px] bg-white p-2 flex flex-col gap-2 transition-colors hover:bg-slate-50/50 ${!day ? 'bg-slate-50/30' : ''}`}>
                                {day && (
                                    <>
                                        <div className={`self-end flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors ${isToday
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-slate-700 hover:bg-slate-100'
                                            }`}>
                                            {day}
                                        </div>

                                        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[100px] scrollbar-hide">
                                            {tasks.map((task: any) => (
                                                <button
                                                    key={task.id}
                                                    onClick={() => setSelectedTask(task)}
                                                    className={`group w-full rounded px-2 py-1.5 text-left text-xs font-medium transition-all hover:shadow-sm flex items-center gap-1.5 ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100' :
                                                            task.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100' :
                                                                'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100'
                                                        }`}
                                                >
                                                    <div className={`h-1.5 w-1.5 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500' :
                                                            task.status === 'Overdue' ? 'bg-rose-500' :
                                                                'bg-blue-500'
                                                        }`} />
                                                    <span className="truncate">{task.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Task Detail Modal */}
            <Modal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                title={selectedTask?.title || 'Maintenance Task'}
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedTask?.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {selectedTask?.status}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            {selectedTask?.type}
                        </span>
                        <span className="text-sm text-slate-500 flex items-center gap-1 ml-auto">
                            <Clock size={14} />
                            Due: {new Date(selectedTask?.scheduledDate).toLocaleDateString()}
                        </span>
                    </div>

                    {selectedTask?.description && (
                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                            <p className="text-sm text-slate-700 leading-relaxed">{selectedTask.description}</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-blue-500" />
                            Standard Checklist
                        </h4>
                        <div className="space-y-2">
                            {['Check physical condition', 'Clean dust filters', 'Verify power supply', 'Update firmware (if applicable)'].map((item, i) => (
                                <label key={i} className="group flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-blue-50/50 hover:border-blue-100 cursor-pointer">
                                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setSelectedTask(null)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Close
                        </button>
                        {selectedTask?.status !== 'Completed' && (
                            <button
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                onClick={handleCompleteTask}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="animate-spin" size={16} />}
                                Mark as Complete
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Create Task Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Schedule Maintenance"
            >
                <form onSubmit={handleCreateTask} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Title</label>
                        <input name="title" required className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="e.g. Server Room A/C Check" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date</label>
                            <input type="date" name="date" required className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</label>
                            <select name="type" className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                                <option value="Hardware">Hardware</option>
                                <option value="Infrastructure">Infrastructure</option>
                                <option value="Network">Network</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                        <textarea name="description" rows={3} className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2" disabled={loading}>
                            {loading && <Loader2 className="animate-spin" size={16} />}
                            Schedule
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
