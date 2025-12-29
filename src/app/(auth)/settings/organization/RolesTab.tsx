'use client';

import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, Building2, X, Save, AlertCircle, CheckSquare, Square } from 'lucide-react';
import Swal from 'sweetalert2';

interface Role {
    id: number;
    name: string;
    departmentId: number | null;
    department: { id: number; code: string; name: string } | null;
    scope: string;
    isActive: boolean;
    _count: { users: number; rolePermissions: number };
}

interface Department {
    id: number;
    code: string;
    name: string;
}

interface Module {
    id: number;
    code: string;
    name: string;
    description: string | null;
    permissions: Array<{
        id: number;
        action: string;
        description: string | null;
    }>;
}

export default function RolesTab({
    roles,
    setRoles,
    departments,
    modules,
}: {
    roles: Role[];
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
    departments: Department[];
    modules: Module[];
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

    const [formData, setFormData] = useState({
        name: '',
        departmentId: null as number | null,
        scope: 'department' as 'department' | 'cross-department' | 'global',
        isActive: true,
    });

    const openCreateModal = () => {
        setEditingRole(null);
        setFormData({
            name: '',
            departmentId: null,
            scope: 'department',
            isActive: true,
        });
        setSelectedPermissions(new Set());
        setShowModal(true);
        setError(null);
    };

    const openEditModal = async (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            departmentId: role.departmentId,
            scope: role.scope as any,
            isActive: role.isActive,
        });

        // Initialize with empty permissions
        setSelectedPermissions(new Set());

        // Show modal first
        setShowModal(true);
        setError(null);

        // Fetch role permissions in background
        try {
            const res = await fetch(`/api/roles/${role.id}/permissions`);
            if (res.ok) {
                const data = await res.json();
                const permissionIds = new Set<number>(
                    data.permissions.map((p: any) => p.permissionId)
                );
                setSelectedPermissions(permissionIds);
            } else {
                console.error('Failed to fetch permissions:', res.status, await res.text());
            }
        } catch (error) {
            console.error('Failed to load role permissions:', error);
        }
    };

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permissionId)) {
                newSet.delete(permissionId);
            } else {
                newSet.add(permissionId);
            }
            return newSet;
        });
    };

    const toggleModule = (module: Module) => {
        const modulePermissionIds = module.permissions.map(p => p.id);
        const allSelected = modulePermissionIds.every(id => selectedPermissions.has(id));

        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                // Deselect all
                modulePermissionIds.forEach(id => newSet.delete(id));
            } else {
                // Select all
                modulePermissionIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!formData.name.trim()) {
                setError('Please enter role name');
                return;
            }

            // Show warning if editing existing role
            if (editingRole) {
                const result = await Swal.fire({
                    title: '⚠️ Important Warning',
                    html: `
                        <div style="text-align: left;">
                            <p><strong>Saving changes to this role will affect all users assigned to it.</strong></p>
                            <p style="margin-top: 10px;">Users with this role will need to <strong>log out and log back in</strong> to see the updated permissions.</p>
                            <p style="margin-top: 10px;">Do you want to continue?</p>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3b82f6',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Yes, save changes',
                    cancelButtonText: 'Cancel',
                });

                if (!result.isConfirmed) {
                    setLoading(false);
                    return;
                }
            }

            const body = {
                name: formData.name,
                departmentId: formData.departmentId,
                scope: formData.scope,
                isActive: formData.isActive,
                permissionIds: Array.from(selectedPermissions),
            };

            const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
            const method = editingRole ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save role');
            }

            // Update local state
            if (editingRole) {
                setRoles(prev => prev.map(r => (r.id === data.id ? data : r)));

                // Show success message
                await Swal.fire({
                    title: '✅ Role Updated Successfully!',
                    html: `
                        <div style="text-align: left;">
                            <p>Role <strong>"${formData.name}"</strong> has been updated.</p>
                            <div style="margin-top: 15px; padding: 12px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e;">
                                    <strong>📢 Important Reminder:</strong><br/>
                                    Users with this role need to <strong>log out and log back in</strong> to see the changes.
                                </p>
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#3b82f6',
                    confirmButtonText: 'Got it!',
                });
            } else {
                setRoles(prev => [...prev, data]);
                await Swal.fire({
                    title: '✅ Role Created Successfully!',
                    text: `Role "${formData.name}" has been created.`,
                    icon: 'success',
                    confirmButtonColor: '#3b82f6',
                    confirmButtonText: 'OK',
                });
            }

            setShowModal(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (role: Role) => {
        if (role._count.users > 0) {
            await Swal.fire({
                title: 'Cannot Delete Role',
                text: `This role has ${role._count.users} assigned user${role._count.users > 1 ? 's' : ''}. Please reassign them first.`,
                icon: 'error',
                confirmButtonColor: '#3b82f6',
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Delete Role?',
            html: `Are you sure you want to delete <strong>"${role.name}"</strong>?<br/><br/>This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete role');
            }

            setRoles(prev => prev.filter(r => r.id !== role.id));
            await Swal.fire({
                title: 'Deleted!',
                text: `Role "${role.name}" has been deleted.`,
                icon: 'success',
                confirmButtonColor: '#3b82f6',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err: any) {
            await Swal.fire({
                title: 'Error',
                text: err.message,
                icon: 'error',
                confirmButtonColor: '#3b82f6',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Roles & Permissions</h2>
                    <p className="text-sm text-slate-500 mt-1">Define user roles and their access permissions</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    Create Role
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">Total Roles</div>
                    <div className="text-2xl font-bold text-slate-900">{roles.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">Active Roles</div>
                    <div className="text-2xl font-bold text-green-600">
                        {roles.filter(r => r.isActive).length}
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="text-sm text-slate-500 mb-1">Total Users</div>
                    <div className="text-2xl font-bold text-primary">
                        {roles.reduce((sum, r) => sum + r._count.users, 0)}
                    </div>
                </div>
            </div>

            {/* Roles Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Role Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Department
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Scope
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Permissions
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Users
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {roles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                        <Shield size={48} className="mx-auto mb-3 text-slate-300" />
                                        <div className="font-medium">No roles yet</div>
                                        <div className="text-sm">Click "Create Role" to get started</div>
                                    </td>
                                </tr>
                            ) : (
                                roles.map(role => (
                                    <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{role.name}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {role.department ? (
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={14} className="text-slate-400" />
                                                    <span className="text-sm text-slate-600">{role.department.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">All Departments</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${role.scope === 'global'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : role.scope === 'cross-department'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {role.scope === 'global'
                                                    ? 'Global'
                                                    : role.scope === 'cross-department'
                                                        ? 'Cross-Dept'
                                                        : 'Department'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-slate-600">{role._count.rolePermissions}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-slate-400" />
                                                <span className="text-sm text-slate-600">{role._count.users}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${role.isActive
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {role.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(role)}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(role)}
                                                    disabled={role._count.users > 0}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={role._count.users > 0 ? 'Cannot delete (has users)' : 'Delete'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingRole ? 'Edit Role' : 'Create New Role'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Role Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g. IT Admin, FM Manager"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                                    <select
                                        value={formData.departmentId || ''}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                departmentId: e.target.value ? parseInt(e.target.value) : null,
                                            }))
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Scope</label>
                                    <select
                                        value={formData.scope}
                                        onChange={e => setFormData(prev => ({ ...prev, scope: e.target.value as any }))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="department">Department (own department only)</option>
                                        <option value="cross-department">Cross-Department (all departments)</option>
                                        <option value="global">Global (Admin)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                    <select
                                        value={formData.isActive ? 'true' : 'false'}
                                        onChange={e =>
                                            setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Access Permissions</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {modules.map(module => {
                                        const modulePermissionIds = module.permissions.map(p => p.id);
                                        const allSelected = modulePermissionIds.every(id => selectedPermissions.has(id));
                                        const someSelected = modulePermissionIds.some(id => selectedPermissions.has(id));

                                        return (
                                            <div
                                                key={module.id}
                                                className="border border-slate-200 rounded-xl p-4 hover:border-primary/30 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleModule(module)}
                                                            className="flex-shrink-0"
                                                        >
                                                            {allSelected ? (
                                                                <CheckSquare className="text-primary" size={20} />
                                                            ) : someSelected ? (
                                                                <Square className="text-primary fill-primary/20" size={20} />
                                                            ) : (
                                                                <Square className="text-slate-400" size={20} />
                                                            )}
                                                        </button>
                                                        <div>
                                                            <div className="font-medium text-slate-900">{module.name}</div>
                                                            {module.description && (
                                                                <div className="text-xs text-slate-500">{module.description}</div>
                                                            )}
                                                        </div>
                                                    </label>
                                                </div>

                                                <div className="ml-8 flex flex-wrap gap-2">
                                                    {module.permissions.map(permission => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPermissions.has(permission.id)}
                                                                onChange={() => togglePermission(permission.id)}
                                                                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                                                            />
                                                            <span className="text-sm text-slate-700 capitalize">{permission.action}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={loading}
                                className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
