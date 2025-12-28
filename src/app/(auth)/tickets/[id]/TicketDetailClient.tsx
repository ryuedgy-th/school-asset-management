'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    User,
    Tag,
    Clock,
    AlertCircle,
    MessageSquare,
    Activity,
    FileText,
    Send,
    UserPlus,
    CheckCircle,
    ClipboardCheck,
} from 'lucide-react';
import { formatTimeRemaining } from '@/lib/sla';
import TicketActions from '@/components/TicketActions';
import AssignTicketModal from '@/components/AssignTicketModal';

interface Ticket {
    id: number;
    ticketNumber: string;
    type: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    category: string;
    subCategory: string | null;
    slaDeadline: string | null;
    slaStatus: string | null;
    reportedAt: string;
    resolvedAt: string | null;
    closedAt: string | null;
    resolution: string | null;
    resolutionNotes: string | null;
    reportedBy: {
        id: number;
        name: string;
        email: string;
    };
    affectedUser: {
        id: number;
        name: string;
        email: string;
        department: string | null;
        phoneNumber: string | null;
    } | null;
    assignedTo: {
        id: number;
        name: string;
        email: string;
    } | null;
    itAsset: {
        id: number;
        assetCode: string;
        name: string;
        category: string;
        location: string;
    } | null;
    fmAsset: {
        id: number;
        assetCode: string;
        name: string;
        category: { name: string };
        location: string;
    } | null;
    inspection: {
        id: number;
        inspectionDate: string;
        inspectionType: string;
        overallCondition: string;
        damageFound: boolean;
        damageDescription: string | null;
        damageSeverity: string | null;
        estimatedCost: number | null;
        photoUrls: string | null;
        exteriorCondition: string | null;
        screenCondition: string | null;
        keyboardCondition: string | null;
        buttonPortCondition: string | null;
        batteryHealth: string | null;
        notes: string | null;
        inspector: {
            id: number;
            name: string;
            email: string;
        };
    } | null;
    comments: Comment[];
    activities: Activity[];
}

interface Comment {
    id: number;
    comment: string;
    createdAt: string;
    user: {
        id: number;
        name: string;
    };
}

interface Activity {
    id: number;
    action: string;
    details: string;
    createdAt: string;
    user: {
        id: number;
        name: string;
    };
}

