'use client';

import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';

interface LocationModalProps {
    location: any | null;
    departments: any[];
    users: any[];
    onClose: () => void;
}

export default function LocationModal({ location, departments, users, onClose }: LocationModalProps) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'warehouse',
        address: '',
        capacity: '',
        departmentId: '',
        managedById: '',
        description: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location) {
            setFormData({
                code: location.code || '',
                name: location.name || '',
                type: location.type || 'warehouse',
                address: location.address || '',
                capacity: location.capacity?.toString() || '',
                departmentId: location.department?.id?.toString() || '',
                managedById: location.managedBy?.id?.toString() || '',
                description: location.description || '',
                isActive: location.isActive ?? true,
            });
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                code: formData.code,
                name: formData.name,
                type: formData.type,
                address: formData.address || null,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
                managedById: formData.managedById ? parseInt(formData.managedById) : null,
                description: formData.description || null,
                isActive: formData.isActive,
            };

            const url = location
                ? `/api/stationary/locations/${location.id}`
                : '/api/stationary/locations';

            const method = location ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save location');
            }

            Swal.fire({
                icon: 'success',
                title: location ? 'Updated!' : 'Created!',
                text: `Location has been ${location ? 'updated' : 'created'} successfully`,
                timer: 2000,
                showConfirmButton: false,
            });

            window.location.reload();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to save location',
            });
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-primary to-purple-600">
                    <h2 className="font-bold text-xl text-white flex items-center gap-2">
                        <MapPin size={24} />
                        {location ? 'Edit Location' : 'Add New Location'}
                    </h2>
                    <button onClick={onClose} className="text-white hover:text-slate-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Code */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Location Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g., WH-MAIN"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Location Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Main Warehouse"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="warehouse">Warehouse</option>
                                <option value="department">Department Store</option>
                                <option value="storage">Storage Room</option>
                            </select>
                        </div>

                        {/* Capacity */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Capacity (items)
                            </label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                placeholder="Optional"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Department
                            </label>
                            <select
                                value={formData.departmentId}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="">None</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Manager */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Manager
                            </label>
                            <select
                                value={formData.managedById}
                                onChange={(e) => setFormData({ ...formData, managedById: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="">None</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="mt-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Full address (optional)"
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    {/* Description */}
                    <div className="mt-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Additional notes (optional)"
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    {/* Active Status */}
                    <div className="mt-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-slate-700">Active Location</span>
                        </label>
                    </div>
                </form>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
                    </button>
                </div>
            </div>
        </div>
    );
}
