'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Save, Phone } from 'lucide-react';
import { updateUser } from '@/app/lib/actions';
import { User, Role, Department } from '@prisma/client';

type UserWithRelations = User & {
    userRole: Role | null;
    userDepartment: Department | null;
};

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserWithRelations;
    roles: Role[];
    departments: Department[];
}

export default function EditUserModal({ isOpen, onClose, user, roles, departments }: EditUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState(user.name || '');
    const [email, setEmail] = useState(user.email || '');
    const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
    const [roleId, setRoleId] = useState<string>(user.roleId?.toString() || '');
    const [departmentId, setDepartmentId] = useState<string>(user.departmentId?.toString() || '');

    // Reset form when user changes
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phoneNumber || '');
            setRoleId(user.roleId?.toString() || '');
            setDepartmentId(user.departmentId?.toString() || '');
        }
    }, [user]);

    if (!isOpen) return null;

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        try {
            const res = await updateUser(user.id, formData);
            if (res?.error) {
                setError(res.error);
            } else {
                onClose();
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form action={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none transition-all"
                            placeholder="john@school.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="tel"
                                name="phoneNumber"
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none transition-all"
                                placeholder="081-234-5678"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="roleId" className="text-sm font-semibold text-gray-700">Role</label>
                            <select
                                name="roleId"
                                id="roleId"
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none transition-all bg-white"
                            >
                                <option value="">Select Role</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id.toString()}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="departmentId" className="text-sm font-semibold text-gray-700">Department</label>
                            <select
                                name="departmentId"
                                id="departmentId"
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none transition-all bg-white"
                            >
                                <option value="">Select Dept.</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id.toString()}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
