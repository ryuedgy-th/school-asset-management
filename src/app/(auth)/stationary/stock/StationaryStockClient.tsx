'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Plus, ArrowRightLeft, TrendingDown, TrendingUp, Warehouse, AlertTriangle } from 'lucide-react';
import AdjustStockModal from './AdjustStockModal';
import TransferStockModal from './TransferStockModal';

interface StationaryStockClientProps {
    stock: any[];
    items: any[];
    locations: any[];
    user: any;
}

export default function StationaryStockClient({ stock, items, locations, user }: StationaryStockClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLocation, setFilterLocation] = useState('all');
    const [filterStockLevel, setFilterStockLevel] = useState('all');
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Filter stock
    const filteredStock = useMemo(() => {
        return stock.filter(s => {
            const matchesSearch = searchQuery === '' ||
                s.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.location.name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesLocation = filterLocation === 'all' || s.locationId === parseInt(filterLocation);

            const matchesStockLevel = filterStockLevel === 'all' ||
                (filterStockLevel === 'low' && s.quantity <= (s.item.reorderLevel || 0) && s.quantity > 0) ||
                (filterStockLevel === 'out' && s.quantity === 0) ||
                (filterStockLevel === 'ok' && s.quantity > (s.item.reorderLevel || 0));

            return matchesSearch && matchesLocation && matchesStockLevel;
        });
    }, [stock, searchQuery, filterLocation, filterStockLevel]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalItems = stock.length;
        const totalValue = stock.reduce((sum, s) => sum + (s.totalValue || 0), 0);
        const lowStock = stock.filter(s => s.quantity <= (s.item.reorderLevel || 0) && s.quantity > 0).length;
        const outOfStock = stock.filter(s => s.quantity === 0).length;

        return { totalItems, totalValue, lowStock, outOfStock };
    }, [stock]);

    const getStockBadge = (stockItem: any) => {
        if (stockItem.quantity === 0) {
            return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                <AlertTriangle size={12} />
                Out of Stock
            </span>;
        }
        if (stockItem.quantity <= (stockItem.item.reorderLevel || 0)) {
            return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                <TrendingDown size={12} />
                Low Stock
            </span>;
        }
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">In Stock</span>;
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/20">
                                <Warehouse className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Stock Management</h1>
                                <p className="text-slate-500 mt-1">Monitor and manage stationary inventory</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowTransferModal(true)}
                                className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                <ArrowRightLeft size={20} />
                                Transfer Stock
                            </button>
                            <button
                                onClick={() => setShowAdjustModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20"
                            >
                                <Plus size={20} />
                                Adjust Stock
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Stock Items</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalItems}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Warehouse className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">Total Value</p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
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
                                <AlertTriangle className="text-red-600" size={24} />
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search items or locations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.code} - {loc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Stock Level</label>
                            <select
                                value={filterStockLevel}
                                onChange={(e) => setFilterStockLevel(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">All Levels</option>
                                <option value="ok">In Stock</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stock Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Item Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Item Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">UOM</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit Cost</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Value</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredStock.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            No stock records found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStock.map((stockItem) => (
                                        <tr key={stockItem.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm text-slate-900">{stockItem.item.itemCode}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">{stockItem.item.name}</p>
                                                    {stockItem.item.category && (
                                                        <p className="text-sm text-slate-500">{stockItem.item.category.name}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">{stockItem.location.code}</p>
                                                    <p className="text-sm text-slate-500">{stockItem.location.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-lg font-bold ${stockItem.quantity === 0 ? 'text-red-600' : stockItem.quantity <= (stockItem.item.reorderLevel || 0) ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {stockItem.quantity.toLocaleString()}
                                                </span>
                                                {stockItem.item.reorderLevel && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Reorder: {stockItem.item.reorderLevel}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-700">{stockItem.item.uom}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-700">{formatCurrency(stockItem.unitCost)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-slate-900">{formatCurrency(stockItem.totalValue)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStockBadge(stockItem)}
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
                    Showing {filteredStock.length} of {stock.length} stock records
                </div>
            </div>

            {/* Modals */}
            {showAdjustModal && (
                <AdjustStockModal
                    items={items}
                    locations={locations}
                    onClose={() => setShowAdjustModal(false)}
                />
            )}
            {showTransferModal && (
                <TransferStockModal
                    items={items}
                    locations={locations}
                    stock={stock}
                    onClose={() => setShowTransferModal(false)}
                />
            )}
        </div>
    );
}
