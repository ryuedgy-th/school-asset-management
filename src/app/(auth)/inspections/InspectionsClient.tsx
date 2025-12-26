'use client';

import { useState, useMemo } from 'react';
import { ClipboardCheck, Plus, Calendar, User, Eye, Search, Filter } from 'lucide-react';
import InspectionModal from '@/components/InspectionModal';
import Link from 'next/link';

interface InspectionsClientProps {
    inspections: any[];
    assets: Array<{ id: number; name: string; assetCode: string }>;
}

export default function InspectionsClient({ inspections, assets }: InspectionsClientProps) {
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterDamage, setFilterDamage] = useState('all');

    // Filter inspections
    const filteredInspections = useMemo(() => {
        return inspections.filter(inspection => {
            // Search filter
            const matchesSearch = searchQuery === '' ||
                inspection.asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inspection.asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase());

            // Type filter
            const matchesType = filterType === 'all' || inspection.inspectionType === filterType;

            // Damage filter
            const matchesDamage = filterDamage === 'all' ||
                (filterDamage === 'damaged' && inspection.damageFound) ||
                (filterDamage === 'no-damage' && !inspection.damageFound);

            return matchesSearch && matchesType && matchesDamage;
        });
    }, [inspections, searchQuery, filterType, filterDamage]);

    // Count by type (from filtered results)
    const checkoutCount = filteredInspections.filter(i => i.inspectionType === 'checkout').length;
    const checkinCount = filteredInspections.filter(i => i.inspectionType === 'checkin').length;
    const periodicCount = filteredInspections.filter(i => i.inspectionType === 'periodic').length;
    const damageCount = filteredInspections.filter(i => i.damageFound).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <ClipboardCheck className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Asset Inspections</h1>
                                <p className="text-slate-500 mt-1">Track asset condition and maintenance history</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                            Create Inspection
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Inspections</div>
                        <div className="text-2xl font-bold text-slate-900">{filteredInspections.length}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Checkout Inspections</div>
                        <div className="text-2xl font-bold text-primary">{checkoutCount}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Checkin Inspections</div>
                        <div className="text-2xl font-bold text-green-600">{checkinCount}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Damage Found</div>
                        <div className="text-2xl font-bold text-red-600">{damageCount}</div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by asset name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80 focus:border-transparent"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">All Types</option>
                                <option value="checkout">Checkout</option>
                                <option value="checkin">Checkin</option>
                                <option value="periodic">Periodic</option>
                                <option value="incident">Incident</option>
                            </select>
                        </div>

                        {/* Damage Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={filterDamage}
                                onChange={(e) => setFilterDamage(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">All Damage Status</option>
                                <option value="damaged">Damaged Only</option>
                                <option value="no-damage">No Damage</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchQuery || filterType !== 'all' || filterDamage !== 'all') && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Active filters:</span>
                            {searchQuery && (
                                <span className="px-2 py-1 bg-primary/20 text-primary/90 rounded-md">
                                    Search: "{searchQuery}"
                                </span>
                            )}
                            {filterType !== 'all' && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
                                    Type: {filterType}
                                </span>
                            )}
                            {filterDamage !== 'all' && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md">
                                    {filterDamage === 'damaged' ? 'Damaged' : 'No Damage'}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterType('all');
                                    setFilterDamage('all');
                                }}
                                className="ml-auto text-primary hover:text-primary/90 font-medium"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Inspections Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-semibold text-slate-900">
                            {filteredInspections.length === inspections.length
                                ? 'All Inspections'
                                : `Filtered Inspections (${filteredInspections.length} of ${inspections.length})`
                            }
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Asset</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Condition</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Inspector</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Damage</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInspections.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                            <ClipboardCheck size={48} className="mx-auto mb-3 text-slate-300" />
                                            <div className="font-medium">
                                                {inspections.length === 0 ? 'No inspections yet' : 'No inspections match your filters'}
                                            </div>
                                            <div className="text-sm">
                                                {inspections.length === 0
                                                    ? 'Click "Create Inspection" to get started'
                                                    : 'Try adjusting your search or filters'
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInspections.map((inspection) => (
                                        <tr key={inspection.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(inspection.inspectionDate).toLocaleDateString('en-GB')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/assets/${inspection.asset.id}`}
                                                    className="hover:text-primary transition-colors"
                                                >
                                                    <div className="font-medium text-slate-900">{inspection.asset.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{inspection.asset.assetCode}</div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${inspection.inspectionType === 'checkout' ? 'bg-primary/20 text-primary/90' :
                                                        inspection.inspectionType === 'checkin' ? 'bg-green-100 text-green-700' :
                                                            inspection.inspectionType === 'periodic' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {inspection.inspectionType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${inspection.overallCondition === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                                                        inspection.overallCondition === 'good' ? 'bg-green-100 text-green-700' :
                                                            inspection.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                                                                inspection.overallCondition === 'poor' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-red-100 text-red-700'
                                                    }`}>
                                                    {inspection.overallCondition}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-slate-400" />
                                                    {inspection.inspector.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {inspection.damageFound ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        ⚠️ Damage
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">No damage</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/inspections/${inspection.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <InspectionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                assets={assets}
            />
        </div>
    );
}
