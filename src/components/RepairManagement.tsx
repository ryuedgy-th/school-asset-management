'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DamageSeverityBadge from '@/components/DamageSeverityBadge';
import RepairStatusBadge from '@/components/RepairStatusBadge';
import { assessDamage, startRepair, completeRepair, markUnrepairable, updateRepairProgress, acceptDamageAsIs } from '@/app/lib/repair-actions';

interface RepairManagementProps {
    inspection: any;
}

export default function RepairManagement({ inspection }: RepairManagementProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAssessDamage = async () => {
        const severity = prompt('Enter damage severity (minor/moderate/severe):');
        if (!severity || !['minor', 'moderate', 'severe'].includes(severity)) {
            alert('Invalid severity. Please enter: minor, moderate, or severe');
            return;
        }

        const canContinue = confirm('Can the asset continue to be used despite the damage?');

        setIsProcessing(true);
        try {
            await assessDamage(inspection.id, severity as any, canContinue);
            alert('✅ Damage assessed successfully!');
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStartRepair = async () => {
        const technician = prompt('Enter technician/vendor name:');
        if (!technician) return;

        setIsProcessing(true);
        try {
            await startRepair(inspection.id, technician);
            alert('✅ Repair started!');
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateProgress = async () => {
        const notes = prompt('Enter repair progress notes:');
        if (!notes) return;

        setIsProcessing(true);
        try {
            await updateRepairProgress(inspection.id, notes);
            alert('✅ Progress updated!');
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompleteRepair = async () => {
        const costStr = prompt('Enter actual repair cost (฿):');
        if (!costStr) return;

        const cost = parseFloat(costStr);
        if (isNaN(cost)) {
            alert('Invalid cost');
            return;
        }

        setIsProcessing(true);
        try {
            await completeRepair(inspection.id, cost);
            alert('✅ Repair completed!');
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMarkUnrepairable = async () => {
        const reason = prompt('Enter reason why asset cannot be repaired:');
        if (!reason) return;

        if (!confirm('This will mark the asset as RETIRED. Continue?')) return;

        setIsProcessing(true);
        try {
            await markUnrepairable(inspection.id, reason);
            alert('✅ Marked as unrepairable. Asset retired.');
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAcceptAsIs = async () => {
        const reason = prompt('Enter reason for accepting damage as-is (e.g., minor cosmetic damage, fully functional):');
        if (!reason) return;

        if (!confirm('This will accept the damage without repair. The asset will return to service. Continue?')) return;

        setIsProcessing(true);
        try {
            await acceptDamageAsIs(inspection.id, reason);
            alert('✅ Damage accepted as-is. Asset returned to service.');
            router.refresh();
        } catch (error: any) {
            alert('❌ Failed: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">🔧 Repair Management</h4>

            {/* Severity & Status Display */}
            <div className="flex gap-3 mb-4">
                {inspection.damageSeverity && (
                    <DamageSeverityBadge severity={inspection.damageSeverity} />
                )}
                {inspection.repairStatus && (
                    <RepairStatusBadge status={inspection.repairStatus} />
                )}
                {inspection.canContinueUse && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-blue-800 border border-primary/60">
                        ✓ Can Continue Use
                    </span>
                )}
            </div>

            {/* Repair Info */}
            {inspection.repairedBy && (
                <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Technician:</span> {inspection.repairedBy}
                </p>
            )}
            {inspection.repairStartDate && (
                <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Started:</span> {new Date(inspection.repairStartDate).toLocaleDateString()}
                </p>
            )}
            {inspection.repairCompletedDate && (
                <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Completed:</span> {new Date(inspection.repairCompletedDate).toLocaleDateString()}
                </p>
            )}
            {inspection.repairCost && (
                <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Actual Cost:</span> ฿{Number(inspection.repairCost).toLocaleString()}
                </p>
            )}
            {inspection.repairNotes && (
                <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Repair Notes:</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{inspection.repairNotes}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
                {!inspection.damageSeverity && (
                    <button
                        onClick={handleAssessDamage}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        📊 Assess Damage
                    </button>
                )}

                {inspection.repairStatus === 'pending' && (
                    <>
                        <button
                            onClick={handleAcceptAsIs}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            ✓ Accept As-Is
                        </button>
                        <button
                            onClick={handleStartRepair}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            🔧 Start Repair
                        </button>
                    </>
                )}

                {inspection.repairStatus === 'in_progress' && (
                    <>
                        <button
                            onClick={handleUpdateProgress}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            📝 Update Progress
                        </button>
                        <button
                            onClick={handleCompleteRepair}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            ✅ Complete Repair
                        </button>
                    </>
                )}

                {inspection.repairStatus && inspection.repairStatus !== 'completed' && inspection.repairStatus !== 'cannot_repair' && inspection.repairStatus !== 'accepted_as_is' && (
                    <button
                        onClick={handleMarkUnrepairable}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        ❌ Cannot Repair
                    </button>
                )}
            </div>
        </div>
    );
}
