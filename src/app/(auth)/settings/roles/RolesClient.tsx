'use client';

import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, Building2, X, Save, AlertCircle } from 'lucide-react';
import { DEFAULT_PERMISSIONS, type ModuleName, type PermissionAction, type PermissionConfig } from '@/lib/permissions';
import Swal from 'sweetalert2';

interface Role {
    id: number;
    name: string;
    departmentId: number | null;
    department: { id: number; code: string; name: string } | null;
    permissions: string;
    scope: string;
    isActive: boolean;
    _count: { users: number };
}

interface Department {
    id: number;
    code: string;
    name: string;
}

const MODULES: { name: ModuleName; label: string; description: string }[] = [
    { name: 'assets', label: 'Assets', description: 'Manage assets and equipment' },
    { name: 'inspections', label: 'Inspections', description: 'Asset condition inspections' },
    { name: 'assignments', label: 'Assignments', description: 'Assign and borrow assets' },
    { name: 'maintenance', label: 'Maintenance (FM)', description: 'Repair and maintenance (FM only)' },
    { name: 'stationary', label: 'Stationary', description: 'Office supplies (Stationary only)' },
    { name: 'users', label: 'Users', description: 'Manage users' },
    { name: 'reports', label: 'Reports', description: 'View and export reports' },
    { name: 'settings', label: 'Settings', description: 'System settings' },
    { name: 'roles', label: 'Roles', description: 'Manage roles and permissions' },
    { name: 'departments', label: 'Departments', description: 'Manage departments' },
];

const ACTIONS: { action: PermissionAction; label: string }[] = [
    { action: 'view', label: 'View' },
    { action: 'create', label: 'Create' },
    { action: 'edit', label: 'Edit' },
    { action: 'delete', label: 'Delete' },
    { action: 'approve', label: 'Approve' },
    { action: 'export', label: 'Export' },
];

export default function RolesClient({
    roles: initialRoles,
    departments,
}: {
    roles: Role[];
    departments: Department[];
}) {
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        departmentId: null as number | null,
        scope: 'department' as 'department' | 'cross-department' | 'global',
        isActive: true,
        permissions: {} as PermissionConfig,
    });

    const openCreateModal = () => {
        setEditingRole(null);
        setFormData({
            name: '',
            departmentId: null,
            scope: 'department',
            isActive: true,
            permissions: {
                scope: 'department',
                modules: {},
            },
        });
        setShowModal(true);
        setError(null);
    };

    const openEditModal = (role: Role) => {
        setEditingRole(role);

        // Parse permissions and ensure proper structure
        let permissions: PermissionConfig;
        try {
            const parsed = JSON.parse(role.permissions);
            // Ensure modules object exists
            permissions = {
                scope: parsed.scope || role.scope,
                department: parsed.department,
                modules: parsed.modules || {},
            };
        } catch (error) {
            // If parsing fails, use empty structure
            console.error('Error parsing permissions:', error);
            permissions = {
                scope: role.scope as any,
                modules: {},
            };
        }

        setFormData({
            name: role.name,
            departmentId: role.departmentId,
            scope: role.scope as any,
            isActive: role.isActive,
            permissions,
        });
        setShowModal(true);
        setError(null);
    };

    const handleModuleToggle = (module: ModuleName) => {
        setFormData(prev => {
            const newPermissions = {
                ...prev.permissions,
                modules: { ...(prev.permissions?.modules || {}) }
            };
            const currentModule = newPermissions.modules[module];

            if (currentModule?.enabled) {
                // Disable module
                newPermissions.modules[module] = { enabled: false, permissions: [] };
            } else {
                // Enable module with default permissions
                newPermissions.modules[module] = {
                    enabled: true,
                    permissions: ['view'],
                    filters: { ownDepartmentOnly: prev.scope === 'department' },
                };
            }

            return { ...prev, permissions: newPermissions };
        });
    };

    const handlePermissionToggle = (module: ModuleName, action: PermissionAction) => {
        setFormData(prev => {
            // Create a deep copy of modules
            const modules = { ...(prev.permissions?.modules || {}) };

            // If module doesn't exist, create it with the permission
            if (!modules[module]) {
                return {
                    ...prev,
                    permissions: {
                        ...prev.permissions,
                        modules: {
                            ...modules,
                            [module]: {
                                enabled: true,
                                permissions: [action],
                                filters: { ownDepartmentOnly: prev.scope === 'department' },
                            }
                        }
                    }
                };
            }

            const moduleConfig = modules[module];

            // If module exists but not enabled, enable it and add permission
            if (!moduleConfig.enabled) {
                return {
                    ...prev,
                    permissions: {
                        ...prev.permissions,
                        modules: {
                            ...modules,
                            [module]: {
                                ...moduleConfig,
                                enabled: true,
                                permissions: [action],
                            }
                        }
                    }
                };
            }

            // Module is enabled, toggle the specific permission
            const permissions = moduleConfig.permissions || [];
            const hasPermission = permissions.includes(action);

            const newPermissions = hasPermission
                ? permissions.filter(p => p !== action)
                : [...permissions, action];

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    modules: {
                        ...modules,
                        [module]: {
                            ...moduleConfig,
                            permissions: newPermissions,
                        }
                    }
                }
            };
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validation
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

            // Update permissions scope and department code within the permissions object
            const permissionsToSave = {
                ...formData.permissions,
                scope: formData.scope, // Ensure permissions object's scope matches form's top-level scope
                department: formData.departmentId
                    ? departments.find(d => d.id === formData.departmentId)?.code
                    : undefined, // Ensure permissions object's department code matches form's departmentId
            };

            const body = {
                name: formData.name,
                departmentId: formData.departmentId,
                scope: formData.scope,
                isActive: formData.isActive,
                permissions: JSON.stringify(permissionsToSave),
            };

            const url = editingRole
                ? `/api/roles/${editingRole.id}`
                : '/api/roles';

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

                // Show success message with logout reminder
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-4 md:p-8 pt-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <Shield className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Roles Management</h1>
                                <p className="text-slate-500 mt-1">Define roles and access permissions</p>
                            </div>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                            Create Role
                        </button>
                    </div>
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
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-semibold text-slate-900">Roles List</h2>
                    </div>

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
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
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
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80"
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
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80"
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
                                        onChange={e =>
                                            setFormData(prev => ({ ...prev, scope: e.target.value as any }))
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80"
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
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Access Permissions</h3>
                                <div className="space-y-4">
                                    {MODULES.map(module => {
                                        const moduleConfig = formData.permissions?.modules?.[module.name];
                                        const isEnabled = moduleConfig?.enabled || false;

                                        return (
                                            <div
                                                key={module.name}
                                                className="border border-slate-200 rounded-xl p-4 hover:border-primary/30 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isEnabled}
                                                                onChange={() => handleModuleToggle(module.name)}
                                                                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary/80"
                                                            />
                                                            <div>
                                                                <div className="font-medium text-slate-900">{module.label}</div>
                                                                <div className="text-xs text-slate-500">{module.description}</div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>

                                                {isEnabled && (
                                                    <div className="ml-8 flex flex-wrap gap-2">
                                                        {ACTIONS.map(({ action, label }) => (
                                                            <label
                                                                key={action}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={moduleConfig?.permissions?.includes(action) || false}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePermissionToggle(module.name, action);
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/80"
                                                                />
                                                                <span className="text-sm text-slate-700">{label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
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
