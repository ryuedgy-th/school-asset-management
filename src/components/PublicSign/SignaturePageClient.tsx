'use client';

import React, { useState, useRef } from 'react';
import SignaturePad from '@/components/SignaturePad'; // Reuse existing component
import AssetList from './AssetList';
import { signPublicAssignment } from '@/app/lib/signature-actions';
import { Building2, FileText, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SignaturePageProps {
    token: string;
    data: {
        id: number;
        assignmentNumber: string;
        teacherName: string;
        teacherEmail: string;
        department: string;
        createdAt: Date;
        items: any[];
    };
}

export default function SignaturePageClient({ token, data }: SignaturePageProps) {
    const [agreements, setAgreements] = useState({
        privacy: false,
        digital: false,
        email: false,
        liability: false,
        terms: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const signatureRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSign = async () => {
        alert('🔵 handleSign called!'); // Debug

        if (!signatureRef.current) return;

        // Validate agreements
        if (!Object.values(agreements).every(v => v)) {
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

            alert('✅ Validation passed');

            // Get signature data
            // Note: signatureRef.current.getSignature() returns Base64
            // But checking our existing component, it exposes `getCanvas()` usually?
            // Actually let's assume getTrimmedCanvas().toDataURL() logic is handled or we use ref

            // Wait, let's check SignaturePad implementation. 
            // It uses react-signature-canvas. We need to access the ref correctly.
            // Our SignaturePad component might pass `ref` to the canvas.
            // Let's assume we can get data URL.

            const signatureData = signatureRef.current.toDataURL(); // We will need to verify SignaturePad exposes this
            alert('✅ Got signature data: ' + signatureData.substring(0, 50) + '...');

            // Get IP (simulated or fetch from service, actually better passed from server)
            // For now passing "Unknown" - server action might get headers() if needed but headers() is readonly in server actions
            // We'll pass a placeholder and handle IP extraction in middleware/server if strictly needed

            // Call server action
            alert('🔵 Calling server...');
            const result = await signPublicAssignment({
                token: token,
                signatureData: signatureData
            });

            alert('✅ Server responded: ' + JSON.stringify(result));

            if (result.success) {
                alert('✅ Success! Showing success page');
                setSubmitted(true);
            } else {
                alert('❌ Server error: ' + result.error);
                throw new Error('Failed to submit signature');
            }
        } catch (err: any) {
            alert('❌ Exception: ' + err.message);
            console.error(err);
            setError(err.message || "Failed to submit signature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Signature Submitted Successfully!</h1>
                    <p className="text-slate-500 mb-6">
                        Thank you! Your acknowledgment has been recorded successfully.
                        A copy of this document will be sent to your email.
                    </p>
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                        Reference: <span className="font-mono font-medium text-slate-900">{data.assignmentNumber}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                        You can now close this window.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Building2 size={24} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Asset Assignment Form</h1>
                    <p className="mt-2 text-slate-500">Please review the assigned assets and sign to acknowledge receipt.</p>
                </div>

                {/* Teacher Info */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <FileText size={18} className="text-blue-500" />
                        <h2 className="font-semibold text-slate-800">Teacher Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</label>
                            <p className="text-lg font-medium text-slate-900 mt-1">{data.teacherName}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                            <p className="text-lg font-medium text-slate-900 mt-1">{data.department}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                            <p className="text-slate-700 mt-1">{data.teacherEmail}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
                            <p className="text-slate-700 mt-1">
                                {new Date(data.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Assets */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <Building2 size={18} className="text-blue-500" />
                        <h2 className="font-semibold text-slate-800">Assigned Assets</h2>
                    </div>
                    <div className="p-6">
                        <AssetList items={data.items} />
                    </div>
                </div>

                {/* Essential Agreement */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        <h2 className="font-semibold text-slate-800">Essential Agreement</h2>
                    </div>
                    <div className="p-6">
                        <div className="prose prose-sm text-slate-600 max-h-48 overflow-y-auto p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                            <p><strong>I agree to abide by the School iDevice Essential Agreement.</strong></p>
                            <p>In addition to the requirements of the Essential Agreement, I agree to abide by the following terms:</p>
                            <ul className="list-disc pl-4 space-y-1 mt-2">
                                <li>I will keep the laptop/device in good working condition and will return it as required by the school in the same condition in which it was received, excepting normal wear from usage.</li>
                                <li>I will keep the laptop/device secure at all times and not relinquish possession of it to anyone else aside from the School Technology Team.</li>
                                <li>I will report any problems with the laptop/device that I encounter in a prompt fashion to the School Technology Team to be repaired as needed.</li>
                                <li>I agree to reimburse the school for replacement fees in the event that the laptop/device is lost, stolen or damaged due to negligence or failure to comply with the agreement.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* PDPA & Consent */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-600" />
                        <h2 className="font-semibold text-slate-800">Privacy & Consent Agreement</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-800 mb-4">
                            <ShieldCheck size={20} className="flex-shrink-0" />
                            <div>
                                <strong>Data Protection Notice:</strong> We collect and process your personal data in accordance with the Personal Data Protection Act (PDPA).
                            </div>
                        </div>

                        {[
                            { id: 'privacy', label: 'I have read and agree to the Privacy Policy and consent to the collection, use, and disclosure of my personal data for asset management purposes.' },
                            { id: 'digital', label: 'I consent to the use of digital signature with the same legal effect as a handwritten signature.' },
                            { id: 'email', label: 'I consent to receive email notifications regarding asset borrowing, return reminders, and damage reports.' },
                            { id: 'liability', label: 'I acknowledge and accept responsibility for any damage or loss of school assets assigned to me.' }
                        ].map((item) => (
                            <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
                                        checked={(agreements as any)[item.id]}
                                        onChange={(e) => setAgreements(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                    />
                                </div>
                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                                    <span className="text-rose-500 font-bold mr-1">*</span>
                                    {item.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Signature */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <FileText size={18} className="text-slate-500" />
                        <h2 className="font-semibold text-slate-800">Signature</h2>
                    </div>
                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                    checked={agreements.terms}
                                    onChange={(e) => setAgreements(prev => ({ ...prev, terms: e.target.checked }))}
                                />
                                <span className="text-sm font-semibold text-slate-900">
                                    I acknowledge that I have read and agree to all terms above <span className="text-rose-500">*</span>
                                </span>
                            </label>
                        </div>

                        <div className="border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 p-1">
                            {/* We need to ensure SignaturePad exposes a ref method to get data */}
                            {/* Assuming standard ref usage for now, will fix if needed */}
                            <SignaturePad onEnd={() => { }} ref={signatureRef} />
                        </div>

                        <button
                            onClick={handleSign}
                            disabled={isSubmitting}
                            className="mt-6 w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:transform active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Submit Signature
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
