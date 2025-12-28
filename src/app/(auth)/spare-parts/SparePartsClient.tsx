'use client';

import { useState } from 'react';
import { Package, Search, Plus, Grid, List, Trash2, Edit, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { deleteSparePart } from '@/app/lib/inventory-actions';
import { useRouter } from 'next/navigation';
import SparePartModal from '@/components/SparePartModal';
import InventoryTransactionModal from '@/components/InventoryTransactionModal';

export default function SparePartsClient({ spareParts: initialSpareParts, user, stats }: any) {
    const router = useRouter();
    const [spareParts, setSpareParts] = useState(initialSpareParts);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showSparePartModal, setShowSparePartModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedPart, setSelectedPart] = useState<any>(null);

    // Get unique categories
    const categories = Array.from(
        new Set(spareParts.map((p: any) => p.category).filter(Boolean))
    ) as string[];

    // Filter spare parts
    const filtered = spareParts.filter((part: any) => {
        const matchesSearch =
            part.name.toLowerCase().includes(search.toLowerCase()) ||
            part.partNumber.toLowerCase().includes(search.toLowerCase()) ||
            (part.supplier && part.supplier.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory =
            categoryFilter === 'all' || part.category === categoryFilter;

        const matchesStock =
            stockFilter === 'all' ||
            (stockFilter === 'low' && part.currentStock <= part.reorderPoint) ||
            (stockFilter === 'ok' && part.currentStock > part.reorderPoint);

        return matchesSearch && matchesCategory && matchesStock;
    });

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete spare part "${name}"?`)) return;

        try {
            await deleteSparePart(id);
            setSpareParts(spareParts.filter((p: any) => p.id !== id));
            alert('Spare part deleted successfully');
        } catch (error: any) {
            alert(error.message || 'Failed to delete spare part');
        }
    };

    const getStockStatus = (part: any) => {
        if (part.currentStock <= part.reorderPoint) {
            return { color: 'text-red-600 bg-red-50', label: 'Low Stock', icon: AlertTriangle };
        }
        if (part.maxStock && part.currentStock >= part.maxStock) {
            return { color: 'text-blue-600 bg-blue-50', label: 'Full', icon: TrendingUp };
        }
        return { color: 'text-green-600 bg-green-50', label: 'OK', icon: Package };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <Package className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Spare Parts Inventory</h1>
                                <p className="text-slate-500 mt-1">Manage spare parts, stock levels, and inventory transactions</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedPart(null);
                                setShowSparePartModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                            Add Spare Part
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Parts</div>
                        <div className="text-2xl font-bold text-slate-900">{stats.totalParts}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Items</div>
                        <div className="text-2xl font-bold text-primary">{stats.totalItems}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Low Stock</div>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.lowStockParts}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Value</div>
                        <div className="text-2xl font-bold text-primary">
                            ฿{stats.totalValue.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Filters & View Toggle */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search parts..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        {/* Stock Filter */}
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="all">All Stock Levels</option>
                            <option value="low">Low Stock</option>
                            <option value="ok">OK Stock</option>
                        </select>

                        {/* View Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'table'
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid View */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((part: any) => {
                            const status = getStockStatus(part);
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={part.id}
                                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{part.name}</h3>
                                            <p className="text-sm text-gray-600">
                                                {part.partNumber}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${status.color} flex items-center gap-1`}
                                        >
                                            <StatusIcon className="w-3 h-3" />
                                            {status.label}
                                        </span>
                                    </div>

                                    {part.category && (
                                        <div className="text-sm text-gray-600 mb-2">
                                            Category: {part.category}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                        <div>
                                            <div className="text-gray-600">Current Stock</div>
                                            <div className="font-semibold">
                                                {part.currentStock} {part.unit || 'units'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600">Reorder Point</div>
                                            <div className="font-semibold">{part.reorderPoint}</div>
                                        </div>
                                    </div>

                                    {part.supplier && (
                                        <div className="text-sm text-gray-600 mb-3">
                                            Supplier: {part.supplier}
                                        </div>
                                    )}

                                    {part.unitCost && (
                                        <div className="text-sm mb-3">
                                            <span className="text-gray-600">Unit Cost: </span>
                                            <span className="font-semibold">
                                                ฿{part.unitCost.toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-3 border-t border-slate-200">
                                        <button
                                            onClick={() => {
                                                setSelectedPart(part);
                                                setShowTransactionModal(true);
                                            }}
                                            className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors"
                                        >
                                            Adjust Stock
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedPart(part);
                                                setShowSparePartModal(true);
                                            }}
                                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(part.id, part.name)}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Part Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Reorder
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Unit Cost
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filtered.map((part: any) => {
                                    const status = getStockStatus(part);
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{part.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {part.partNumber}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {part.category || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                {part.currentStock} {part.unit || 'units'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {part.reorderPoint}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {part.unitCost
                                                    ? `฿${part.unitCost.toLocaleString()}`
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${status.color} inline-flex items-center gap-1`}
                                                >
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPart(part);
                                                            setShowTransactionModal(true);
                                                        }}
                                                        className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors"
                                                    >
                                                        Adjust
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPart(part);
                                                            setShowSparePartModal(true);
                                                        }}
                                                        className="p-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(part.id, part.name)
                                                        }
                                                        className="p-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Empty State */}
                {filtered.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600">No spare parts found</p>
                    </div>
                )}

                {/* Modals */}
                <SparePartModal
                    isOpen={showSparePartModal}
                    onClose={() => {
                        setShowSparePartModal(false);
                        setSelectedPart(null);
                    }}
                    sparePart={selectedPart}
                />

                <InventoryTransactionModal
                    isOpen={showTransactionModal}
                    onClose={() => {
                        setShowTransactionModal(false);
                        setSelectedPart(null);
                    }}
                    sparePart={selectedPart}
                />
            </div>
        </div>
    );
}
