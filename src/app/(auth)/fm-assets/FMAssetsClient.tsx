'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2, QrCode, Warehouse, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import QRPrintModal from '@/components/QRPrintModal';

interface FMAssetsClientProps {
    fmAssets: any[];
    categories: any[];
    user: any;
}

export default function FMAssetsClient({ fmAssets, categories, user }: FMAssetsClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterMaintenance, setFilterMaintenance] = useState('all');
    const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
    const [showQRModal, setShowQRModal] = useState(false);

    // Filter assets
    const filteredAssets = useMemo(() => {
        return fmAssets.filter(asset => {
            const matchesSearch = searchQuery === '' ||
                asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (asset.brand && asset.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (asset.model && asset.model.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = filterCategory === 'all' || asset.categoryId === parseInt(filterCategory);
            const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
            const matchesLocation = filterLocation === '' || asset.location.toLowerCase().includes(filterLocation.toLowerCase());
            const matchesMaintenance = filterMaintenance === 'all' ||
                (filterMaintenance === 'yes' && asset.requiresMaintenance) ||
                (filterMaintenance === 'no' && !asset.requiresMaintenance);

            return matchesSearch && matchesCategory && matchesStatus && matchesLocation && matchesMaintenance;
        });
    }, [fmAssets, searchQuery, filterCategory, filterStatus, filterLocation, filterMaintenance]);

    // Calculate stats
    const stats = useMemo(() => ({
        total: fmAssets.length,
        active: fmAssets.filter(a => a.status === 'active').length,
        maintenance: fmAssets.filter(a => a.status === 'maintenance').length,
        retired: fmAssets.filter(a => a.status === 'retired').length,
    }), [fmAssets]);

    const getStatusBadge = (status: string) => {
        const badges = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            maintenance: 'bg-yellow-100 text-yellow-800',
            retired: 'bg-red-100 text-red-800',
        };
        return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    const getConditionBadge = (condition: string) => {
        const badges = {
            excellent: 'bg-blue-100 text-blue-800',
            good: 'bg-green-100 text-green-800',
            fair: 'bg-yellow-100 text-yellow-800',
            poor: 'bg-red-100 text-red-800',
        };
        return badges[condition as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <Warehouse className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">FM Asset Management</h1>
                                <p className="text-slate-500 mt-1">Manage facility assets, equipment, and infrastructure</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedAssets.length > 0 && (
                                <button
                                    onClick={() => setShowQRModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    <QrCode size={18} />
                                    Print QR ({selectedAssets.length})
                                </button>
                            )}
                            <Link
                                href="/fm-assets/new"
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                <Plus size={20} />
                                Add FM Asset
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Assets</div>
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <div className="text-xs text-slate-400 mt-1">{filteredAssets.length} shown</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
                        <div className="text-sm text-green-600 mb-1">Active</div>
                        <div className="text-2xl font-bold text-green-700">{stats.active}</div>
                        <div className="text-xs text-green-500 mt-1">Operational</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
                        <div className="text-sm text-yellow-600 mb-1">In Maintenance</div>
                        <div className="text-2xl font-bold text-yellow-700">{stats.maintenance}</div>
                        <div className="text-xs text-yellow-500 mt-1">Under service</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
                        <div className="text-sm text-red-600 mb-1">Retired</div>
                        <div className="text-2xl font-bold text-red-700">{stats.retired}</div>
                        <div className="text-xs text-red-500 mt-1">Out of service</div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, code, brand, model..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                        </select>

                        {/* Maintenance Filter */}
                        <select
                            value={filterMaintenance}
                            onChange={(e) => setFilterMaintenance(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="all">All Assets</option>
                            <option value="yes">Requires Maintenance</option>
                            <option value="no">No Maintenance</option>
                        </select>
                    </div>

                    {/* Active filters display */}
                    {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all' || filterLocation || filterMaintenance !== 'all') && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Active filters:</span>
                            {searchQuery && (
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded-md">
                                    Search: "{searchQuery}"
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterCategory('all');
                                    setFilterStatus('all');
                                    setFilterLocation('');
                                    setFilterMaintenance('all');
                                }}
                                className="ml-auto text-primary hover:text-primary/80 font-medium"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Assets Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedAssets(filteredAssets.map(a => a.id));
                                                } else {
                                                    setSelectedAssets([]);
                                                }
                                            }}
                                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Asset Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Location</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Condition</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Components</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="text-slate-300" size={48} />
                                                <p className="text-slate-500 font-medium">No FM assets found</p>
                                                <p className="text-slate-400 text-sm">
                                                    {fmAssets.length === 0
                                                        ? 'Get started by adding your first FM asset'
                                                        : 'Try adjusting your filters'
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssets.includes(asset.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedAssets([...selectedAssets, asset.id]);
                                                        } else {
                                                            setSelectedAssets(selectedAssets.filter(id => id !== asset.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-mono text-sm font-medium text-primary">{asset.assetCode}</div>
                                                    {asset.qrCode && (
                                                        <QrCode size={16} className="text-slate-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-slate-900">{asset.name}</div>
                                                    {asset.brand && asset.model && (
                                                        <div className="text-sm text-slate-500">{asset.brand} {asset.model}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-700">{asset.category.name}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-slate-700">{asset.location}</div>
                                                {asset.building && (
                                                    <div className="text-xs text-slate-500">
                                                        {asset.building}{asset.floor ? `, Floor ${asset.floor}` : ''}{asset.room ? `, Room ${asset.room}` : ''}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(asset.status)}`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getConditionBadge(asset.condition)}`}>
                                                    {asset.condition}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-center">
                                                    <span className="text-slate-700 font-medium">{asset._count.components}</span>
                                                    <span className="text-slate-400 text-xs ml-1">comp.</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/fm-assets/${asset.id}`}
                                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link
                                                        href={`/fm-assets/${asset.id}/edit`}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit Asset"
                                                    >
                                                        <Edit size={18} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-4 text-center text-sm text-slate-500">
                    Showing {filteredAssets.length} of {fmAssets.length} FM assets
                </div>
            </div>

            {/* QR Print Modal */}
            <QRPrintModal
                assetIds={selectedAssets}
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
            />
        </div>
    );
}
