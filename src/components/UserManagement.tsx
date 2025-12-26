'use client';

import { useState } from 'react';
import { Plus, User as UserIcon, Shield, Mail } from 'lucide-react';
import { User } from '@prisma/client';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import { useConfirm, useAlert } from '@/contexts/DialogProvider';

interface UserManagementProps {
    initialUsers: User[];
}

export default function UserManagement({ initialUsers }: UserManagementProps) {
    const { confirm } = useConfirm();
    const { alert } = useAlert();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    async function handleDelete(id: number) {
        const confirmed = await confirm({
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger'
        });

        if (!confirmed) return;

        setIsDeleting(id);
        const { deleteUser } = await import('@/app/lib/actions');
        try {
            const res = await deleteUser(id);
            if (res?.error) {
                await alert({
                    title: 'Error',
                    message: res.error,
                    variant: 'error'
                });
            }
        } catch (error) {
            console.error(error);
            await alert({
                title: 'Error',
                message: 'Failed to delete user.',
                variant: 'error'
            });
        } finally {
            setIsDeleting(null);
        }
    }

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Users</h1>
                    <p className="text-gray-500 mt-1">Manage staff access and roles</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/80/30"
                >
                    <Plus size={20} />
                    New User
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Department</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {initialUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                            <UserIcon size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{user.name || 'Unnamed'}</div>
                                            <div className="text-xs text-slate-500">Added {new Date(user.createdAt).toLocaleDateString('en-GB')}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-slate-400" />
                                        {user.email}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'Technician' ? 'bg-primary/20 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {user.role === 'Admin' && <Shield size={12} className="mr-1" />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600">{user.department || '-'}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg font-medium text-xs transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            disabled={isDeleting === user.id}
                                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-medium text-xs transition-colors disabled:opacity-50"
                                        >
                                            {isDeleting === user.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {initialUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <CreateUserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

            {editingUser && (
                <EditUserModal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    user={editingUser}
                />
            )}
        </>
    );
}
