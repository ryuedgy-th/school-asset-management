'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, Plus, Package, Filter } from 'lucide-react';
import { createBorrowTransaction, getAllAvailableAssets } from '@/app/lib/borrow-actions';

interface Asset {
    id: number;
    name: string;
    assetCode: string;
    category: string;
    status: string;
    currentStock: number;
    brand: string | null;
    model: string | null;
    image: string | null;
}

interface AddAssetModalProps {
    assignmentId: number;
    onClose: () => void;
}

export default function AddAssetModal({ assignmentId, onClose }: AddAssetModalProps) {
    const router = useRouter();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('available');
    const [categories, setCategories] = useState<string[]>([]);

    // Load all assets on mount
    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            try {
                const allAssets = await getAllAvailableAssets();
                setAssets(allAssets);
                setFilteredAssets(allAssets.filter(a => a.status === 'Available' && a.currentStock > 0));

                // Extract unique categories
                const uniqueCategories = Array.from(new Set(
                    allAssets.map(a => a.category).filter(Boolean)
                )) as string[];
                setCategories(uniqueCategories.sort());
            } catch (error) {
                console.error('Failed to load assets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, []);

    // Filter assets
    useEffect(() => {
        let filtered = assets;

        // Status filter
        if (statusFilter === 'available') {
            filtered = filtered.filter(a => a.status === 'Available' && a.currentStock > 0);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(a => a.category === categoryFilter);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(query) ||
                a.assetCode.toLowerCase().includes(query) ||
                a.brand?.toLowerCase().includes(query) ||
                a.model?.toLowerCase().includes(query)
            );
        }

        setFilteredAssets(filtered);
    }, [searchQuery, categoryFilter, statusFilter, assets]);

    const handleSubmit = async () => {
        if (selectedAssets.length === 0) return;
        setIsSubmitting(true);
        try {
            await createBorrowTransaction({
                assignmentId,
                items: selectedAssets.map(a => ({ assetId: a.id, quantity: 1 })),
                notes: 'Added via Dashboard'
            });
            router.refresh();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to add items');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
                    <div>
                        <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                            <Plus className="text-blue-600" size={24} />
                            Add Assets to Assignment
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">Select items to assign to this teacher</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-slate-200 bg-white space-y-3 flex-shrink-0">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, code, brand, or model..."
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Category & Status Filters */}
                    <div className="flex flex-wrap gap-2 pb-2">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2 pr-2 border-r border-slate-300 mr-2">
                            <Filter size={16} className="text-slate-400" />
                            <button
                                onClick={() => setStatusFilter('available')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${statusFilter === 'available'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Available Only
                            </button>
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${statusFilter === 'all'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                All Status
                            </button>
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                            <button
                                onClick={() => setCategoryFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                All Categories
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Asset List */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-slate-500">Loading assets...</p>
                            </div>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Package size={48} className="mx-auto mb-3 text-slate-300" />
                                <p className="font-medium text-slate-600">No assets found</p>
                                <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredAssets.map(asset => {
                                const isSelected = selectedAssets.some(a => a.id === asset.id);
                                const isAvailable = asset.status === 'Available' && asset.currentStock > 0;

                                return (
                                    <button
                                        key={asset.id}
                                        disabled={!isAvailable || isSelected}
                                        onClick={() => !isSelected && setSelectedAssets([...selectedAssets, asset])}
                                        className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                            ? 'bg-blue-50 border-blue-300 opacity-60'
                                            : isAvailable
                                                ? 'hover:bg-slate-50 border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            {/* Image */}
                                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {asset.image ? (
                                                    <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="text-slate-400" size={24} />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-slate-800 truncate">{asset.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{asset.assetCode}</div>
                                                {(asset.brand || asset.model) && (
                                                    <div className="text-xs text-slate-400 mt-1 truncate">
                                                        {asset.brand} {asset.model}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                                                        {asset.category}
                                                    </span>
                                                    {isAvailable ? (
                                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                            Available ({asset.currentStock})
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                                            {asset.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Results count */}
                    {!loading && filteredAssets.length > 0 && (
                        <div className="text-xs text-slate-500 text-center mt-4">
                            Showing {filteredAssets.length} of {assets.length} assets
                        </div>
                    )}
                </div>

                {/* Selected Summary */}
                {selectedAssets.length > 0 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <div className="text-sm font-semibold text-slate-700 mb-3">
                            Selected ({selectedAssets.length} {selectedAssets.length === 1 ? 'item' : 'items'})
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4 max-h-24 overflow-y-auto">
                            {selectedAssets.map(asset => (
                                <span key={asset.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-blue-200 text-blue-700 rounded-lg text-sm shadow-sm">
                                    <Package size={14} />
                                    <span className="font-medium">{asset.name}</span>
                                    <button
                                        onClick={() => setSelectedAssets(selectedAssets.filter(a => a.id !== asset.id))}
                                        className="hover:text-red-500 ml-1 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus size={20} />
                                    Confirm Add {selectedAssets.length} {selectedAssets.length === 1 ? 'Asset' : 'Assets'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
