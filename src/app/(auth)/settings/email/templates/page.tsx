'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Edit, Check, Eye } from 'lucide-react';

interface EmailAccount {
    id: number;
    name: string;
    email: string;
}

interface EmailTemplate {
    id: number;
    name: string;
    subject: string;
    body: string;
    variables: string;
    category: string;
    isActive: boolean;
    emailAccount?: EmailAccount | null;
    createdAt: string;
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        fetchTemplates();
        fetchAccounts();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/email-templates');
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/email-accounts');
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const res = await fetch(`/api/email-templates/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchTemplates();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete template');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    };

    const filteredTemplates = selectedCategory === 'all'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    const categories = [
        { value: 'all', label: 'All Templates' },
        { value: 'inspection', label: 'Inspection' },
        { value: 'borrowing', label: 'Borrowing' },
        { value: 'general', label: 'General' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Email Templates</h1>
                    <p className="text-slate-600 mt-2">Manage email templates with dynamic variables</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    New Template
                </button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6">
                {categories.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === cat.value
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Templates List */}
            {filteredTemplates.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates found</h3>
                    <p className="text-slate-600 mb-6">Create your first email template to get started</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Plus size={20} />
                        Create Template
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                                        {!template.isActive && (
                                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase">
                                            {template.category}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 mb-2 font-medium">Subject: {template.subject}</p>
                                    <p className="text-sm text-slate-500 line-clamp-2">{template.body}</p>
                                    {template.emailAccount && (
                                        <p className="text-sm text-slate-500 mt-2">
                                            📧 {template.emailAccount.name} ({template.emailAccount.email})
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingTemplate(template)}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Edit template"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete template"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {(showAddModal || editingTemplate) && (
                <TemplateModal
                    template={editingTemplate}
                    accounts={accounts}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingTemplate(null);
                    }}
                    onSuccess={() => {
                        fetchTemplates();
                        setShowAddModal(false);
                        setEditingTemplate(null);
                    }}
                />
            )}
        </div>
    );
}

// Template Modal Component
function TemplateModal({
    template,
    accounts,
    onClose,
    onSuccess,
}: {
    template: EmailTemplate | null;
    accounts: EmailAccount[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: template?.name || '',
        subject: template?.subject || '',
        body: template?.body || '',
        category: template?.category || 'general',
        emailAccountId: template?.emailAccount?.id || '',
        isActive: template?.isActive ?? true,
    });
    const [saving, setSaving] = useState(false);

    const availableVariables = [
        '{userName}', '{userEmail}', '{assetName}', '{assetCode}',
        '{date}', '{inspectionNumber}', '{transactionNumber}', '{department}'
    ];

    const insertVariable = (variable: string) => {
        setFormData({
            ...formData,
            body: formData.body + ' ' + variable
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = template
                ? `/api/email-templates/${template.id}`
                : '/api/email-templates';

            const method = template ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    variables: availableVariables,
                }),
            });

            if (res.ok) {
                onSuccess();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to save template');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {template ? 'Edit Template' : 'Create Template'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Template Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Inspection Complete"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                            >
                                <option value="general">General</option>
                                <option value="inspection">Inspection</option>
                                <option value="borrowing">Borrowing</option>
                            </select>
                        </div>
                    </div>

                    {/* Email Account */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Send From (Email Account)
                        </label>
                        <select
                            value={formData.emailAccountId}
                            onChange={(e) => setFormData({ ...formData, emailAccountId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">Default Account</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} ({account.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Email Subject
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Inspection Complete - {assetCode}"
                            required
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Email Body
                        </label>
                        <textarea
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[200px]"
                            placeholder="Dear {userName},&#10;&#10;The inspection for {assetName} has been completed..."
                            required
                        />
                    </div>

                    {/* Variables */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Available Variables (click to insert)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableVariables.map((variable) => (
                                <button
                                    key={variable}
                                    type="button"
                                    onClick={() => insertVariable(variable)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-primary/10 text-slate-700 hover:text-primary rounded-md text-sm font-mono transition-colors"
                                >
                                    {variable}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active */}
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Active
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check size={20} />
                                    {template ? 'Update Template' : 'Create Template'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
