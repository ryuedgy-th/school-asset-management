'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface CreateRequisitionModalProps {
    items: any[];
    departments: any[];
    user: any;
    onClose: () => void;
}

interface RequisitionItem {
    itemId: string;
    quantity: string;
}

export default function CreateRequisitionModal({ items, departments, user, onClose }: CreateRequisitionModalProps) {
    const [formData, setFormData] = useState({
        departmentId: user.departmentId?.toString() || '',
        requestedForType: 'department',
        requestedForUserId: '',
        purpose: '',
        priority: 'normal',
    });
    const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([
        { itemId: '', quantity: '' },
    ]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    // Fetch users for "Requested For" dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    const addItem = () => {
        setRequisitionItems([...requisitionItems, { itemId: '', quantity: '' }]);
    };

    const removeItem = (index: number) => {
        setRequisitionItems(requisitionItems.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof RequisitionItem, value: string) => {
        const updated = [...requisitionItems];
        updated[index][field] = value;
        setRequisitionItems(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate items
        const validItems = requisitionItems.filter(item => item.itemId && item.quantity);
        if (validItems.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'No Items',
                text: 'Please add at least one item to the requisition',
            });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                departmentId: parseInt(formData.departmentId),
                requestedForType: formData.requestedForType,
                requestedForUserId: formData.requestedForType === 'personal' && formData.requestedForUserId
                    ? parseInt(formData.requestedForUserId)
                    : undefined,
                purpose: formData.purpose,
                urgency: formData.priority,
                items: validItems.map(item => ({
                    itemId: parseInt(item.itemId),
                    quantity: parseInt(item.quantity),
                })),
            };

            const res = await fetch('/api/stationary/requisitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create requisition');
            }

            await Swal.fire({
                icon: 'success',
                title: 'Created!',
                text: 'Requisition has been created successfully',
                timer: 2000,
                showConfirmButton: false,
            });

            window.location.reload();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Failed to create requisition',
            });
        } finally {
            setLoading(false);
        }
    };

    const getItemName = (itemId: string) => {
        const item = items.find(i => i.id === parseInt(itemId));
        return item ? `${item.itemCode} - ${item.name} (${item.uom})` : '';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-900">Create New Requisition</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.departmentId}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Requested For Section */}
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">Requested For (เบิกให้ใคร)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Request Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.requestedForType}
                                    onChange={(e) => setFormData({ ...formData, requestedForType: e.target.value, requestedForUserId: '' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                    required
                                >
                                    <option value="department">For Department (ใช้แผนก)</option>
                                    <option value="personal">For Specific Person (ใช้ส่วนตัว)</option>
                                </select>
                            </div>

                            {formData.requestedForType === 'personal' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Person <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.requestedForUserId}
                                        onChange={(e) => setFormData({ ...formData, requestedForUserId: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="">Select Person</option>
                                        {Array.isArray(users) && users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                            {formData.requestedForType === 'department'
                                ? '✓ Items will be for department use (general office supplies)'
                                : '✓ Items will be assigned to a specific person (accountability tracking)'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Purpose <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Describe the purpose of this requisition..."
                            required
                        />
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-slate-700">
                                Items <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <Plus size={16} />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {requisitionItems.map((item, index) => (
                                <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                                    <div className="flex-1">
                                        <select
                                            value={item.itemId}
                                            onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Select Item</option>
                                            {items.map(i => (
                                                <option key={i.id} value={i.id}>
                                                    {i.itemCode} - {i.name} ({i.uom})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            placeholder="Qty"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    {requisitionItems.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Requisition'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
