'use client';

import { useState, useMemo } from 'react';
import { Asset } from '@prisma/client';
import Link from 'next/link';
import Modal from './Modal';
import EditAssetModal from './EditAssetModal';
import AssetLabelModal from './AssetLabelModal';
import BorrowRequestModal from './BorrowRequestModal';
import BulkAssetLabelModal from './BulkAssetLabelModal';
import MobileAssetCard from './MobileAssetCard';
import { Calendar, Loader2, Laptop, Tablet, Box, Check, X, Pencil, Trash2, QrCode, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConfirm, useAlert } from '@/contexts/DialogProvider';

export type SerializedAsset = Omit<Asset, 'cost'> & {
    cost: number | null;
};

interface AssetGridProps {
    assets: SerializedAsset[];
}

export default function AssetGrid({ assets }: AssetGridProps) {
    const router = useRouter();
    const { confirm } = useConfirm();
    const { alert } = useAlert();
    const [selectedAsset, setSelectedAsset] = useState<SerializedAsset | null>(null);
    const [editingAsset, setEditingAsset] = useState<SerializedAsset | null>(null);
    const [qrAsset, setQrAsset] = useState<SerializedAsset | null>(null);
    const [loading, setLoading] = useState(false);

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showBulkPrint, setShowBulkPrint] = useState(false);

    async function handleDelete(id: number) {
        const confirmed = await confirm({
            title: 'Delete Asset',
            message: 'Are you sure you want to delete this asset? This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger'
        });

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/assets/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            router.refresh();
        } catch (error) {
            console.error(error);
            await alert({
                title: 'Error',
                message: 'Failed to delete asset',
                variant: 'error'
            });
        }
    }

    async function handleBulkDelete() {
        const count = selectedIds.size;
        const confirmed = await confirm({
            title: 'Delete Multiple Assets',
            message: `Are you sure you want to delete ${count} asset${count > 1 ? 's' : ''}? This action cannot be undone.`,
            confirmText: 'Delete All',
            variant: 'danger'
        });

        if (!confirmed) return;

        try {
            setLoading(true);
            const res = await fetch('/api/assets/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.borrowedAssets) {
                    const borrowedList = data.borrowedAssets
                        .map((a: any) => `${a.name} (${a.code})`)
                        .join('\n');
                    await alert({
                        title: 'Cannot Delete Borrowed Assets',
                        message: `The following assets are currently borrowed and cannot be deleted:\n\n${borrowedList}`,
                        variant: 'warning'
                    });
                } else {
                    throw new Error(data.error || 'Failed to delete');
                }
                return;
            }

            await alert({
                title: 'Success',
                message: `Successfully deleted ${data.deletedCount} asset${data.deletedCount > 1 ? 's' : ''}`,
                variant: 'success'
            });
            setSelectedIds(new Set());
            router.refresh();
        } catch (error) {
            console.error(error);
            await alert({
                title: 'Error',
                message: 'Failed to delete assets',
                variant: 'error'
            });
        } finally {
            setLoading(false);
        }
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === assets.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(assets.map(a => a.id)));
        }
    };

    const toggleSelect = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const getIcon = (cat: string) => {
        if (cat === 'Laptop') return Laptop;
        if (cat === 'Tablet') return Tablet;
        return Box;
    }

    // Derived state for bulk print
    const selectedAssets = useMemo(() =>
        assets.filter(a => selectedIds.has(a.id)),
        [assets, selectedIds]);

    return (
        <>
            {/* Bulk Actions Bar - Mobile Optimized */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:bottom-6 z-50 bg-slate-900 text-white px-4 md:px-6 py-3 rounded-xl shadow-2xl flex flex-wrap items-center gap-3 md:gap-6 animate-in slide-in-from-bottom-4 duration-200">
                    <span className="font-medium text-sm">{selectedIds.size} items</span>
                    <div className="h-4 w-px bg-slate-700 hidden sm:block" />
                    <button
                        onClick={() => setShowBulkPrint(true)}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                        <Printer size={16} />
                        <span className="hidden sm:inline">Print</span>
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span className="hidden sm:inline">Deleting...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">Delete</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50 ml-auto"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {assets.map((asset) => (
                    <MobileAssetCard
                        key={asset.id}
                        asset={asset}
                        isSelected={selectedIds.has(asset.id)}
                        onToggleSelect={() => toggleSelect(asset.id)}
                        onEdit={() => setEditingAsset(asset)}
                        onDelete={() => handleDelete(asset.id)}
                        onShowQR={() => setQrAsset(asset)}
                    />
                ))}
                {assets.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Box size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="font-medium text-slate-500">No assets found</p>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-[40px]">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === assets.length && assets.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-[40px]"></th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Asset Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Category</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Location / Serial</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Stock</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assets.map((asset) => {
                                const Icon = getIcon(asset.category);
                                const isSelected = selectedIds.has(asset.id);
                                return (
                                    <tr key={asset.id} className={`group transition-colors ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50/50'}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(asset.id)}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            {asset.image ? (
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                                    <img src={asset.image} alt={asset.name} className="h-full w-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-sm">
                                                    <Icon size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/assets/${asset.id}`} className="flex flex-col hover:text-blue-600 transition-colors">
                                                <span className="font-semibold text-slate-900">{asset.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{asset.assetCode}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {asset.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                    asset.status === 'Reserved' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                                        asset.status === 'Borrowed' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                            'bg-rose-50 text-rose-700 border border-rose-100'
                                                }`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex flex-col gap-1">
                                                {asset.location && (
                                                    <span className="flex items-center gap-1 text-xs">
                                                        <span className="opacity-50">Loc:</span> {asset.location}
                                                    </span>
                                                )}
                                                {asset.serialNumber && (
                                                    <span className="flex items-center gap-1 text-[10px] font-mono bg-slate-100 px-1.5 rounded w-fit">
                                                        SN: {asset.serialNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600">
                                            {asset.totalStock === 1 ? (
                                                <span className={asset.status === 'Available' ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                                                    {asset.status === 'Available' ? 1 : 0} / 1
                                                </span>
                                            ) : (
                                                <span>{asset.currentStock} / {asset.totalStock}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setQrAsset(asset)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="QR Code"
                                                >
                                                    <QrCode size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingAsset(asset)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {assets.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Box size={40} className="text-slate-300 mb-4" />
                                            <p className="font-medium">No assets found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedAsset && (
                <BorrowRequestModal
                    isOpen={!!selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    asset={selectedAsset}
                />
            )}

            {editingAsset && (
                <EditAssetModal
                    isOpen={!!editingAsset}
                    onClose={() => setEditingAsset(null)}
                    asset={editingAsset}
                />
            )}

            {qrAsset && (
                <AssetLabelModal
                    isOpen={!!qrAsset}
                    onClose={() => setQrAsset(null)}
                    asset={qrAsset}
                />
            )}

            {showBulkPrint && (
                <BulkAssetLabelModal
                    isOpen={showBulkPrint}
                    onClose={() => setShowBulkPrint(false)}
                    assets={selectedAssets}
                />
            )}
        </>
    );
}
