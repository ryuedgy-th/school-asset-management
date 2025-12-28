'use client';

import { useState, useEffect } from 'react';
import { X, Search, UserPlus } from 'lucide-react';

interface AssignTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: number;
    currentUserId: number;
    onSuccess: () => void;
}

interface Technician {
    id: number;
    name: string;
    email: string;
    department: string;
}

export default function AssignTicketModal({
    isOpen,
    onClose,
    ticketId,
    currentUserId,
    onSuccess,
}: AssignTicketModalProps) {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTechnicians();
        }
    }, [isOpen]);

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users/technicians');
            if (response.ok) {
                const data = await response.json();
                setTechnicians(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching technicians:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedId) return;

        try {
            setSubmitting(true);
            const response = await fetch(`/api/tickets/${ticketId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigneeId: selectedId }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to assign ticket');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignToMe = async () => {
        try {
            setSubmitting(true);
            const response = await fetch(`/api/tickets/${ticketId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigneeId: currentUserId }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to assign ticket');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTechnicians = technicians.filter(tech =>
        tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Assign Ticket</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Assign to Me Button */}
                    <button
                        onClick={handleAssignToMe}
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <UserPlus size={18} />
                        Assign to Me
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500">or assign to someone else</span>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search technicians..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Technician List */}
                    <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-slate-500">Loading...</div>
                        ) : filteredTechnicians.length === 0 ? (
                            <div className="p-4 text-center text-slate-500">No technicians found</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredTechnicians.map((tech) => (
                                    <button
                                        key={tech.id}
                                        onClick={() => setSelectedId(tech.id)}
                                        className={`w-full p-3 text-left hover:bg-slate-50 transition-colors ${selectedId === tech.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                                            }`}
                                    >
                                        <div className="font-medium text-slate-900">{tech.name}</div>
                                        <div className="text-sm text-slate-500">{tech.email}</div>
                                        <div className="text-xs text-slate-400 mt-1">{tech.department}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedId || submitting}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Assigning...' : 'Assign'}
                    </button>
                </div>
            </div>
        </div>
    );
}
