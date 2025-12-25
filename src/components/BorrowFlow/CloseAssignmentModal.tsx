'use client';

import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, CheckCircle2 } from 'lucide-react';
import { closeAssignment } from '@/app/lib/assignment-closure-actions';
import { useRouter } from 'next/navigation';

interface CloseAssignmentModalProps {
    assignmentId: number;
    assignmentNumber: string;
    totalItems: number;
    onClose: () => void;
}

export default function CloseAssignmentModal({
    assignmentId,
    assignmentNumber,
    totalItems,
    onClose
}: CloseAssignmentModalProps) {
    const router = useRouter();
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleInitialSubmit = () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            alert('⚠️ Please provide your signature');
            return;
        }
        setShowConfirmation(true);
    };

    const handleConfirmedSubmit = async () => {
        setShowConfirmation(false);
        setIsSubmitting(true);

        try {
            const signatureData = sigCanvas.current!.toDataURL();
            const result = await closeAssignment({
                assignmentId,
                signatureData,
                notes: notes.trim() || undefined
            });

            if (result.success) {
                alert('✅ Assignment closed successfully!');
                router.refresh();
                onClose();
            } else {
                alert('❌ ' + (result.error || 'Failed to close assignment'));
            }
        } catch (error: any) {
            console.error(error);
            alert('❌ Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Close Assignment</h2>
                        <p className="text-sm text-slate-500 mt-1">{assignmentNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-blue-600 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-blue-900">Assignment Summary</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Total items processed: <span className="font-bold">{totalItems}</span>
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                    All items have been returned and verified.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Closure Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any final notes or comments about this assignment..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Signature */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            IT Signature <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
                            <SignatureCanvas
                                ref={sigCanvas}
                                canvasProps={{
                                    className: 'w-full h-40 touch-none',
                                }}
                                backgroundColor="white"
                            />
                        </div>
                        <button
                            onClick={() => sigCanvas.current?.clear()}
                            className="mt-2 text-sm text-slate-600 hover:text-slate-900 underline"
                            type="button"
                            disabled={isSubmitting}
                        >
                            Clear Signature
                        </button>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                            ⚠️ <strong>Important:</strong> Closing this assignment will mark it as completed.
                            Only administrators can reopen closed assignments.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInitialSubmit}
                        className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Closing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} />
                                Close Assignment
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[60] rounded-2xl">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Confirm Closure</h3>
                            <p className="text-sm text-slate-600 mt-2">
                                Are you sure you want to close <span className="font-semibold text-slate-900">{assignmentNumber}</span>?
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                                This action will mark it as completed and can only be reopened by administrators.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmedSubmit}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                Yes, Close It
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