export default function TicketDetailClient({ ticketId }: { ticketId: number }) {
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'asset'>('comments');
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number>(0);

    // Get current user ID
    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (data?.user?.id) {
                    setCurrentUserId(parseInt(data.user.id));
                }
            });
    }, []);

    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    const fetchTicket = async () => {
        try {
            console.log('Fetching ticket data...');
            const response = await fetch(`/api/tickets/${ticketId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Ticket data fetched:', data);
                setTicket(data);
            } else if (response.status === 404) {
                console.error('Ticket not found (404), redirecting to tickets list');
                router.push('/tickets');
            } else {
                console.error('Failed to fetch ticket:', response.status);
            }
        } catch (error) {
            console.error('Error fetching ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || submitting) return;

        try {
            setSubmitting(true);
            const response = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });

            if (response.ok) {
                setNewComment('');
                fetchTicket(); // Refresh to show new comment
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

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
            breached: 'SLA Breached',
        };
        return (
            <span className={`px-3 py-1 text-sm rounded-full ${colors[slaStatus]}`}>
                {labels[slaStatus]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-slate-500 mt-4">Loading ticket...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto text-slate-300" size={48} />
                    <p className="text-slate-500 font-medium mt-4">Ticket not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/tickets"
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900">{ticket.title}</h1>
                        <p className="text-slate-500 mt-1">Ticket #{ticket.ticketNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Description</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        {/* Inspection Info */}
                        {ticket.inspection && (
                            <div className="bg-purple-50 border border-purple-200 rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="text-purple-600" size={24} />
                                        <h2 className="text-lg font-semibold text-purple-900">Created from Inspection</h2>
                                    </div>
                                    {ticket.inspection.damageSeverity && (
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            ticket.inspection.damageSeverity === 'severe' ? 'bg-red-100 text-red-800' :
                                            ticket.inspection.damageSeverity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {ticket.inspection.damageSeverity.toUpperCase()} DAMAGE
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Inspection #</p>
                                            <Link
                                                href={`/inspections/${ticket.inspection.id}`}
                                                className="text-purple-900 font-semibold hover:underline"
                                            >
                                                #{ticket.inspection.id}
                                            </Link>
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Date</p>
                                            <p className="text-purple-900">
                                                {new Date(ticket.inspection.inspectionDate).toLocaleDateString('th-TH')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Type</p>
                                            <p className="text-purple-900 capitalize">{ticket.inspection.inspectionType}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Inspector</p>
                                            <p className="text-purple-900">{ticket.inspection.inspector?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium">Overall Condition</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                ticket.inspection.overallCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                                                ticket.inspection.overallCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                                                ticket.inspection.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                                ticket.inspection.overallCondition === 'poor' ? 'bg-orange-100 text-orange-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {ticket.inspection.overallCondition}
                                            </span>
                                        </div>
                                        {ticket.inspection.estimatedCost && (
                                            <div>
                                                <p className="text-sm text-purple-600 font-medium">Estimated Repair Cost</p>
                                                <p className="text-purple-900 font-semibold">
                                                    ฿{ticket.inspection.estimatedCost.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Damage Description */}
                                    {ticket.inspection.damageDescription && (
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium mb-1">Damage Description</p>
                                            <p className="text-purple-900 bg-purple-100/50 p-3 rounded">
                                                {ticket.inspection.damageDescription}
                                            </p>
                                        </div>
                                    )}

                                    {/* Detailed Condition Checklist */}
                                    {(ticket.inspection.exteriorCondition || ticket.inspection.screenCondition ||
                                      ticket.inspection.keyboardCondition || ticket.inspection.buttonPortCondition ||
                                      ticket.inspection.batteryHealth) && (
                                        <div className="bg-white/60 rounded-lg p-4">
                                            <p className="text-sm text-purple-600 font-medium mb-3">Detailed Condition Assessment</p>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                {ticket.inspection.exteriorCondition && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-purple-800">Exterior:</span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            ticket.inspection.exteriorCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                                                            ticket.inspection.exteriorCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                                                            ticket.inspection.exteriorCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {ticket.inspection.exteriorCondition}
                                                        </span>
                                                    </div>
                                                )}
                                                {ticket.inspection.screenCondition && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-purple-800">Screen:</span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            ticket.inspection.screenCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                                                            ticket.inspection.screenCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                                                            ticket.inspection.screenCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {ticket.inspection.screenCondition}
                                                        </span>
                                                    </div>
                                                )}
                                                {ticket.inspection.keyboardCondition && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-purple-800">Keyboard:</span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            ticket.inspection.keyboardCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                                                            ticket.inspection.keyboardCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                                                            ticket.inspection.keyboardCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {ticket.inspection.keyboardCondition}
                                                        </span>
                                                    </div>
                                                )}
                                                {ticket.inspection.buttonPortCondition && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-purple-800">Buttons/Ports:</span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            ticket.inspection.buttonPortCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                                                            ticket.inspection.buttonPortCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                                                            ticket.inspection.buttonPortCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {ticket.inspection.buttonPortCondition}
                                                        </span>
                                                    </div>
                                                )}
                                                {ticket.inspection.batteryHealth && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-purple-800">Battery Health:</span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            ticket.inspection.batteryHealth === 'excellent' ? 'bg-green-100 text-green-800' :
                                                            ticket.inspection.batteryHealth === 'good' ? 'bg-blue-100 text-blue-800' :
                                                            ticket.inspection.batteryHealth === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {ticket.inspection.batteryHealth}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Inspector Notes */}
                                    {ticket.inspection.notes && (
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium mb-1">Inspector Notes</p>
                                            <p className="text-purple-800 bg-white/60 p-3 rounded text-sm italic">
                                                {ticket.inspection.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Inspection Photos */}
                                    {ticket.inspection.photoUrls && (
                                        <div>
                                            <p className="text-sm text-purple-600 font-medium mb-2">Inspection Photos</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {JSON.parse(ticket.inspection.photoUrls).map((url: string, index: number) => (
                                                    <img
                                                        key={index}
                                                        src={url}
                                                        alt={`Damage photo ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity border-2 border-purple-200"
                                                        onClick={() => window.open(url, '_blank')}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-purple-200">
                                        <Link
                                            href={`/inspections/${ticket.inspection.id}`}
                                            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium"
                                        >
                                            View Full Inspection Report →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="border-b border-slate-200">
                                <div className="flex">
                                    <button
                                        onClick={() => setActiveTab('comments')}
                                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'comments'
                                            ? 'border-b-2 border-primary text-primary bg-primary/5'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        <MessageSquare className="inline mr-2" size={16} />
                                        Comments ({ticket.comments.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('activity')}
                                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'activity'
                                            ? 'border-b-2 border-primary text-primary bg-primary/5'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Activity className="inline mr-2" size={16} />
                                        Activity ({ticket.activities.length})
                                    </button>
                                    {(ticket.itAsset || ticket.fmAsset) && (
                                        <button
                                            onClick={() => setActiveTab('asset')}
                                            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'asset'
                                                ? 'border-b-2 border-primary text-primary bg-primary/5'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                                }`}
                                        >
                                            <FileText className="inline mr-2" size={16} />
                                            Asset
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                {activeTab === 'comments' && (
                                    <div className="space-y-4">
                                        {/* Add Comment */}
                                        <div className="flex gap-3">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                                rows={3}
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim() || submitting}
                                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                                            >
                                                <Send size={20} />
                                            </button>
                                        </div>

                                        {/* Comments List */}
                                        <div className="space-y-4 mt-6">
                                            {ticket.comments.length === 0 ? (
                                                <p className="text-center text-slate-500 py-8">No comments yet</p>
                                            ) : (
                                                ticket.comments.map((comment) => (
                                                    <div key={comment.id} className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <User size={20} className="text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-slate-900">{comment.user.name}</span>
                                                                <span className="text-sm text-slate-500">
                                                                    {new Date(comment.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-700 mt-1">{comment.comment}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="space-y-3">
                                        {ticket.activities.length === 0 ? (
                                            <p className="text-center text-slate-500 py-8">No activity yet</p>
                                        ) : (
                                            ticket.activities.map((activity) => (
                                                <div key={activity.id} className="flex gap-3 pb-3 border-b border-slate-100 last:border-0">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-slate-900">{activity.user.name}</span>
                                                            <span className="text-sm text-slate-500">{activity.action}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            {new Date(activity.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'asset' && (ticket.itAsset || ticket.fmAsset) && (
                                    <div className="space-y-3">
                                        {ticket.itAsset && (
                                            <div>
                                                <h3 className="font-semibold text-slate-900 mb-3">IT Asset</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-slate-500">Asset Code</p>
                                                        <p className="font-medium">{ticket.itAsset.assetCode}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-500">Name</p>
                                                        <p className="font-medium">{ticket.itAsset.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-500">Category</p>
                                                        <p className="font-medium">{ticket.itAsset.category}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-500">Location</p>
                                                        <p className="font-medium">{ticket.itAsset.location}</p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/assets/${ticket.itAsset.id}`}
                                                    className="inline-block mt-4 text-primary hover:underline"
                                                >
                                                    View Asset Details →
                                                </Link>
                                            </div>
                                        )}
                                        {ticket.fmAsset && (
                                            <div>
                                                <h3 className="font-semibold text-slate-900 mb-3">FM Asset</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-slate-500">Asset Code</p>
                                                        <p className="font-medium">{ticket.fmAsset.assetCode}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-500">Name</p>
                                                        <p className="font-medium">{ticket.fmAsset.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-500">Category</p>
                                                        <p className="font-medium">{ticket.fmAsset.category.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-500">Location</p>
                                                        <p className="font-medium">{ticket.fmAsset.location}</p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/fm-assets/${ticket.fmAsset.id}`}
                                                    className="inline-block mt-4 text-primary hover:underline"
                                                >
                                                    View Asset Details →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                            <TicketActions
                                ticket={{
                                    id: ticket.id,
                                    status: ticket.status,
                                    assignedToId: ticket.assignedTo?.id || null,
                                }}
                                currentUserId={currentUserId}
                                onStatusChange={fetchTicket}
                            />
                        </div>
                        {/* Status Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Status</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-2">Current Status</p>
                                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadge(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-2">Priority</p>
                                    <span className={`px-3 py-1 text-sm rounded-full ${getPriorityBadge(ticket.priority)}`}>
                                        {ticket.priority.toUpperCase()}
                                    </span>
                                </div>
                                {ticket.slaStatus && (
                                    <div>
                                        <p className="text-sm text-slate-500 mb-2">SLA Status</p>
                                        {getSLABadge(ticket.slaStatus)}
                                        {ticket.slaDeadline && (
                                            <p className="text-sm text-slate-600 mt-2">
                                                {formatTimeRemaining(new Date(ticket.slaDeadline))}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500">Type</p>
                                    <p className="font-medium">{ticket.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Category</p>
                                    <p className="font-medium">{ticket.category}</p>
                                </div>
                                {ticket.subCategory && (
                                    <div>
                                        <p className="text-sm text-slate-500">Sub-category</p>
                                        <p className="font-medium">{ticket.subCategory}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-slate-500">Reported By</p>
                                    <p className="font-medium">{ticket.reportedBy.name}</p>
                                    <p className="text-xs text-slate-500">{ticket.reportedBy.email}</p>
                                </div>
                                {ticket.affectedUser && (
                                    <div>
                                        <p className="text-sm text-slate-500">Reported For</p>
                                        <p className="font-medium">{ticket.affectedUser.name}</p>
                                        <p className="text-xs text-slate-500">{ticket.affectedUser.email}</p>
                                        {ticket.affectedUser.department && (
                                            <p className="text-xs text-slate-400">{ticket.affectedUser.department}</p>
                                        )}
                                        {ticket.affectedUser.phoneNumber && (
                                            <p className="text-xs text-slate-400">{ticket.affectedUser.phoneNumber}</p>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-slate-500">Assigned To</p>
                                        <button
                                            onClick={() => setShowAssignModal(true)}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            <UserPlus size={12} />
                                            {ticket.assignedTo ? 'Reassign' : 'Assign'}
                                        </button>
                                    </div>
                                    <p className="font-medium">{ticket.assignedTo?.name || 'Unassigned'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Created</p>
                                    <p className="font-medium">{new Date(ticket.reportedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignment Modal */}
            <AssignTicketModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                ticketId={ticket.id}
                currentUserId={currentUserId}
                onSuccess={fetchTicket}
            />
        </div>
    );
}
