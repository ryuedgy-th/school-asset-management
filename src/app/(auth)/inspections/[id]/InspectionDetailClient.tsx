'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, AlertTriangle, X, Ticket, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { approveDamage, waiveDamage } from '@/app/lib/inspection-actions';
import DamageStatusBadge from '@/components/DamageStatusBadge';
import RepairManagement from '@/components/RepairManagement';

interface InspectionDetailClientProps {
    inspection: any;
}

export default function InspectionDetailClient({ inspection }: InspectionDetailClientProps) {
    const router = useRouter();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [creatingTicket, setCreatingTicket] = useState(false);

    const handleApprove = async () => {
        if (isProcessing) return;

        const notes = prompt('Optional approval notes:');
        if (notes === null) return; // User cancelled

        setIsProcessing(true);
        try {
            await approveDamage(inspection.id, notes || undefined);
            alert('✅ Damage claim approved successfully!');
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed to approve: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWaive = async () => {
        if (isProcessing) return;

        const reason = prompt('Please provide a reason for waiving charges:');
        if (!reason) {
            alert('Reason is required to waive charges');
            return;
        }

        setIsProcessing(true);
        try {
            await waiveDamage(inspection.id, reason);
            alert('✅ Damage charges waived successfully!');
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed to waive: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCreateTicket = async () => {
        if (creatingTicket) return;

        if (!confirm('Create a repair ticket from this inspection?')) {
            return;
        }

        setCreatingTicket(true);
        try {
            const response = await fetch(`/api/inspections/${inspection.id}/create-ticket`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create ticket');
            }

            const data = await response.json();
            alert(`✅ Ticket created successfully!\n\nTicket #: ${data.ticket.ticketNumber}`);
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed to create ticket: ' + error.message);
        } finally {
            setCreatingTicket(false);
        }
    };

    const handleGenerateForm = async () => {
        if (isProcessing) return;

        if (!confirm('Generate and send damage acknowledgement form to the user?')) {
            return;
        }

        setIsProcessing(true);
        try {
            const { generateAndSendDamageForm } = await import('@/app/lib/inspection-actions');
            const result = await generateAndSendDamageForm(inspection.id);
            alert(`✅ Damage form generated successfully!\n\nPDF: ${result.pdfPath}`);
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed to generate form: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const getConditionBadge = (condition: string | null) => {
        if (!condition) return null;
        const colors: Record<string, string> = {
            'no_damage': 'bg-green-100 text-green-800',
            'perfect': 'bg-green-100 text-green-800',
            'fully_functional': 'bg-green-100 text-green-800',
            'all_functional': 'bg-green-100 text-green-800',
            'normal': 'bg-green-100 text-green-800',
            'minor_wear': 'bg-yellow-100 text-yellow-800',
            'minor_scratches': 'bg-yellow-100 text-yellow-800',
            'moderate': 'bg-orange-100 text-orange-800',
            'replace_soon': 'bg-red-100 text-red-800',
            'cracked': 'bg-red-100 text-red-800',
            'non_functional': 'bg-red-100 text-red-800'
        };
        return colors[condition] || 'bg-gray-100 text-gray-800';
    };

    const formatCondition = (condition: string | null) => {
        if (!condition) return 'N/A';
        return condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const photoUrls = inspection.photoUrls ? JSON.parse(inspection.photoUrls as string) : [];

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxIndex(null);
            } else if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
                setLightboxIndex(lightboxIndex - 1);
            } else if (e.key === 'ArrowRight' && lightboxIndex < photoUrls.length - 1) {
                setLightboxIndex(lightboxIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, photoUrls.length]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/10 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/inspections" className="inline-flex items-center text-primary hover:text-primary/90 mb-4">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Inspections
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Inspection Details</h1>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-primary to-primary p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{inspection.asset.name}</h2>
                                <p className="text-primary/20 mt-1">Code: {inspection.asset.assetCode}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 text-primary/20">
                                    <Calendar size={16} />
                                    <span>{new Date(inspection.inspectionDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-primary/20 mt-1">
                                    <User size={16} />
                                    <span>{inspection.inspector.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Inspection Type */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">Inspection Type</h3>
                            <span className="inline-block px-4 py-2 bg-primary/20 text-blue-800 rounded-lg font-medium">
                                {formatCondition(inspection.inspectionType)}
                            </span>
                        </div>

                        {/* Condition Checks */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">Condition Assessment</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {inspection.exteriorCondition && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-600 mb-1">Exterior Casing</div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(inspection.exteriorCondition)}`}>
                                            {formatCondition(inspection.exteriorCondition)}
                                        </span>
                                    </div>
                                )}
                                {inspection.screenCondition && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-600 mb-1">Screen</div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(inspection.screenCondition)}`}>
                                            {formatCondition(inspection.screenCondition)}
                                        </span>
                                    </div>
                                )}
                                {inspection.keyboardCondition && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-600 mb-1">Keyboard</div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(inspection.keyboardCondition)}`}>
                                            {formatCondition(inspection.keyboardCondition)}
                                        </span>
                                    </div>
                                )}
                                {inspection.batteryHealth && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-600 mb-1">Battery Health</div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(inspection.batteryHealth)}`}>
                                            {formatCondition(inspection.batteryHealth)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Photos */}
                        {photoUrls.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">Photos ({photoUrls.length})</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {photoUrls.map((url: string, index: number) => (
                                        <div
                                            key={index}
                                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-primary/80 transition-all group"
                                            onClick={() => setLightboxIndex(index)}
                                        >
                                            <img
                                                src={url}
                                                alt={`Inspection photo ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {inspection.notes && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-3">Notes</h3>
                                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">{inspection.notes}</p>
                            </div>
                        )}

                        {/* Linked Ticket Info */}
                        {inspection.ticket && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                                        <Ticket size={20} />
                                        Linked Repair Ticket
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-blue-700 font-medium">Ticket #:</span>
                                        <Link
                                            href={`/tickets/${inspection.ticket.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                        >
                                            {inspection.ticket.ticketNumber}
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-blue-700 font-medium">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${inspection.ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                                inspection.ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    inspection.ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                            }`}>
                                            {inspection.ticket.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-blue-700 font-medium">Priority:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${inspection.ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                inspection.ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                    inspection.ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {inspection.ticket.priority}
                                        </span>
                                    </div>
                                    {inspection.ticket.assignedTo && (
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-blue-700 font-medium">Assigned to:</span>
                                            <span className="text-blue-900">{inspection.ticket.assignedTo.name}</span>
                                        </div>
                                    )}
                                    <div className="mt-4 pt-3 border-t border-blue-200">
                                        <Link
                                            href={`/tickets/${inspection.ticket.id}`}
                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            View Full Ticket Details →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Create Ticket Button */}
                        {inspection.damageFound && !inspection.ticket && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                                            <Ticket size={20} />
                                            Create Repair Ticket
                                        </h3>
                                        <p className="text-sm text-green-700 mt-1">
                                            Damage found - create a ticket to track the repair process
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCreateTicket}
                                        disabled={creatingTicket}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                                    >
                                        <Plus size={18} />
                                        {creatingTicket ? 'Creating...' : 'Create Ticket'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Damage Info */}
                        {inspection.damageFound && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                                        <AlertTriangle size={20} />
                                        Damage Reported
                                    </h3>
                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {/* Edit Cost Button */}
                                        {(!inspection.damageStatus || inspection.damageStatus === 'pending_review') && (
                                            <Link
                                                href={`/inspections/${inspection.id}/edit`}
                                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                            >
                                                📝 Update Cost
                                            </Link>
                                        )}
                                        {/* Approve Button (Directors only) */}
                                        {inspection.damageStatus === 'quotation_received' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove()}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                >
                                                    ✅ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleWaive()}
                                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                                                >
                                                    🔄 Waive
                                                </button>
                                            </>
                                        )}
                                        {/* Generate Form Button (After Approval) */}
                                        {inspection.damageStatus === 'approved' && !inspection.acknowledgementPdfGenerated && (
                                            <button
                                                onClick={() => handleGenerateForm()}
                                                disabled={isProcessing}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                📄 Generate Form
                                            </button>
                                        )}
                                        {/* Download PDF Button (After Form Generated) */}
                                        {inspection.acknowledgementPdfPath && (
                                            <>
                                                <a
                                                    href={inspection.acknowledgementPdfPath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                                >
                                                    📥 Download PDF
                                                </a>
                                                <button
                                                    onClick={() => handleGenerateForm()}
                                                    disabled={isProcessing}
                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    🔄 Regenerate Form
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {inspection.damageDescription && (
                                    <p className="text-red-800 mb-2">{inspection.damageDescription}</p>
                                )}
                                {inspection.estimatedCost && (
                                    <p className="text-red-900 font-semibold">
                                        Estimated Cost: ฿{Number(inspection.estimatedCost).toLocaleString()}
                                    </p>
                                )}
                                {/* Status Badge */}
                                {inspection.damageStatus && (
                                    <div className="mt-3 pt-3 border-t border-red-200">
                                        <DamageStatusBadge status={inspection.damageStatus} />
                                    </div>
                                )}
                                {/* Approval Info */}
                                {inspection.approver && (
                                    <div className="mt-3 pt-3 border-t border-red-200">
                                        <p className="text-sm text-red-700">
                                            {inspection.damageStatus === 'waived' ? 'Waived' : 'Approved'} by: <span className="font-semibold">{inspection.approver.name}</span>
                                            {inspection.approvedAt && (
                                                <span className="ml-2">on {new Date(inspection.approvedAt).toLocaleDateString('en-GB')}</span>
                                            )}
                                        </p>
                                        {inspection.approvalNotes && (
                                            <p className="text-sm text-red-600 mt-1">Note: {inspection.approvalNotes}</p>
                                        )}
                                    </div>
                                )}
                                {/* Repair Management */}
                                <RepairManagement inspection={inspection} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99999,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex(null);
                        }}
                        style={{
                            position: 'fixed',
                            top: '16px',
                            right: '16px',
                            zIndex: 100000,
                            padding: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                    >
                        <X size={24} strokeWidth={2} />
                    </button>

                    <img
                        src={photoUrls[lightboxIndex]}
                        alt={`Photo ${lightboxIndex + 1}`}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {lightboxIndex > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(lightboxIndex - 1);
                            }}
                            style={{
                                position: 'fixed',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 100000,
                                padding: '12px 16px',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '32px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                        >
                            ‹
                        </button>
                    )}

                    {lightboxIndex < photoUrls.length - 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(lightboxIndex + 1);
                            }}
                            style={{
                                position: 'fixed',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 100000,
                                padding: '12px 16px',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '32px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                        >
                            ›
                        </button>
                    )}

                    <div
                        style={{
                            position: 'fixed',
                            bottom: '16px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 100000,
                            padding: '8px 16px',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        {lightboxIndex + 1} / {photoUrls.length}
                    </div>
                </div>
            )}
        </div>
    );
}
