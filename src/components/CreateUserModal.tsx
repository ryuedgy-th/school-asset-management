'use client';

import { useState } from 'react';
import Modal from './Modal';
import { createUser } from '@/app/lib/actions';
import { User, Mail, Lock, Shield, Building, Phone } from 'lucide-react';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError('');

        const result = await createUser(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            onClose();
            setLoading(false);
            // Optionally reset form here if needed, but Modal close usually suffices
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New User">
            <form action={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="name" type="text" required placeholder="John Doe" className="pl-10 w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/80 outline-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="email" type="email" required placeholder="john@school.com" className="pl-10 w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/80 outline-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="password" type="password" required placeholder="••••••••" className="pl-10 w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/80 outline-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input name="phoneNumber" type="tel" placeholder="081-234-5678" className="pl-10 w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/80 outline-none" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select name="role" className="pl-10 w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/80 outline-none bg-white">
                                <option value="User">User</option>
                                <option value="Technician">Technician</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input name="department" type="text" placeholder="IT" className="pl-10 w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary/80 outline-none" />
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
