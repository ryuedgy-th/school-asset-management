'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Edit, Check, Eye } from 'lucide-react';
import EnhancedTemplateEditor from '@/components/EnhancedTemplateEditor';
import Swal from 'sweetalert2';

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

export default function EmailTemplatesTab() {
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

            {/* Enhanced Template Editor */}
            {(showAddModal || editingTemplate) && (
                <EnhancedTemplateEditor
                    category={editingTemplate?.category || 'general'}
                    initialSubject={editingTemplate?.subject || ''}
                    initialBody={editingTemplate?.body || ''}
                    onSave={async (subject, body) => {
                        try {
                            const url = editingTemplate
                                ? `/api/email-templates/${editingTemplate.id}`
                                : '/api/email-templates';

                            const method = editingTemplate ? 'PUT' : 'POST';

                            // Prompt for template name if creating new
                            let templateName = editingTemplate?.name;
                            if (!editingTemplate) {
                                const { value: name } = await Swal.fire({
                                    title: 'Template Name',
                                    input: 'text',
                                    inputLabel: 'Enter a name for this template',
                                    inputPlaceholder: 'e.g., Inspection Complete',
                                    showCancelButton: true,
                                    confirmButtonColor: '#574193',
                                    inputValidator: (value) => {
                                        if (!value) return 'Please enter a template name';
                                    },
                                });
                                if (!name) return;
                                templateName = name;
                            }

                            const res = await fetch(url, {
                                method,
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: templateName,
                                    subject,
                                    body,
                                    category: editingTemplate?.category || 'general',
                                    isActive: editingTemplate?.isActive ?? true,
                                }),
                            });

                            if (res.ok) {
                                await Swal.fire({
                                    icon: 'success',
                                    title: 'Success!',
                                    text: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
                                    confirmButtonColor: '#574193',
                                });
                                fetchTemplates();
                                setShowAddModal(false);
                                setEditingTemplate(null);
                            } else {
                                const error = await res.json();
                                throw new Error(error.error || 'Failed to save template');
                            }
                        } catch (error: any) {
                            await Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: error.message,
                                confirmButtonColor: '#574193',
                            });
                        }
                    }}
                    onCancel={() => {
                        setShowAddModal(false);
                        setEditingTemplate(null);
                    }}
                />
            )}
        </div>
    );
}
