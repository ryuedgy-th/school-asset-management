'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, Link as LinkIcon } from 'lucide-react';

interface QRPrintModalProps {
    assetId?: number;
    assetIds?: number[];
    isOpen: boolean;
    onClose: () => void;
}

export default function QRPrintModal({ assetId, assetIds, isOpen, onClose }: QRPrintModalProps) {
    const [loading, setLoading] = useState(false);
    const [qrData, setQrData] = useState<any[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchQRData();
        }
    }, [isOpen, assetId, assetIds]);

    const fetchQRData = async () => {
        setLoading(true);
        try {
            if (assetId) {
                // Single asset
                const res = await fetch(`/api/fm-assets/${assetId}/qr`);
                const data = await res.json();
                setQrData([{ ...data.asset, qrCode: data.qrCode }]);
            } else if (assetIds && assetIds.length > 0) {
                // Bulk assets
                const res = await fetch('/api/fm-assets/bulk-qr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assetIds })
                });
                const data = await res.json();
                setQrData(data.qrCodes || []);
            }
        } catch (error) {
            console.error('Error fetching QR codes:', error);
            alert('Failed to generate QR codes');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Create a canvas for all QR codes
        qrData.forEach((asset, index) => {
            const link = document.createElement('a');
            link.href = asset.qrCode;
            link.download = `${asset.assetCode}-qr.png`;
            link.click();
        });
    };

    const handleCopyLink = () => {
        if (qrData.length === 1) {
            // Single asset - copy scan link
            const scanUrl = `${window.location.origin}/scan/${qrData[0].assetCode}`;
            navigator.clipboard.writeText(scanUrl).then(() => {
                alert('Scan link copied to clipboard!');
            });
        } else {
            // Multiple assets - copy all links
            const links = qrData.map(asset =>
                `${window.location.origin}/scan/${asset.assetCode}`
            ).join('\n');
            navigator.clipboard.writeText(links).then(() => {
                alert(`${qrData.length} scan links copied to clipboard!`);
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between print:hidden">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Print QR Codes</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {qrData.length} label(s) ready to print
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <LinkIcon size={18} />
                                Copy Link
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <Download size={18} />
                                Download
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-slate-600">Generating QR codes...</p>
                                </div>
                            </div>
                        ) : (
                            <div ref={printRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-6">
                                {qrData.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className="border-2 border-slate-300 rounded-lg p-4 bg-white print:break-inside-avoid print:border-2 print:border-black print:p-4"
                                        style={{ pageBreakInside: 'avoid' }}
                                    >
                                        {/* QR Code - Centered and larger */}
                                        <div className="flex justify-center mb-3">
                                            <img
                                                src={asset.qrCode}
                                                alt={`QR Code for ${asset.assetCode}`}
                                                className="w-48 h-48 print:w-48 print:h-48"
                                            />
                                        </div>

                                        {/* Asset Information */}
                                        <div className="space-y-1.5 text-center border-t-2 border-slate-200 pt-3 print:border-t-2 print:border-black print:pt-3">
                                            {/* Asset Code - Bold and Large */}
                                            <div className="font-mono text-xl font-bold text-slate-900 print:text-2xl print:font-bold">
                                                {asset.assetCode}
                                            </div>

                                            {/* Asset Name */}
                                            <div className="text-base font-semibold text-slate-800 print:text-lg print:font-semibold">
                                                {asset.name}
                                            </div>

                                            {/* Category */}
                                            <div className="text-sm text-slate-600 print:text-base">
                                                {asset.category}
                                            </div>

                                            {/* Location */}
                                            <div className="text-sm text-slate-600 font-medium print:text-base print:font-medium">
                                                📍 {asset.location}
                                                {asset.building && ` • ${asset.building}`}
                                                {asset.floor && ` Floor ${asset.floor}`}
                                                {asset.room && ` Room ${asset.room}`}
                                            </div>

                                            {/* School Name */}
                                            <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100 print:text-sm print:border-t print:border-slate-300 print:pt-2 print:mt-2">
                                                MYIS International School
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:block,
                    .print\\:block * {
                        visibility: visible;
                    }
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                }
            `}</style>
        </>
    );
}
