'use client';

import { useState } from 'react';
import { Plus, Shield, Trash2, Users } from 'lucide-react';
import { Role } from '@prisma/client';
import CreateRoleModal from './CreateRoleModal';
import { deleteRole } from '@/app/lib/actions';
import { useConfirm } from '@/contexts/DialogProvider';

interface RoleWithCount extends Role {
    _count: { users: number };
}

export default function RoleList({ initialRoles }: { initialRoles: RoleWithCount[] }) {
    const { confirm } = useConfirm();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    async function handleDelete(id: number) {
        const confirmed = await confirm({
            title: 'Delete Role',
            message: 'Are you sure you want to delete this role? This will affect users assigned to this role.',
            confirmText: 'Delete',
            variant: 'danger'
        });

        if (!confirmed) return;
        await deleteRole(id);
    }

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Roles & Permissions</h1>
                    <p className="text-gray-500 mt-1">Manage access levels and system security</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                >
                    <Plus size={20} />
                    New Role
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {initialRoles.map((role) => (
                    <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                <Shield size={24} />
                            </div>
                            {role.name !== 'Admin' && (
                                <button
                                    onClick={() => handleDelete(role.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    title="Delete Role"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{role.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                            <Users size={16} />
                            <span>{role._count.users} Users assigned</span>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Permissions</h4>
                            <div className="flex flex-wrap gap-2">
                                {JSON.parse(role.permissions).includes('*') ? (
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Full Access</span>
                                ) : (
                                    JSON.parse(role.permissions).map((perm: string) => (
                                        <span key={perm} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">
                                            {perm}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <CreateRoleModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </>
    );
}
