'use client';

import { useState } from 'react';
import { Building2, Plus, Edit, Trash2, Users, Shield, Package, ClipboardCheck, X, Save, AlertCircle } from 'lucide-react';

interface Department {
    id: number;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
    _count: {
        users: number;
        roles: number;
        assets: number;
        inspections: number;
    };
}

export default function DepartmentsTab({
    departments,
    setDepartments
}: {
    departments: Department[];
    setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        isActive: true,
    });

    const openCreateModal = () => {
        setEditingDept(null);
        setFormData({ code: '', name: '', description: '', isActive: true });
        setShowModal(true);
        setError(null);
    };

    const openEditModal = (dept: Department) => {
        setEditingDept(dept);
        setFormData({
            code: dept.code,
            name: dept.name,
            description: dept.description || '',
            isActive: dept.isActive,
        });
        setShowModal(true);
        setError(null);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!formData.code.trim() || !formData.name.trim()) {
                setError('Please enter department code and name');
                return;
            }

            const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
            const method = editingDept ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save department');
            }

            if (editingDept) {
                setDepartments(prev => prev.map(d => (d.id === data.id ? data : d)));
            } else {
                setDepartments(prev => [...prev, data]);
            }

            setShowModal(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (dept: Department) => {
        const totalCount = dept._count.users + dept._count.roles + dept._count.assets + dept._count.inspections;

        if (totalCount > 0) {
            alert(
                `Cannot delete department with existing data:\n` +
                `- Users: ${dept._count.users}\n` +
                `- Roles: ${dept._count.roles}\n` +
                `- Assets: ${dept._count.assets}\n` +
                `- Inspections: ${dept._count.inspections}`
            );
            return;
        }

        if (!confirm(`Are you sure you want to delete "${dept.name}"?`)) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/departments/${dept.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete department');
            }

            setDepartments(prev => prev.filter(d => d.id !== dept.id));
        } catch (err: any) {
            alert(err.message);
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
                                <Building2 className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Departments</h1>
                                <p className="text-slate-500 mt-1">Manage departments and organizational units</p>
                            </div>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                            Create Department
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Departments</div>
                        <div className="text-2xl font-bold text-slate-900">{departments.length}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Users</div>
                        <div className="text-2xl font-bold text-primary">
                            {departments.reduce((sum, d) => sum + d._count.users, 0)}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Assets</div>
                        <div className="text-2xl font-bold text-green-600">
                            {departments.reduce((sum, d) => sum + d._count.assets, 0)}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">Total Roles</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {departments.reduce((sum, d) => sum + d._count.roles, 0)}
                        </div>
                    </div>
                </div>

                {/* Departments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map(dept => (
                        <div
                            key={dept.id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-900">{dept.name}</h3>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {dept.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-mono text-slate-500 mb-2">{dept.code}</div>
                                    {dept.description && (
                                        <p className="text-sm text-slate-600">{dept.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Users size={16} className="text-slate-400" />
                                    <span className="text-slate-600">{dept._count.users} Users</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield size={16} className="text-slate-400" />
                                    <span className="text-slate-600">{dept._count.roles} Roles</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Package size={16} className="text-slate-400" />
                                    <span className="text-slate-600">{dept._count.assets} Assets</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <ClipboardCheck size={16} className="text-slate-400" />
                                    <span className="text-slate-600">{dept._count.inspections} Inspections</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => openEditModal(dept)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                    <Edit size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(dept)}
                                    disabled={
                                        dept._count.users + dept._count.roles + dept._count.assets + dept._count.inspections > 0
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingDept ? 'Edit Department' : 'Create New Department'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Department Code *</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                    disabled={!!editingDept}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80 disabled:bg-slate-100 disabled:cursor-not-allowed font-mono"
                                    placeholder="IT, FM, STATIONARY"
                                />
                                {editingDept && (
                                    <p className="text-xs text-slate-500 mt-1">Department code cannot be changed</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Department Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80"
                                    placeholder="IT Department"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80"
                                    placeholder="Department description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                <select
                                    value={formData.isActive ? 'true' : 'false'}
                                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
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
