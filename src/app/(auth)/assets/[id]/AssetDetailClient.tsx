'use client';

import { ArrowLeft, Package, Calendar, User, ClipboardCheck, History, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import MaintenanceHistory from '@/components/MaintenanceHistory';

interface AssetDetailClientProps {
    asset: any;
}

export default function AssetDetailClient({ asset }: AssetDetailClientProps) {
    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'Available': 'bg-green-100 text-green-800',
            'Borrowed': 'bg-primary/20 text-blue-800',
            'Maintenance': 'bg-yellow-100 text-yellow-800',
            'Broken': 'bg-red-100 text-red-800',
            'Lost': 'bg-gray-100 text-gray-800',
            'Retired': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getConditionBadge = (condition: string) => {
        const colors: Record<string, string> = {
            'excellent': 'bg-emerald-100 text-emerald-800',
            'good': 'bg-green-100 text-green-800',
            'fair': 'bg-yellow-100 text-yellow-800',
            'poor': 'bg-orange-100 text-orange-800',
            'damaged': 'bg-red-100 text-red-800'
        };
        return colors[condition] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/10 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/assets" className="inline-flex items-center text-primary hover:text-primary/90 mb-4">
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Assets
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary rounded-xl shadow-lg">
                            <Package className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{asset.name}</h1>
                            <p className="text-slate-500 font-mono">{asset.assetCode}</p>
                        </div>
                    </div>
                </div>

                {/* Asset Info Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Asset Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-sm text-slate-600 mb-1">Category</div>
                            <div className="font-semibold text-slate-900">{asset.category || 'N/A'}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-sm text-slate-600 mb-1">Status</div>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(asset.status)}`}>
                                {asset.status}
                            </span>
                        </div>
                        {asset.brand && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-sm text-slate-600 mb-1">Brand</div>
                                <div className="font-semibold text-slate-900">{asset.brand}</div>
                            </div>
                        )}
                        {asset.model && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-sm text-slate-600 mb-1">Model</div>
                                <div className="font-semibold text-slate-900">{asset.model}</div>
                            </div>
                        )}
                        {asset.serialNumber && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-sm text-slate-600 mb-1">Serial Number</div>
                                <div className="font-mono text-slate-900">{asset.serialNumber}</div>
                            </div>
                        )}
                        {asset.location && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                                    <MapPin size={14} />
                                    Location
                                </div>
                                <div className="font-semibold text-slate-900">{asset.location}</div>
                            </div>
                        )}
                        {asset.cost && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-sm text-slate-600 mb-1 flex items-center gap-1">
                                    <DollarSign size={14} />
                                    Cost
                                </div>
                                <div className="font-semibold text-slate-900">฿{asset.cost.toLocaleString()}</div>
                            </div>
                        )}
                        {asset.purchaseDate && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-sm text-slate-600 mb-1">Purchase Date</div>
                                <div className="font-semibold text-slate-900">
                                    {new Date(asset.purchaseDate).toLocaleDateString('en-GB')}
                                </div>
                            </div>
                        )}
                        {asset.warrantyExp && (
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-sm text-slate-600 mb-1">Warranty Expiry</div>
                                <div className="font-semibold text-slate-900">
                                    {new Date(asset.warrantyExp).toLocaleDateString('en-GB')}
                                </div>
                            </div>
                        )}
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <div className="text-sm text-slate-600 mb-1">Stock</div>
                            <div className="font-semibold text-slate-900">{asset.currentStock} / {asset.totalStock}</div>
                        </div>
                    </div>
                </div>

                {/* Borrow History */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <History className="text-primary" size={24} />
                        <h2 className="text-xl font-bold text-slate-900">Borrow History</h2>
                        <span className="ml-auto text-sm text-slate-500">
                            {asset.borrowHistory?.length || 0} {(asset.borrowHistory?.length || 0) === 1 ? 'record' : 'records'}
                        </span>
                    </div>
                    {!asset.borrowHistory || asset.borrowHistory.length === 0 ? (
                        <p className="text-gray-500">No borrow history found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Borrower</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Department</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Borrow Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Quantity</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {asset.borrowHistory.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">
                                                    {item.borrowTransaction?.assignment?.user?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {item.borrowTransaction?.assignment?.user?.email || ''}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {item.borrowTransaction?.assignment?.user?.department || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {item.borrowTransaction?.borrowDate
                                                        ? new Date(item.borrowTransaction.borrowDate).toLocaleDateString('en-GB')
                                                        : 'N/A'
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Returned'
                                                    ? 'bg-gray-100 text-gray-700'
                                                    : 'bg-primary/20 text-primary/90'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Maintenance History */}
                <MaintenanceHistory inspections={asset.inspections} />
            </div>
        </div>
    );
}
