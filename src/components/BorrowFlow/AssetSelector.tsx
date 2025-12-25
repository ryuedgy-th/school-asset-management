'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Package, AlertCircle } from 'lucide-react';
import { searchAssets } from '@/app/lib/asset-search';
// We generally use server actions directly in client components in Next.js

interface Asset {
    id: number;
    name: string;
    assetCode: string;
    currentStock: number;
    image: string | null;
}

interface AssetSelectorProps {
    onSelect: (asset: Asset, quantity: number) => void;
    selectedIds: number[];
}

export default function AssetSelector({ onSelect, selectedIds }: AssetSelectorProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                try {
                    // searchAssets is a server action
                    const data = await searchAssets(query);
                    // Filter out already selected IF unique? 
                    // Actually, let parent handle duplicates or checking.
                    // But maybe hide if already selected to avoid confusion?
                    // For now, just show all.
                    setResults(data as Asset[]);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, code, or serial..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-h-60 overflow-y-auto">
                    {results.map((asset) => {
                        const isSelected = selectedIds.includes(asset.id);
                        const isStockOut = asset.currentStock <= 0;

                        // Disable if selected or no stock
                        const isDisabled = isSelected || isStockOut;

                        return (
                            <button
                                key={asset.id}
                                disabled={isDisabled}
                                onClick={() => onSelect(asset, 1)}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                                        {asset.image ? (
                                            <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="text-slate-400" size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{asset.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">{asset.assetCode}</span>
                                            {isStockOut && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={10} /> Out of Stock</span>}
                                            {!isStockOut && <span className="text-green-600">Stock: {asset.currentStock}</span>}
                                        </div>
                                    </div>
                                </div>
                                {!isDisabled && (
                                    <Plus className="text-blue-600" size={18} />
                                )}
                                {isSelected && (
                                    <span className="text-xs font-medium text-slate-400">Added</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {query.length > 1 && results.length === 0 && !loading && (
                <div className="text-center text-slate-400 text-sm py-2">
                    No assets found.
                </div>
            )}
        </div>
    );
}
