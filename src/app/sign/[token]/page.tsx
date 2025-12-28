import { verifyAssignmentToken } from '@/app/lib/signature-actions';
import SignaturePageClient from '@/components/PublicSign/SignaturePageClient';
import { notFound } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default async function PublicSignaturePage({
    params
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params;
    const result = await verifyAssignmentToken(token);

    if (result.error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-rose-500">
                    <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Invalid or Expired</h1>
                    <p className="text-slate-500 mb-6 font-medium">
                        {result.error === "Already signed"
                            ? "This document has already been signed."
                            : "This signature link is invalid or has expired."}
                    </p>
                    <p className="text-sm text-slate-400 mt-4">
                        Please contact the IT Department if you need assistance.
                    </p>
                </div>
            </div>
        );
    }

    if (!result.success || !result.data) {
        notFound();
    }

    return <SignaturePageClient token={token} data={result.data} />;
}
