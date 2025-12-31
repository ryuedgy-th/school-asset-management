'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface StockLocation {
    id: number;
    quantity: number;
    batchNumber: string | null;
    expiryDate: Date | null;
    unitCost: number | null;
    totalValue: number | null;
    location: {
        id: number;
        code: string;
        name: string;
        type: string;
    };
}

interface ItemData {
    id: number;
    itemCode: string;
    name: string;
    description: string | null;
    uom: string;
    minStockLevel: number;
    maxStockLevel: number | null;
    reorderPoint: number;
    reorderQuantity: number;
    unitCost: number | null;
    isRestricted: boolean;
    expiryTracking: boolean;
    barcodeEnabled: boolean;
    barcode: string | null;
    isActive: boolean;
    isArchived: boolean;
    tags: string | null;
    imageUrl: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    category: {
        id: number;
        code: string;
        name: string;
    };
    defaultVendor: {
        id: number;
        vendorCode: string;
        name: string;
    } | null;
    createdBy: {
        id: number;
        name: string | null;
        email: string | null;
    };
    stock: StockLocation[];
}

export default function StationaryItemDetailClient({
    item,
    totalStock,
    canEdit,
    canDelete,
}: {
    item: ItemData;
    totalStock: number;
    canEdit: boolean;
    canDelete: boolean;
}) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Item?',
            text: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                setIsDeleting(true);
                const res = await fetch(`/api/stationary/items/${item.itemCode}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    await Swal.fire('Deleted!', 'Item has been deleted.', 'success');
                    router.push('/stationary/items');
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to delete item');
                }
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const getStockStatus = () => {
        if (totalStock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
        if (totalStock <= item.minStockLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
        if (item.maxStockLevel && totalStock >= item.maxStockLevel) return { label: 'Overstock', color: 'bg-purple-100 text-purple-800' };
        return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    };

    const stockStatus = getStockStatus();

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Link href="/stationary" className="hover:text-green-600">Stationary</Link>
                    <span>/</span>
                    <Link href="/stationary/items" className="hover:text-green-600">Items</Link>
                    <span>/</span>
                    <span className="text-slate-900">{item.itemCode}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{item.name}</h1>
                        <p className="text-slate-600 mt-1">{item.itemCode}</p>
                    </div>
                    <div className="flex gap-3">
                        {canEdit && (
                            <Link
                                href={`/stationary/items?edit=${item.itemCode}`}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Edit Item
                            </Link>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600">Category</label>
                                <p className="text-slate-900 mt-1">{item.category.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Unit of Measure</label>
                                <p className="text-slate-900 mt-1">{item.uom}</p>
                            </div>
                            {item.description && (
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-slate-600">Description</label>
                                    <p className="text-slate-900 mt-1">{item.description}</p>
                                </div>
                            )}
                            {item.unitCost && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Unit Cost</label>
                                    <p className="text-slate-900 mt-1 font-semibold">฿{item.unitCost.toFixed(2)}</p>
                                </div>
                            )}
                            {item.defaultVendor && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Default Vendor</label>
                                    <p className="text-slate-900 mt-1">{item.defaultVendor.name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stock Levels */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Stock Control</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600">Minimum Stock Level</label>
                                <p className="text-slate-900 mt-1 font-semibold">{item.minStockLevel} {item.uom}</p>
                            </div>
                            {item.maxStockLevel && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Maximum Stock Level</label>
                                    <p className="text-slate-900 mt-1 font-semibold">{item.maxStockLevel} {item.uom}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-slate-600">Reorder Point</label>
                                <p className="text-slate-900 mt-1">{item.reorderPoint} {item.uom}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Reorder Quantity</label>
                                <p className="text-slate-900 mt-1">{item.reorderQuantity} {item.uom}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stock by Location */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Stock by Location</h2>
                        {item.stock.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No stock available</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Location</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
                                            {item.stock.some(s => s.batchNumber) && (
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Batch</th>
                                            )}
                                            {item.stock.some(s => s.unitCost) && (
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Value</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.stock.map((stock) => (
                                            <tr key={stock.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{stock.location.name}</p>
                                                        <p className="text-sm text-slate-500">{stock.location.code}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs capitalize">
                                                        {stock.location.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                    {stock.quantity} {item.uom}
                                                </td>
                                                {item.stock.some(s => s.batchNumber) && (
                                                    <td className="py-3 px-4 text-slate-700">
                                                        {stock.batchNumber || '-'}
                                                    </td>
                                                )}
                                                {item.stock.some(s => s.unitCost) && (
                                                    <td className="py-3 px-4 text-right text-slate-900">
                                                        {stock.totalValue ? `฿${stock.totalValue.toFixed(2)}` : '-'}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Additional Info */}
                    {item.notes && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Notes</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{item.notes}</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Stats & Properties */}
                <div className="space-y-6">
                    {/* Current Stock Card */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-green-100 text-sm font-medium">Current Stock</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${stockStatus.color}`}>
                                {stockStatus.label}
                            </span>
                        </div>
                        <div className="text-4xl font-bold mb-1">{totalStock}</div>
                        <div className="text-green-100 text-sm">{item.uom}</div>
                        {item.maxStockLevel && (
                            <div className="mt-4 pt-4 border-t border-green-400">
                                <div className="flex justify-between text-sm">
                                    <span>Min: {item.minStockLevel}</span>
                                    <span>Max: {item.maxStockLevel}</span>
                                </div>
                                <div className="w-full bg-green-400 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-white rounded-full h-2 transition-all"
                                        style={{
                                            width: `${Math.min(100, (totalStock / item.maxStockLevel) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Properties */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Properties</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Status</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {item.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {item.isRestricted && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Restricted Item</span>
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                        Yes
                                    </span>
                                </div>
                            )}
                            {item.expiryTracking && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Expiry Tracking</span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                        Enabled
                                    </span>
                                </div>
                            )}
                            {item.barcodeEnabled && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Barcode</span>
                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                                        {item.barcode || 'Enabled'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Metadata</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-slate-600">Created By</label>
                                <p className="text-slate-900 font-medium">{item.createdBy.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-slate-600">Created At</label>
                                <p className="text-slate-900">{new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-slate-600">Last Updated</label>
                                <p className="text-slate-900">{new Date(item.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
