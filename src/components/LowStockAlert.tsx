'use client';

import { AlertTriangle, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface LowStockAlertProps {
    lowStockParts: Array<{
        id: number;
        partNumber: string;
        name: string;
        currentStock: number;
        reorderPoint: number;
        minStock: number;
        maxStock: number | null;
        unit: string | null;
    }>;
}

export default function LowStockAlert({ lowStockParts }: LowStockAlertProps) {
    if (lowStockParts.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">Low Stock Parts</h3>
                </div>
                <div className="text-center py-8">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-green-600 font-medium">All parts are well stocked!</p>
                    <p className="text-sm text-gray-600 mt-1">
                        No parts are below their reorder point
                    </p>
                </div>
            </div>
        );
    }

    const calculateReorderQuantity = (part: typeof lowStockParts[0]) => {
        const maxStock = part.maxStock || part.reorderPoint * 2;
        return maxStock - part.currentStock;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold">Low Stock Alert</h3>
                </div>
                <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-sm font-medium">
                    {lowStockParts.length} {lowStockParts.length === 1 ? 'part' : 'parts'}
                </span>
            </div>

            {/* List */}
            <div className="divide-y max-h-96 overflow-y-auto">
                {lowStockParts.map((part) => {
                    const reorderQty = calculateReorderQuantity(part);
                    const stockPercentage = (part.currentStock / part.reorderPoint) * 100;
                    const isVeryLow = stockPercentage < 50;

                    return (
                        <div
                            key={part.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                                isVeryLow ? 'bg-red-50' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold">{part.name}</h4>
                                        {isVeryLow && (
                                            <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-medium">
                                                CRITICAL
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{part.partNumber}</p>

                                    {/* Stock Level Bar */}
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-600">Current Stock</span>
                                            <span className="font-medium">
                                                {part.currentStock} / {part.reorderPoint}{' '}
                                                {part.unit || 'units'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${
                                                    isVeryLow ? 'bg-red-600' : 'bg-orange-500'
                                                }`}
                                                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Suggested Reorder */}
                                    <div className="mt-2 flex items-center gap-1 text-sm">
                                        <TrendingUp className="w-4 h-4 text-blue-600" />
                                        <span className="text-gray-600">Suggested order:</span>
                                        <span className="font-medium text-blue-600">
                                            {reorderQty} {part.unit || 'units'}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Link
                                    href="/spare-parts"
                                    className="ml-4 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium whitespace-nowrap"
                                >
                                    Restock
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
                <Link
                    href="/spare-parts?stockFilter=low"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                >
                    View all low stock parts
                    <span>→</span>
                </Link>
            </div>
        </div>
    );
}
