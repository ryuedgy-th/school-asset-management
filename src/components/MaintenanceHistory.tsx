'use client';

import DamageSeverityBadge from './DamageSeverityBadge';
import RepairStatusBadge from './RepairStatusBadge';
import Link from 'next/link';

interface MaintenanceHistoryProps {
    inspections: any[];
}

export default function MaintenanceHistory({ inspections }: MaintenanceHistoryProps) {
    if (!inspections || inspections.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Maintenance History</h3>
                <p className="text-gray-500">No maintenance records found.</p>
            </div>
        );
    }

    // Separate damage and non-damage inspections
    const damageInspections = inspections.filter(i => i.damageFound);
    const regularInspections = inspections.filter(i => !i.damageFound);

    // Calculate total repair costs
    const totalRepairCost = damageInspections.reduce((sum, i) => {
        return sum + (i.repairCost ? Number(i.repairCost) : 0);
    }, 0);

    const totalEstimatedCost = damageInspections.reduce((sum, i) => {
        return sum + (i.estimatedCost ? Number(i.estimatedCost) : 0);
    }, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">🔧 Maintenance History</h3>
                <div className="text-sm text-gray-600">
                    {inspections.length} total inspection{inspections.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Summary Stats */}
            {damageInspections.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-xs text-gray-600 mb-1">Total Damages</p>
                        <p className="text-2xl font-bold text-red-600">{damageInspections.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 mb-1">Estimated Costs</p>
                        <p className="text-2xl font-bold text-orange-600">฿{totalEstimatedCost.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 mb-1">Actual Repair Costs</p>
                        <p className="text-2xl font-bold text-green-600">฿{totalRepairCost.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Damage/Repair History */}
            {damageInspections.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">⚠️ Damage & Repair Records</h4>
                    <div className="space-y-3">
                        {damageInspections.map((inspection) => (
                            <Link
                                key={inspection.id}
                                href={`/inspections/${inspection.inspectionNumber}`}
                                className="block p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                {new Date(inspection.inspectionDate).toLocaleDateString('en-GB')}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                by {inspection.inspector?.name || 'Unknown'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-red-700 mb-2">
                                            {inspection.damageDescription || 'No description'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {inspection.damageSeverity && (
                                                <DamageSeverityBadge severity={inspection.damageSeverity} />
                                            )}
                                            {inspection.repairStatus && (
                                                <RepairStatusBadge status={inspection.repairStatus} />
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        {inspection.estimatedCost && (
                                            <p className="text-sm text-gray-600">
                                                Est: ฿{Number(inspection.estimatedCost).toLocaleString()}
                                            </p>
                                        )}
                                        {inspection.repairCost && (
                                            <p className="text-sm font-semibold text-green-600">
                                                Actual: ฿{Number(inspection.repairCost).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {inspection.repairedBy && (
                                    <p className="text-xs text-gray-600">
                                        Repaired by: {inspection.repairedBy}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Regular Inspection History */}
            {regularInspections.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-3">✅ Regular Inspections</h4>
                    <div className="space-y-2">
                        {regularInspections.map((inspection) => (
                            <Link
                                key={inspection.id}
                                href={`/inspections/${inspection.inspectionNumber}`}
                                className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Date(inspection.inspectionDate).toLocaleDateString('en-GB')}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {inspection.inspectionType}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            by {inspection.inspector?.name || 'Unknown'}
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${inspection.overallCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                                            inspection.overallCondition === 'good' ? 'bg-primary/20 text-blue-800' :
                                                inspection.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {inspection.overallCondition}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
