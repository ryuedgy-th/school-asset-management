'use client';

import { SerializedAsset } from './AssetGrid';
import { Laptop, Tablet, Box, Pencil, Trash2, QrCode, MapPin } from 'lucide-react';
import Link from 'next/link';

interface MobileAssetCardProps {
    asset: SerializedAsset;
    isSelected: boolean;
    onToggleSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onShowQR: () => void;
}

export default function MobileAssetCard({
    asset,
    isSelected,
    onToggleSelect,
    onEdit,
    onDelete,
    onShowQR
}: MobileAssetCardProps) {
    const getIcon = (cat: string) => {
        if (cat === 'Laptop') return Laptop;
        if (cat === 'Tablet') return Tablet;
        return Box;
    };

    const Icon = getIcon(asset.category);

    return (
        <div className={`bg-white rounded-xl border-2 transition-all ${isSelected ? 'border-primary/80 bg-primary/10/30' : 'border-slate-200'
            }`}>
            {/* Header with checkbox and image */}
            <div className="p-4 flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="mt-1 rounded border-slate-300 text-primary focus:ring-primary/80 w-5 h-5"
                />

                {asset.image ? (
                    <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                        <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
                    </div>
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
                        <Icon size={28} />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <Link href={`/assets/${asset.assetCode}`} className="block">
                        <h3 className="font-bold text-slate-900 text-base leading-tight mb-1">{asset.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">{asset.assetCode}</p>
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                asset.status === 'Reserved' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                    asset.status === 'Borrowed' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                        'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                            {asset.status}
                        </span>
                        <span className="text-xs text-slate-500">{asset.category}</span>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="px-4 pb-3 space-y-2 text-sm">
                {asset.location && (
                    <div className="flex items-center gap-2 text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="text-xs">{asset.location}</span>
                    </div>
                )}
                {asset.serialNumber && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">SN:</span>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{asset.serialNumber}</span>
                    </div>
                )}
                <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">
                        Stock: <span className="font-mono font-semibold text-slate-700">{asset.currentStock} / {asset.totalStock}</span>
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 p-3 flex items-center justify-end gap-2">
                <button
                    onClick={onShowQR}
                    className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors active:scale-95"
                    title="QR Code"
                >
                    <QrCode size={20} />
                </button>
                <button
                    onClick={onEdit}
                    className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors active:scale-95"
                    title="Edit"
                >
                    <Pencil size={20} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                    title="Delete"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
}
