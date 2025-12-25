'use client';

import { Asset } from '@prisma/client';
import { Loader2, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useRouter } from 'next/navigation';

interface EditAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: {
        id: number;
        name: string;
        assetCode: string;
        category: string;
        brand: string | null;
        model: string | null;
        serialNumber: string | null;
        purchaseDate: Date | null;
        warrantyExp: Date | null;
        location: string | null;
        status: string;
        image: string | null;
        totalStock: number;
        currentStock: number;
        cost?: number | any; // Allow number or Decimal (for now) or just omit cost if unused
    };
}

export default function EditAssetModal({ isOpen, onClose, asset }: EditAssetModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch(`/api/assets/${asset.id}`, {
                method: 'PATCH',
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to update asset');

            router.refresh();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error updating asset');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Asset">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Asset Image</label>
                    <div className="flex items-center gap-4">
                        {asset.image && (
                            <img src={asset.image} alt="Current" className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
                        )}
                        <input
                            type="file"
                            name="image"
                            accept="image/*"
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                            "
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Asset Name</label>
                    <input
                        name="name"
                        defaultValue={asset.name}
                        required
                        className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Asset Code</label>
                        <input
                            name="assetCode"
                            defaultValue={asset.assetCode}
                            required
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</label>
                        <input
                            name="location"
                            defaultValue={asset.location || ''}
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="e.g. Room 101"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand</label>
                        <input
                            name="brand"
                            defaultValue={asset.brand || ''}
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</label>
                        <input
                            name="model"
                            defaultValue={asset.model || ''}
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                        <select
                            name="category"
                            defaultValue={asset.category}
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                            <option value="Laptop">Laptop</option>
                            <option value="Tablet">Tablet</option>
                            <option value="Camera">Camera</option>
                            <option value="Projector">Projector</option>
                            <option value="Accessory">Accessory</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
                        <select
                            name="status"
                            defaultValue={asset.status}
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                            <option value="Available">Available</option>
                            <option value="Borrowed">Borrowed</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Broken">Broken</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Stock</label>
                        <input
                            type="number"
                            name="totalStock"
                            defaultValue={asset.totalStock}
                            disabled={!!asset.serialNumber} // Disable if serialized
                            min={1}
                            required
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {asset.serialNumber && <p className="text-[10px] text-slate-400">Fixed for serialized assets</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Stock</label>
                        <input
                            type="number"
                            name="currentStock"
                            defaultValue={asset.currentStock}
                            disabled={!!asset.serialNumber} // Disable if serialized
                            min={0}
                            required
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Serial Number</label>
                    <input
                        name="serialNumber"
                        defaultValue={asset.serialNumber || ''}
                        className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="Optional"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchase Date</label>
                        <input
                            type="date"
                            name="purchaseDate"
                            defaultValue={asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : ''}
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Warranty Exp.</label>
                        <input
                            type="date"
                            name="warrantyExp"
                            defaultValue={asset.warrantyExp ? new Date(asset.warrantyExp).toISOString().split('T')[0] : ''}
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 p-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={16} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
}
