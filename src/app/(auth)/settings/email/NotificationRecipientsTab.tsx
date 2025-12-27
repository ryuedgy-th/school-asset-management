'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Edit2, Mail, Users } from 'lucide-react';
import Swal from 'sweetalert2';

interface NotificationRecipient {
    id: number;
    category: string;
    recipientType: string;
    role: string;
    email: string | null;
    name: string | null;
    isActive: boolean;
}

const CATEGORIES = [
    { value: 'inspection', label: 'Inspection Reports' },
    { value: 'damage_approval', label: 'Damage Approval' },
    { value: 'damage_waiver', label: 'Damage Waiver' },
    { value: 'assignment_signature', label: 'Assignment Signature' },
];

const RECIPIENT_TYPES = [
    { value: 'to', label: 'To', icon: Mail },
    { value: 'cc', label: 'CC', icon: Users },
    { value: 'bcc', label: 'BCC', icon: Users },
    { value: 'reply_to', label: 'Reply-To', icon: Mail },
];

const ROLES = [
    { value: 'director', label: 'Director' },
    { value: 'it_head', label: 'IT Head' },
    { value: 'it_support', label: 'IT Support' },
    { value: 'department_head', label: 'Department Head' },
    { value: 'inspector', label: 'Inspector (Auto)' },
    { value: 'user', label: 'User/Borrower (Auto)' },
];

export default function NotificationRecipientsTab() {
    const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('inspection');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState<NotificationRecipient | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        category: 'inspection',
        recipientType: 'cc',
        role: 'director',
        email: '',
        name: '',
        isActive: true,
    });

    useEffect(() => {
        fetchRecipients();
    }, [selectedCategory]);

    const fetchRecipients = async () => {
        try {
            const res = await fetch(`/api/notification-recipients?category=${selectedCategory}`);
            if (res.ok) {
                const data = await res.json();
                setRecipients(data);
            }
        } catch (error) {
            console.error('Error fetching recipients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setFormData({
            category: selectedCategory,
            recipientType: 'cc',
            role: 'director',
            email: '',
            name: '',
            isActive: true,
        });
        setEditingRecipient(null);
        setShowAddModal(true);
    };

    const handleEdit = (recipient: NotificationRecipient) => {
        setFormData({
            category: recipient.category,
            recipientType: recipient.recipientType,
            role: recipient.role,
            email: recipient.email || '',
            name: recipient.name || '',
            isActive: recipient.isActive,
        });
        setEditingRecipient(recipient);
        setShowAddModal(true);
    };

    const handleSave = async () => {
        try {
            // Validate
            if (!formData.role) {
                await Swal.fire('Error', 'Please select a role', 'error');
                return;
            }

            // Dynamic roles (inspector, user) don't need email
            const isDynamicRole = ['inspector', 'user'].includes(formData.role);
            if (!isDynamicRole && !formData.email) {
                await Swal.fire('Error', 'Email is required for non-dynamic roles', 'error');
                return;
            }

            if (editingRecipient) {
                // Update
                const res = await fetch(`/api/notification-recipients/${editingRecipient.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Failed to update recipient');
                }

                await Swal.fire('Success', 'Recipient updated successfully', 'success');
            } else {
                // Create
                const res = await fetch('/api/notification-recipients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Failed to create recipient');
                }

                await Swal.fire('Success', 'Recipient added successfully', 'success');
            }

            setShowAddModal(false);
            fetchRecipients();
        } catch (error: any) {
            await Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDelete = async (recipient: NotificationRecipient) => {
        const result = await Swal.fire({
            title: 'Delete Recipient?',
            html: `Are you sure you want to delete <strong>"${recipient.name || recipient.email || recipient.role}"</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/notification-recipients/${recipient.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete recipient');
            }

            await Swal.fire('Deleted!', 'Recipient has been deleted.', 'success');
            fetchRecipients();
        } catch (error: any) {
            await Swal.fire('Error', error.message, 'error');
        }
    };

    const getRecipientTypeLabel = (type: string) => {
        return RECIPIENT_TYPES.find(t => t.value === type)?.label || type;
    };

    const getRoleLabel = (role: string) => {
        return ROLES.find(r => r.value === role)?.label || role;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Notification Recipients</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage email recipients for different notification types
                    </p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Recipient
                </button>
            </div>

            {/* Category Selector */}
            <div className="flex gap-2 border-b border-slate-200">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-4 py-2 font-medium transition-colors ${selectedCategory === cat.value
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Info Box */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-primary">
                    <strong>ℹ️ How CC works:</strong> When a user replies to a notification email,
                    all recipients in the CC field will receive the response automatically. This ensures
                    everyone stays in the loop.
                </p>
            </div>

            {/* Recipients Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {recipients.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No recipients configured for this category
                                </td>
                            </tr>
                        ) : (
                            recipients.map((recipient) => (
                                <tr key={recipient.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {getRecipientTypeLabel(recipient.recipientType)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {getRoleLabel(recipient.role)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {recipient.email || (
                                            <span className="italic text-slate-400">Dynamic</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {recipient.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${recipient.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {recipient.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(recipient)}
                                            className="text-primary hover:text-primary/80 mr-4"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(recipient)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            {editingRecipient ? 'Edit Recipient' : 'Add Recipient'}
                        </h3>

                        <div className="space-y-4">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Recipient Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Recipient Type
                                </label>
                                <select
                                    value={formData.recipientType}
                                    onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    {RECIPIENT_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    {ROLES.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Email */}
                            {!['inspector', 'user'].includes(formData.role) && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="recipient@school.com"
                                    />
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Display name"
                                />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                                />
                                <label htmlFor="isActive" className="ml-2 text-sm text-slate-700">
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                {editingRecipient ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
