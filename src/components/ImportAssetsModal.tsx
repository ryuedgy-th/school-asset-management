'use client';

import { useState, useRef } from 'react';
import { Asset } from '@prisma/client';
import { Loader2, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Save } from 'lucide-react';
import Modal from './Modal';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';

interface ImportAssetsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CSVRow {
    Name?: string;
    Category: string;
    Brand?: string;
    Model?: string;
    Serial?: string;
    Stock?: string;
    Location?: string;
    [key: string]: string | undefined;
}

interface ParsedAsset {
    name: string;
    category: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
    totalStock: number;
    currentStock: number;
    purchaseDate?: string; // YYYY-MM-DD
    warrantyExp?: string; // YYYY-MM-DD
    assetCode?: string;
    status: string;
    isValid: boolean;
    errors: string[];
}

export default function ImportAssetsModal({ isOpen, onClose }: ImportAssetsModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
    const [parsedData, setParsedData] = useState<ParsedAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep('upload');
        setParsedData([]);
        setLoading(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const parseDate = (dateStr: string | undefined): string | undefined => {
        if (!dateStr || !dateStr.trim()) return undefined;

        const cleanStr = dateStr.trim();

        // 1. Try ISO (YYYY-MM-DD): 2020-04-01
        let date = new Date(cleanStr);
        if (!isNaN(date.getTime()) && cleanStr.includes('-')) return date.toISOString();

        // 2. Try MM/YYYY: 04/2020
        const mm_yyyy = /^(\d{1,2})\/(\d{4})$/;
        if (mm_yyyy.test(cleanStr)) {
            const parts = cleanStr.match(mm_yyyy);
            if (parts) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, 1).toISOString();
        }

        // 3. Try JUST YEAR: 2013
        const yyyy = /^\d{4}$/;
        if (yyyy.test(cleanStr)) {
            return new Date(parseInt(cleanStr), 0, 1).toISOString();
        }

        // 4. Try DD/MM/YYYY
        const dd_mm_yyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        if (dd_mm_yyyy.test(cleanStr)) {
            const parts = cleanStr.match(dd_mm_yyyy);
            if (parts) return new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1])).toISOString();
        }

        return undefined;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const assets: ParsedAsset[] = results.data.map((row, index) => {
                    const errors: string[] = [];

                    // Validation
                    if (!row.Name) errors.push('Name is required');
                    if (!row.Category) errors.push('Category is required');

                    // Logic: Unique vs Bulk
                    const serialNumber = row['Serial Number'] || row['Serial'] || row['SN'];
                    let stock = parseInt(row['Stock'] || row['Quantity'] || '1');

                    if (serialNumber) {
                        stock = 1; // Force stock 1 for serialized
                    } else if (isNaN(stock) || stock < 1) {
                        // Default to 1 if invalid or missing for bulk
                        stock = 1;
                    }

                    return {
                        name: row.Name || '',
                        category: row.Category,
                        brand: row.Brand,
                        model: row.Model,
                        serialNumber: serialNumber,
                        location: row.Location,
                        totalStock: stock,
                        currentStock: stock,
                        purchaseDate: parseDate(row['Purchase Date'] || row['Purchase Date ']),
                        warrantyExp: parseDate(row['Warranty Exp'] || row['Warranty Exp ']),
                        assetCode: row['Asset Code'] || row['Tag ID'],
                        status: 'Available',
                        isValid: errors.length === 0,
                        errors
                    };
                });

                setParsedData(assets);
                setStep('preview');
            },
            error: (error) => {
                console.error(error);
                alert('Error parsing CSV');
            }
        });
    };

    const handleImport = async () => {
        setLoading(true);
        setStep('importing');

        const validAssets = parsedData.filter(a => a.isValid);

        if (validAssets.length === 0) {
            alert('No valid assets to import.');
            setLoading(false);
            setStep('preview');
            return;
        }

        try {
            const res = await fetch('/api/assets/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validAssets),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.details || 'Failed to import assets');
            }

            const result = await res.json();
            const message = result.created && result.updated !== undefined
                ? `Successfully imported ${result.total} assets! (${result.created} created, ${result.updated} updated)`
                : `Successfully imported ${result.count} assets!`;
            alert(message);
            router.refresh();
            handleClose();
        } catch (error: any) {
            console.error(error);
            alert(`Import failed: ${error.message}`);
            setStep('preview');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Assets (CSV)">
            <div className="space-y-6">

                {/* Steps Indicator */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <span className={`px-2 py-1 rounded ${step === 'upload' ? 'bg-primary/20 text-primary/90 font-bold' : ''}`}>1. Upload</span>
                    <span>→</span>
                    <span className={`px-2 py-1 rounded ${step === 'preview' ? 'bg-primary/20 text-primary/90 font-bold' : ''}`}>2. Preview & Validate</span>
                    <span>→</span>
                    <span className={`px-2 py-1 rounded ${step === 'importing' ? 'bg-primary/20 text-primary/90 font-bold' : ''}`}>3. Finish</span>
                </div>

                {step === 'upload' && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}>
                            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Click to Upload CSV</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-xs">
                                Format: Asset Code (optional), Name, Category, Brand, Model, Serial, Stock, Location
                            </p>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const csvContent = "Asset Code,Name,Category,Brand,Model,Serial,Stock,Location,Purchase Date,Warranty Exp\n,Example Laptop,Laptop,Dell,XPS 13,,10,IT Room,2024-01-01,2025-01-01\nMYISC001,MacBook Pro,Laptop,Apple,M3 Max,SN-99999,1,Management,2024-03-15,2025-03-15";
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement("a");
                                    const url = URL.createObjectURL(blob);
                                    link.setAttribute("href", url);
                                    link.setAttribute("download", "asset_import_template.csv");
                                    link.style.visibility = 'hidden';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
                            >
                                <FileSpreadsheet size={16} />
                                Download CSV Template
                            </button>
                        </div>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="max-h-[400px] overflow-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                                    <tr>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Asset Code</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Stock</th>
                                        <th className="p-3">Serial</th>
                                        <th className="p-3">Brand/Model</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {parsedData.map((asset, idx) => (
                                        <tr key={idx} className={asset.isValid ? 'bg-white' : 'bg-red-50'}>
                                            <td className="p-3">
                                                {asset.isValid ? (
                                                    <CheckCircle size={16} className="text-green-500" />
                                                ) : (
                                                    <div className="flex items-center gap-1 text-red-500" title={asset.errors.join(', ')}>
                                                        <AlertCircle size={16} />
                                                        <span className="text-xs font-bold">Invalid</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 font-mono text-xs text-primary">{asset.assetCode || <span className="text-slate-400 italic">auto-generated</span>}</td>
                                            <td className="p-3 font-medium text-slate-900">{asset.name || '-'}</td>
                                            <td className="p-3 text-slate-600">{asset.category || '-'}</td>
                                            <td className="p-3 text-slate-600">
                                                {asset.totalStock}
                                                {asset.serialNumber && asset.totalStock !== 1 && <span className="text-xs text-amber-500 ml-1">(Fixed to 1)</span>}
                                            </td>
                                            <td className="p-3 font-mono text-xs text-slate-500">{asset.serialNumber || '-'}</td>
                                            <td className="p-3 text-slate-500">{asset.brand} {asset.model}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="text-sm text-slate-500">
                                <strong>{parsedData.filter(d => d.isValid).length}</strong> assets ready to import.
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={parsedData.filter(d => d.isValid).length === 0}
                                    className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-white shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    Confirm Import
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="animate-spin text-primary mb-4" size={40} />
                        <h3 className="text-lg font-bold text-slate-900">Importing Assets...</h3>
                        <p className="text-slate-500">Please wait while we process your data.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
