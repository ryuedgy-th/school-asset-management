'use client';

import { useState, useEffect } from 'react';
import { Plus, Mail, Settings, Trash2, Edit, Check, X, Send } from 'lucide-react';

interface EmailAccount {
    id: number;
    name: string;
    email: string;
    type: string;
    isDefault: boolean;
    isActive: boolean;
    smtpHost?: string;
    smtpPort?: number;
    createdAt: string;
}

export default function EmailAccountsPage() {
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
    const [testingId, setTestingId] = useState<number | null>(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/email-accounts');
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this email account?')) return;

        try {
            const res = await fetch(`/api/email-accounts/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchAccounts();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account');
        }
    };

    const handleTest = async (id: number) => {
        setTestingId(id);
        try {
            const res = await fetch(`/api/email-accounts/${id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Test email sent successfully!');
            } else {
                alert(data.error || 'Test failed');
            }
        } catch (error) {
            console.error('Error testing account:', error);
            alert('Test failed');
        } finally {
            setTestingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading email accounts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Email Accounts</h1>
                    <p className="text-slate-600 mt-2">Manage SMTP and OAuth email accounts for sending notifications</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    Add Account
                </button>
            </div>

            {/* Accounts List */}
            {accounts.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Mail size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No email accounts configured</h3>
                    <p className="text-slate-600 mb-6">Add your first email account to start sending notifications</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Plus size={20} />
                        Add Email Account
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-slate-900">{account.name}</h3>
                                        {account.isDefault && (
                                            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                                Default
                                            </span>
                                        )}
                                        {!account.isActive && (
                                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full uppercase">
                                            {account.type}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 mb-3">{account.email}</p>
                                    {account.type === 'SMTP' && account.smtpHost && (
                                        <p className="text-sm text-slate-500">
                                            {account.smtpHost}:{account.smtpPort}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleTest(account.id)}
                                        disabled={testingId === account.id}
                                        className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors disabled:opacity-50"
                                        title="Send test email"
                                    >
                                        {testingId === account.id ? (
                                            <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Send size={20} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setEditingAccount(account)}
                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Edit account"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        disabled={account.isDefault}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title={account.isDefault ? "Cannot delete default account" : "Delete account"}
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
            {(showAddModal || editingAccount) && (
                <AccountModal
                    account={editingAccount}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingAccount(null);
                    }}
                    onSuccess={() => {
                        fetchAccounts();
                        setShowAddModal(false);
                        setEditingAccount(null);
                    }}
                />
            )}
        </div>
    );
}

// Account Modal Component
function AccountModal({
    account,
    onClose,
    onSuccess,
}: {
    account: EmailAccount | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: account?.name || '',
        email: account?.email || '',
        type: account?.type || 'SMTP',
        isDefault: account?.isDefault || false,
        isActive: account?.isActive ?? true,
        smtpHost: account?.smtpHost || 'smtp.gmail.com',
        smtpPort: account?.smtpPort || 587,
        smtpUser: account?.email || '',
        smtpPassword: '',
        smtpSecure: true,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = account
                ? `/api/email-accounts/${account.id}`
                : '/api/email-accounts';

            const method = account ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSuccess();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to save account');
            }
        } catch (error) {
            console.error('Error saving account:', error);
            alert('Failed to save account');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {account ? 'Edit Email Account' : 'Add Email Account'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Account Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="IT Department"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value, smtpUser: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="it@school.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Account Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            disabled={!!account}
                        >
                            <option value="SMTP">SMTP (Gmail, Outlook, etc.)</option>
                            <option value="GOOGLE_OAUTH">Google OAuth (Coming Soon)</option>
                        </select>
                    </div>

                    {/* SMTP Settings */}
                    {formData.type === 'SMTP' && (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        SMTP Host
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.smtpHost}
                                        onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="smtp.gmail.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Port
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.smtpPort}
                                        onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password / App Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.smtpPassword}
                                    onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder={account ? "Leave blank to keep current password" : "Enter password"}
                                    required={!account}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    For Gmail, use an App Password. <a href="https://support.google.com/accounts/answer/185833" target="_blank" className="text-primary hover:underline">Learn more</a>
                                </p>
                            </div>
                        </>
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Set as default account
                            </span>
                        </label>
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
                                    {account ? 'Update Account' : 'Add Account'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
