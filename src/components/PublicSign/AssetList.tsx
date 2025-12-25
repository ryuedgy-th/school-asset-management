'use client';

import React from 'react';

interface Asset {
    assetCode: string;
    name: string;
    category: string;
    serialNumber: string | null;
    condition: string;
    notes: string;
}

export default function AssetList({ items }: { items: Asset[] }) {
    if (!items || items.length === 0) {
        return <p className="text-slate-500 italic">No assets assigned.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Asset Code</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Serial</th>
                        <th className="px-4 py-3">Condition</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                        <tr key={index} className="bg-white hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{item.assetCode}</td>
                            <td className="px-4 py-3 text-slate-700">
                                <div>{item.name}</div>
                                <div className="text-xs text-slate-500">{item.notes}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.serialNumber || '-'}</td>
                            <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                    {item.condition}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
