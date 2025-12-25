'use client';

import { Asset } from '@prisma/client';
import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';

interface BulkAssetLabelModalProps {
    isOpen: boolean;
    onClose: () => void;
    assets: {
        id: number;
        name: string;
        assetCode: string;
    }[];
}

export default function BulkAssetLabelModal({ isOpen, onClose, assets }: BulkAssetLabelModalProps) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            // Generate HTML for all assets
            const labelsHtml = assets.map(asset => {
                const svgContent = document.getElementById(`bulk-qr-${asset.id}`)?.innerHTML || 'QR Error';

                return `
                    <div class="label">
                        <div class="qr-container">${svgContent}</div>
                        <div class="info">
                            <div class="company">PROPERTY OF</div>
                            <div class="school">MYIS International School</div>
                            <div class="asset-name">${asset.name}</div>
                            <div class="footer-text">Scan to view details</div>
                        </div>
                    </div>
                 `;
            }).join('');

            printWindow.document.write(`
                <html>
                <head>
                    <title>Bulk Asset Labels</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 1cm;
                        }
                        body { 
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                        }
                        .grid-container {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                        }
                        .label { 
                            width: 100%; 
                            height: 2.5cm; 
                            border: 2px solid black; 
                            box-sizing: border-box;
                            display: flex; 
                            flex-direction: row; 
                            align-items: center;
                            padding: 3px;
                            gap: 5px;
                            page-break-inside: avoid;
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
                    <div class="grid-container">
                        ${labelsHtml}
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Print ${assets.length} Labels`}>
            <div className="flex flex-col space-y-6">
                <div className="max-h-[60vh] overflow-y-auto space-y-4 p-2">
                    {assets.map(asset => (
                        <div key={asset.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div id={`bulk-qr-${asset.id}`} className="shrink-0 bg-white p-1 border border-slate-100 rounded">
                                <QRCodeSVG value={`${origin}/scan/${asset.assetCode}`} size={60} level="M" />
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-[10px] text-slate-400 uppercase mb-1">Property of MYIS International School</div>
                                <h4 className="font-bold text-slate-900 truncate">{asset.name}</h4>
                                <p className="text-xs text-slate-400 mt-1">Scan to view details</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="w-full flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Print All {assets.length} Labels
                    </button>
                </div>
            </div>
        </Modal>
    );
}
