'use client';

import { useState, useRef } from 'react';
import SignaturePad from '@/components/SignaturePad';
import { signBorrowTransaction } from '@/app/lib/borrow-transaction-signature';
import { CheckCircle, Package, Image as ImageIcon } from 'lucide-react';

interface TransactionData {
    id: number;
    transactionNumber: string;
    assignmentNumber: string;
    teacherName: string;
    teacherEmail: string;
    department: string;
    borrowDate: Date;
    items: Array<{
        assetCode: string;
        name: string;
        category: string;
        serialNumber: string | null;
        condition: string;
        notes: string;
        inspection?: {
            exteriorCondition: string | null;
            screenCondition: string | null;
            buttonPortCondition: string | null;
            keyboardCondition: string | null;
            touchpadCondition: string | null;
            batteryHealth: string | null;
            exteriorNotes: string | null;
            screenNotes: string | null;
            buttonPortNotes: string | null;
            keyboardNotes: string | null;
            photos: string[];
        } | null;
    }>;
    inspection?: {
        condition: string;
        photos: string[];
        date: Date;
    } | null;
}

export default function TransactionSignatureClient({
    token,
    data
}: {
    token: string;
    data: TransactionData;
}) {
    const signatureRef = useRef<any>(null);
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleSign = async () => {
        if (!signatureRef.current) return;

        if (!agreed) {
            setError("Please accept all terms and conditions to proceed.");
            return;
        }

        if (signatureRef.current.isEmpty()) {
            setError("Please provide your signature.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const signatureData = signatureRef.current.toDataURL();

            const result = await signBorrowTransaction({
                token: token,
                signatureData: signatureData
            });

            if (result.success) {
                setSubmitted(true);
            } else {
                throw new Error(result.error || 'Failed to submit signature');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to submit signature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Transaction Signed Successfully!</h1>
                    <p className="text-sm md:text-base text-slate-500 mb-6">
                        Thank you! Your acknowledgment for these additional items has been recorded.
                    </p>
                    <div className="space-y-2 mb-6">
                        <div className="p-3 bg-slate-50 rounded-lg text-sm">
                            <span className="text-slate-600">Transaction:</span>{' '}
                            <span className="font-mono font-medium text-slate-900 break-all">{data.transactionNumber}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg text-sm">
                            <span className="text-slate-600">Assignment:</span>{' '}
                            <span className="font-mono font-medium text-slate-900 break-all">{data.assignmentNumber}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">
                        You can now close this window.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#F5F5F7] p-4 md:p-8 font-sans">
            <div className="w-full max-w-4xl">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">
                    {/* Minimalist Header */}
                    <div className="p-8 md:p-10 border-b border-slate-100 bg-white bg-opacity-80 backdrop-blur-xl sticky top-0 z-10 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Package size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Equipment Assignment</h1>
                                    <div className="flex items-center gap-3 mt-1 text-sm font-medium text-slate-500">
                                        <span>Transaction #{data.transactionNumber}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span>{new Date(data.borrowDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-end">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Assignment ID</span>
                                    <span className="text-sm font-bold text-slate-900 font-mono tracking-wide">{data.assignmentNumber}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-10 space-y-10">
                        {/* Borrower Info Card */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Borrower</h3>
                                    <p className="text-lg font-semibold text-slate-900">{data.teacherName}</p>
                                    <p className="text-sm text-slate-500">{data.teacherEmail}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Department</h3>
                                    <p className="text-lg font-semibold text-slate-900">{data.department}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    Items to Receive
                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-sm font-medium">{data.items.length}</span>
                                </h2>
                            </div>

                            <div className="grid gap-6">
                                {data.items.map((item, idx) => (
                                    <div key={idx} className="group relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                                                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md tracking-wide">
                                                        {item.assetCode}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium">{item.category}</p>
                                            </div>
                                            <span className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${item.condition.toLowerCase() === 'excellent' || item.condition.toLowerCase() === 'good' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                item.condition.toLowerCase() === 'fair' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    item.condition.toLowerCase() === 'poor' || item.condition.toLowerCase() === 'broken' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                        'bg-gray-100 text-gray-700 border border-gray-200'
                                                }`}>
                                                {item.condition.charAt(0).toUpperCase() + item.condition.slice(1).toLowerCase()}
                                            </span>
                                        </div>

                                        {item.serialNumber && (
                                            <div className="mb-6 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 inline-flex px-3 py-1.5 rounded-lg">
                                                <span className="font-semibold text-slate-400">SN:</span>
                                                <span className="font-mono">{item.serialNumber}</span>
                                            </div>
                                        )}

                                        {/* Detailed Inspection */}
                                        {item.inspection && (
                                            <div className="mt-6 pt-6 border-t border-slate-100">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="bg-secondary/10 p-1.5 rounded-full text-secondary">
                                                        <CheckCircle size={14} />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-900">Condition Assessment</h4>
                                                </div>

                                                <div className="rounded-xl border border-slate-100 overflow-hidden text-sm">
                                                    <div className="grid grid-cols-3 bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider p-3 border-b border-slate-100">
                                                        <div>Component</div>
                                                        <div>Status</div>
                                                        <div>Notes</div>
                                                    </div>

                                                    {[
                                                        { label: 'Exterior', value: item.inspection.exteriorCondition, notes: item.inspection.exteriorNotes },
                                                        { label: 'Screen', value: item.inspection.screenCondition, notes: item.inspection.screenNotes },
                                                        { label: 'Buttons/Ports', value: item.inspection.buttonPortCondition, notes: item.inspection.buttonPortNotes },
                                                        { label: 'Keyboard', value: item.inspection.keyboardCondition, notes: item.inspection.keyboardNotes },
                                                        { label: 'Touchpad', value: item.inspection.touchpadCondition, notes: null },
                                                        { label: 'Battery', value: item.inspection.batteryHealth, notes: null },
                                                    ].map((row, i) => row.value && (
                                                        <div key={i} className="grid grid-cols-3 p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors items-center">
                                                            <div className="font-medium text-slate-700">{row.label}</div>
                                                            <div>
                                                                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                                                    {row.value.replace(/_/g, ' ')}
                                                                </span>
                                                            </div>
                                                            <div className="text-slate-400 italic text-xs truncate pr-2">
                                                                {row.notes || '—'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Photos Grid */}
                                                {item.inspection.photos && item.inspection.photos.length > 0 && (
                                                    <div className="mt-4">
                                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                            {item.inspection.photos.map((photo, pIdx) => (
                                                                <button
                                                                    key={pIdx}
                                                                    onClick={() => setSelectedImage(photo)}
                                                                    className="relative flex-none w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all"
                                                                >
                                                                    <img src={photo} className="w-full h-full object-cover" alt="Condition" />
                                                                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Agreement Section */}
                        <div className="bg-[#FBFBFD] border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="p-6 md:p-8">
                                <h3 className="font-bold text-slate-900 text-lg mb-4">Essential Agreement</h3>

                                <div className="prose prose-sm prose-slate max-w-none text-slate-600 space-y-4 leading-relaxed">
                                    <p className="font-medium text-slate-800">
                                        By signing below, I acknowledge reading and agreeing to the MYIS iDevice Essential Agreement and the following terms:
                                    </p>
                                    <ul className="list-disc pl-4 space-y-2 marker:text-slate-400">
                                        <li>I will keep the equipment in good working condition and return it in the condition received, excepting normal wear.</li>
                                        <li>I will maintain security of the equipment and not relinquish possession to unauthorized persons.</li>
                                        <li>I will promptly report any damages or issues to the School Technology Team.</li>
                                        <li>I understand I may be liable for replacement fees if the equipment is lost, stolen, or damaged due to negligence.</li>
                                    </ul>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={agreed}
                                                onChange={(e) => setAgreed(e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="h-6 w-6 border-2 border-slate-300 rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all group-hover:border-primary/50"></div>
                                            <svg className="absolute w-4 h-4 text-white left-1 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className={`text-sm font-medium transition-colors ${agreed ? 'text-primary' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                            I verify that all information above is correct and I accept the terms of this agreement.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Signature Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 text-lg">Digital Signature</h3>
                                <p className="text-xs text-slate-400">Sign in the box below</p>
                            </div>
                            <div className="border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white hover:border-slate-300 transition-colors">
                                <SignaturePad ref={signatureRef} />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSign}
                            disabled={isSubmitting}
                            className="w-full py-4 px-6 bg-primary hover:bg-[#4a3582] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-200 text-lg"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Processing...
                                </span>
                            ) : 'Complete & Sign Assignment'}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-xs font-medium">
                        School Asset Management • Powered by IT Department
                    </p>
                </div>
            </div >

            {/* Image Modal - Fixed Close Button */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl animate-in fade-in duration-300 flex items-center justify-center p-4 sm:p-8"
                    onClick={() => setSelectedImage(null)}
                >
                    {/* Fixed Close Button at Top Right of Viewport */}
                    <button
                        className="fixed top-6 right-6 z-[110] p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-full transition-all shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                        }}
                    >
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="relative max-w-7xl max-h-screen w-full flex items-center justify-center pointer-events-none">
                        <img
                            src={selectedImage}
                            alt="Full size"
                            className="max-h-[90vh] max-w-full w-auto object-contain rounded-lg shadow-2xl pointer-events-auto"
                        />
                    </div>
                </div>
            )}
        </div >
    );
}
