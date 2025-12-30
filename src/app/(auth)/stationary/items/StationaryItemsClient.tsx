'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Package, TrendingDown, TrendingUp } from 'lucide-react';
import Swal from 'sweetalert2';
import ItemModal from './ItemModal';

interface StationaryItemsClientProps {
    items: any[];
    categories: any[];
    user: any;
}

export default function StationaryItemsClient({ items, categories, user }: StationaryItemsClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterStockLevel, setFilterStockLevel] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Filter items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = searchQuery === '' ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = filterCategory === 'all' || item.categoryId === parseInt(filterCategory);
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && item.isActive) ||
                (filterStatus === 'inactive' && !item.isActive);

            // Calculate total stock across all locations
            const totalStock = item.stock.reduce((sum: number, s: any) => sum + s.quantity, 0);
            const matchesStockLevel = filterStockLevel === 'all' ||
                (filterStockLevel === 'low' && totalStock <= (item.reorderLevel || 0)) ||
                (filterStockLevel === 'out' && totalStock === 0) ||
                (filterStockLevel === 'ok' && totalStock > (item.reorderLevel || 0));

            return matchesSearch && matchesCategory && matchesStatus && matchesStockLevel;
        });
    }, [items, searchQuery, filterCategory, filterStatus, filterStockLevel]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalItems = items.length;
        const activeItems = items.filter(i => i.isActive).length;
        const lowStock = items.filter(i => {
            const total = i.stock.reduce((sum: number, s: any) => sum + s.quantity, 0);
            return total <= (i.reorderLevel || 0) && total > 0;
        }).length;
        const outOfStock = items.filter(i => {
            const total = i.stock.reduce((sum: number, s: any) => sum + s.quantity, 0);
            return total === 0;
        }).length;

        return { totalItems, activeItems, lowStock, outOfStock };
    }, [items]);

    const handleDelete = async (item: any) => {
        const result = await Swal.fire({
            title: 'Delete Item?',
            text: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/stationary/items/${item.itemCode}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Failed to delete item');
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Item has been deleted successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });

                window.location.reload();
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to delete item',
                });
            }
        }
    };

    const getTotalStock = (item: any) => {
        return item.stock.reduce((sum: number, s: any) => sum + s.quantity, 0);
    };

    const getStockBadge = (item: any) => {
        const total = getTotalStock(item);
        if (total === 0) {
            return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Out of Stock</span>;
        }
        if (total <= (item.reorderLevel || 0)) {
            return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
        }
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">In Stock</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                                <Package className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Stationary Items</h1>
                                <p className="text-slate-500 mt-1">Manage stationary items and inventory</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedItem(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            <Plus size={20} />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Items</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalItems}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Active Items</p>
                                <p className="text-2xl font-bold text-green-600">{stats.activeItems}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Low Stock</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <TrendingDown className="text-yellow-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Out of Stock</p>
                                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <Package className="text-red-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-slate-600" />
                        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Stock Level</label>
                            <select
                                value={filterStockLevel}
                                onChange={(e) => setFilterStockLevel(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Levels</option>
                                <option value="ok">In Stock</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Item Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">UOM</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Stock</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Reorder Level</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            No items found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm text-slate-900">{item.itemCode}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">{item.name}</p>
                                                    {item.description && (
                                                        <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-700">{item.category?.name || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-700">{item.uom}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900">{getTotalStock(item)}</span>
                                                    {getStockBadge(item)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-700">{item.reorderLevel || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results count */}
                <div className="mt-4 text-center text-sm text-slate-600">
                    Showing {filteredItems.length} of {items.length} items
                </div>
            </div>

            {/* Item Modal */}
            {showModal && (
                <ItemModal
                    item={selectedItem}
                    categories={categories}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedItem(null);
                    }}
                />
            )}
        </div>
    );
}
