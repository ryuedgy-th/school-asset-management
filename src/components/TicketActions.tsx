'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Play, RotateCcw } from 'lucide-react';

interface TicketActionsProps {
    ticket: {
        id: number;
        ticketNumber: string;
        status: string;
        assignedToId: number | null;
    };
    currentUserId: number;
    onStatusChange: () => void;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    open: ['assigned', 'in_progress', 'cancelled'],
    assigned: ['in_progress', 'open', 'cancelled'],
    in_progress: ['resolved', 'assigned', 'open'],
    resolved: ['closed', 'in_progress'],
    closed: [],
    cancelled: [],
};

export default function TicketActions({ ticket, currentUserId, onStatusChange }: TicketActionsProps) {
    const [loading, setLoading] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolution, setResolution] = useState('fixed');
    const [resolutionNotes, setResolutionNotes] = useState('');

    const canTransitionTo = (newStatus: string) => {
        return ALLOWED_TRANSITIONS[ticket.status]?.includes(newStatus) || false;
    };

    const updateStatus = async (newStatus: string, additionalData?: any) => {
        if (loading) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/tickets/${ticket.ticketNumber}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    ...additionalData,
                }),
            });

            if (response.ok) {
                onStatusChange();
                setShowResolveModal(false);
                setResolutionNotes('');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update status');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = () => {
        if (!resolutionNotes.trim()) {
            alert('Please provide resolution notes');
            return;
        }
        updateStatus('resolved', { resolution, resolutionNotes });
    };

    if (ticket.status === 'closed' || ticket.status === 'cancelled') {
        return (
            <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500">
                This ticket is {ticket.status}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Start Working */}
            {canTransitionTo('in_progress') && (
                <button
                    onClick={() => updateStatus('in_progress')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <Play size={18} />
                    Start Working
                </button>
            )}

            {/* Resolve */}
            {canTransitionTo('resolved') && (
                <button
                    onClick={() => setShowResolveModal(true)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    <CheckCircle size={18} />
                    Resolve Ticket
                </button>
            )}

            {/* Close */}
            {canTransitionTo('closed') && (
                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to close this ticket?')) {
                            updateStatus('closed');
                        }
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    <CheckCircle size={18} />
                    Close Ticket
                </button>
            )}

            {/* Reopen */}
            {canTransitionTo('in_progress') && ticket.status === 'resolved' && (
                <button
                    onClick={() => updateStatus('in_progress')}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                    <RotateCcw size={18} />
                    Reopen Ticket
                </button>
            )}

            {/* Cancel */}
            {canTransitionTo('cancelled') && (
                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to cancel this ticket?')) {
                            updateStatus('cancelled');
                        }
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    <XCircle size={18} />
                    Cancel Ticket
                </button>
            )}

            {/* Resolve Modal */}
            {showResolveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900">Resolve Ticket</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Resolution Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="fixed">Fixed</option>
                                    <option value="workaround">Workaround Provided</option>
                                    <option value="cannot_reproduce">Cannot Reproduce</option>
                                    <option value="user_error">User Error</option>
                                    <option value="duplicate">Duplicate</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Resolution Notes <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Describe how you resolved this issue..."
                                    rows={4}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowResolveModal(false);
                                    setResolutionNotes('');
                                }}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResolve}
                                disabled={loading || !resolutionNotes.trim()}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Resolving...' : 'Resolve Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
