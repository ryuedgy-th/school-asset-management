'use client';

import { Asset } from '@prisma/client';
import { Printer, Link2, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';
import { useState } from 'react';

interface AssetLabelModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: {
        id: number;
        name: string;
        assetCode: string;
    };
}

export default function AssetLabelModal({ isOpen, onClose, asset }: AssetLabelModalProps) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const scanUrl = `${origin}/scan/${asset.assetCode}`;
    const [copied, setCopied] = useState(false);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(scanUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const qrSvg = document.getElementById(`qr-${asset.id}`)?.innerHTML || '';

            printWindow.document.write(`
                <html>
                <head>
                    <title>Asset Label - ${asset.name}</title>
                    <style>
                        @page {
                            size: 5cm 2.5cm;
                            margin: 0;
                        }
                        body { 
                            margin: 0;
                            padding: 0;
                            width: 5cm; 
                            height: 2.5cm;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-family: Arial, sans-serif;
                            overflow: hidden;
                        }
                        .label { 
                            width: 4.8cm; 
                            height: 2.3cm; 
                            border: 2px solid black; 
                            box-sizing: border-box;
                            display: flex; 
                            flex-direction: row; 
                            align-items: center;
                            padding: 3px;
                            gap: 5px;
                        }
                        .qr-container {
                            width: 2cm;
                            height: 2cm;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-shrink: 0;
                        }
                        .qr-container svg {
                            width: 100%;
                            height: 100%;
                        }
                        .info { 
                            flex: 1; 
                            display: flex; 
                            flex-direction: column; 
                            justify-content: center;
                            overflow: hidden;
                        }
                        .company { 
                            font-size: 7px; 
                            text-transform: uppercase; 
                            color: #666; 
                            letter-spacing: 0.3px;
                            margin-bottom: 2px;
                            font-weight: 600;
                        }
                        .school { 
                            font-size: 8px; 
                            text-transform: uppercase; 
                            color: #333; 
                            letter-spacing: 0.5px;
                            margin-bottom: 4px;
                            font-weight: 700;
                        }
                        .asset-name { 
                            font-size: 14px; 
                            font-weight: 900; 
                            color: black;
                            margin-bottom: 1px;
                            text-overflow: ellipsis;
                            overflow: hidden;
                            white-space: nowrap;
                        }
                        .footer-text {
                            font-size: 6px;
                            color: #888;
                            margin-top: 1px;
                        }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <div class="qr-container">${qrSvg}</div>
                        <div class="info">
                            <div class="company">PROPERTY OF</div>
                            <div class="school">MYIS International School</div>
                            <div class="asset-name">${asset.name}</div>
                            <div class="footer-text">Scan to view details</div>
                        </div>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 200);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Asset Label">
            <div className="flex flex-col items-center space-y-6">
                <div className="bg-white p-6 rounded-xl border-2 border-slate-900 shadow-sm w-full max-w-sm">
                    <div className="flex flex-row items-center gap-6">
                        <div id={`qr-${asset.id}`} className="shrink-0 bg-white p-1">
                            <QRCodeSVG value={scanUrl} size={100} level="M" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Property Of</span>
                            <span className="text-xs font-bold uppercase text-slate-600 mb-3">MYIS International School</span>
                            <h3 className="font-bold text-xl text-slate-900 leading-tight mb-1">
                                {asset.name.length > 15 ? asset.name.substring(0, 15) + '...' : asset.name}
                            </h3>
                            <div className="text-xs text-slate-400 mt-1">
                                Scan to view details
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {copied ? <Check size={16} /> : <Link2 size={16} />}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Print Label
                    </button>
                </div>
            </div>
        </Modal>
    );
}
