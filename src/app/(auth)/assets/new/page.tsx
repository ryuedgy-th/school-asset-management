'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, PackagePlus, Laptop, Box } from 'lucide-react';
import Link from 'next/link';

export default function NewAssetPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [assetType, setAssetType] = useState<'unique' | 'bulk'>('unique');
    const [stock, setStock] = useState(1);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        // Explicitly handle stock logic if needed, but FormData already contains the inputs
        // "totalStock" and "currentStock" inputs will be in formData if they have name attribute
        // Since we are now sending formData directly to API, we ensure API handles it (it does).

        // Ensure defaults for unique items logic injection if form inputs were strictly controlled
        if (assetType === 'unique') {
            formData.set('totalStock', '1');
            formData.set('currentStock', '1');
        }

        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                // body: formData, // fetch automatically sets Content-Type to multipart/form-data
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to create asset');

            router.push('/assets');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Error creating asset');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <Link href="/assets" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-8 transition-colors">
                <ArrowLeft size={16} className="mr-2" />
                Back to Assets
            </Link>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-8">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/80/30">
                            <PackagePlus size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Add New Asset</h1>
                            <p className="text-slate-500">Register new equipment into the inventory system.</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            {/* Basic Info Section */}
                            <div className="grid gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Asset Image</label>
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-primary/10 file:text-primary/90
                                            hover:file:bg-primary/20
                                        "
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Asset Name</label>
                                    <input
                                        name="name"
                                        required
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all placeholder:text-slate-400"
                                        placeholder="e.g. MacBook Pro 14 M3 Max"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Category</label>
                                        <select
                                            name="category"
                                            className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all cursor-pointer"
                                        >
                                            <option value="Laptop">Laptop</option>
                                            <option value="Tablet">Tablet</option>
                                            <option value="Camera">Camera</option>
                                            <option value="Projector">Projector</option>
                                            <option value="Accessory">Accessory</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 opacity-60">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Stock Quantity</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="totalStock"
                                                value={stock}
                                                onChange={(e) => setStock(Number(e.target.value))}
                                                disabled={assetType === 'unique'}
                                                min={1}
                                                required
                                                className="block w-full rounded-xl border-slate-200 bg-slate-100 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all text-slate-500 disabled:opacity-75 disabled:cursor-not-allowed"
                                            />
                                            {assetType === 'unique' && (
                                                <div className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
                                                    Fixed: 1
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Asset Type Selection */}
                            <div className="flex gap-4 p-1 bg-slate-100/50 rounded-xl border border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => { setAssetType('unique'); setStock(1); }}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${assetType === 'unique'
                                        ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:bg-slate-200/50'
                                        }`}
                                >
                                    <Laptop size={18} />
                                    Unique Item
                                    <span className="text-[10px] font-normal opacity-75 hidden sm:inline">(Serialize, Stock=1)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAssetType('bulk')}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${assetType === 'bulk'
                                        ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:bg-slate-200/50'
                                        }`}
                                >
                                    <Box size={18} />
                                    Bulk Stock
                                    <span className="text-[10px] font-normal opacity-75 hidden sm:inline">(Cables, Parts)</span>
                                </button>
                            </div>

                            {/* Enterprise Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Brand</label>
                                    <input
                                        name="brand"
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all placeholder:text-slate-400"
                                        placeholder="e.g. Apple"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Model</label>
                                    <input
                                        name="model"
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all placeholder:text-slate-400"
                                        placeholder="e.g. MacBook Pro M3"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Asset Code (Tag ID)</label>
                                    <input
                                        name="assetCode"
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all placeholder:text-slate-400"
                                        placeholder="Auto-generated if empty"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Location</label>
                                    <input
                                        name="location"
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all placeholder:text-slate-400"
                                        placeholder="e.g. IT Room"
                                    />
                                </div>
                            </div>

                            {/* Specifics Section */}
                            {assetType === 'unique' && (
                                <div className="rounded-xl border border-primary/20 bg-primary/10/30 p-6 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Serial Number</label>
                                    <input
                                        name="serialNumber"
                                        required
                                        className="block w-full rounded-xl border-blue-200 bg-white p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all placeholder:text-slate-400"
                                        placeholder="e.g. SN-12345678"
                                    />
                                    <p className="text-xs text-primary/70 pt-1 font-medium">Unique Identifier for this specific unit.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Purchase Date</label>
                                    <input
                                        type="date"
                                        name="purchaseDate"
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-1">Warranty Expires</label>
                                    <input
                                        type="date"
                                        name="warrantyExp"
                                        className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/80/10 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                            <Link href="/assets" className="px-6 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 rounded-xl text-sm font-bold bg-primary text-white shadow-xl shadow-primary/80/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Save Asset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
