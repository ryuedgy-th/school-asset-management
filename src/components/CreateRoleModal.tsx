'use client';

import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { createRole } from '@/app/lib/actions';

interface CreateRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AVAILABLE_PERMISSIONS = [
    { id: '/assets', label: 'Manage Assets' },
    { id: '/borrow', label: 'Borrowing System' },
    { id: '/users', label: 'User Management' },
    { id: '/pm', label: 'Maintenance' },
    { id: '/scan', label: 'QR Scanning' },
    { id: '/roles', label: 'Role Management' },
];

export default function CreateRoleModal({ isOpen, onClose }: CreateRoleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const togglePerm = (id: string) => {
        setSelectedPerms(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        // Add permissions to formData
        formData.append('permissions', JSON.stringify(selectedPerms));

        try {
            const res = await createRole(formData);
            if (res?.error) {
                setError(res.error);
            } else {
                onClose();
            }
        } catch (err) {
            setError('Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Create New Role</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form action={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="name" className="text-sm font-semibold text-gray-700">Role Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none transition-all"
                            placeholder="e.g. Content Editor"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">Permissions</label>
                        <div className="grid grid-cols-2 gap-3">
                            {AVAILABLE_PERMISSIONS.map((perm) => (
                                <label key={perm.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedPerms.includes(perm.id)}
                                        onChange={() => togglePerm(perm.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/80"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{perm.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                            {isLoading ? 'Create Role' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
