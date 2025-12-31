'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, UserPlus } from 'lucide-react';
import UserSelect from '../UserSelect';
import { createAssignment } from '@/app/lib/borrow-actions';

interface NewAssignmentModalProps {
    onClose: () => void;
}

export default function NewAssignmentModal({ onClose }: NewAssignmentModalProps) {
    const router = useRouter();
    const [userId, setUserId] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [academicYear, setAcademicYear] = useState('2025'); // Default
    const [semester, setSemester] = useState(1);

    const handleCreate = async () => {
        if (!userId) return alert('Please select a user');

        setLoading(true);
        try {
            const assignment = await createAssignment({
                userId,
                academicYear,
                semester: Number(semester)
            });

            // Redirect to the new assignment detail page
            router.push(`/assignments/${assignment.assignmentNumber}`);
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to create assignment');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <UserPlus className="text-primary" size={20} />
                        New Asset Assignment
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* User Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Assign To (User/Teacher)</label>
                        <UserSelect onSelect={setUserId} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Academic Year</label>
                            <input
                                type="text"
                                value={academicYear}
                                onChange={e => setAcademicYear(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Semester</label>
                            <select
                                value={semester}
                                onChange={e => setSemester(Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>Summer</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !userId}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Creating...' : (
                            <>
                                <Plus size={18} /> Create Assignment
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
