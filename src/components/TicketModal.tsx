'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Search, User as UserIcon } from 'lucide-react';
import FileUpload from './FileUpload';

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface UploadedFile {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    department: string | null;
}

export default function TicketModal({ isOpen, onClose, onSuccess }: TicketModalProps) {
    const [type, setType] = useState<'IT' | 'FM'>('IT');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('');
    const [affectedUserId, setAffectedUserId] = useState<number | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const MAX_TITLE_LENGTH = 255;

    // Fetch users for affected user selection
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users?limit=100');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setPriority('medium');
            setCategory('');
            setAffectedUserId(null);
            setUserSearchTerm('');
            setShowUserDropdown(false);
            setFiles([]);
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !description.trim() || !category) {
            setError('Please fill in all required fields');
            return;
        }

        if (title.length > MAX_TITLE_LENGTH) {
            setError(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
            return;
        }

        if (description.length < 10) {
            setError('Description must be at least 10 characters');
            return;
        }

        try {
            setSubmitting(true);
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    title: title.trim(),
                    description: description.trim(),
                    priority,
                    category,
                    affectedUserId,
                    attachments: files.map(f => ({
                        filename: f.filename,
                        originalName: f.originalName,
                        mimeType: f.mimeType,
                        size: f.size,
                        url: f.url,
                    })),
                }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create ticket');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-slate-900">Create New Ticket</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Ticket Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setType('IT')}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${type === 'IT'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-300 hover:border-slate-400'
                                    }`}
                            >
                                IT Support
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('FM')}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${type === 'FM'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-slate-300 hover:border-slate-400'
                                    }`}
                            >
                                Facilities
                            </button>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                        >
                            <option value="">Select category...</option>
                            {type === 'IT' ? (
                                <>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software">Software</option>
                                    <option value="Network">Network</option>
                                    <option value="Printer">Printer</option>
                                    <option value="Other">Other</option>
                                </>
                            ) : (
                                <>
                                    <option value="HVAC">HVAC (Air Conditioning)</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="Furniture">Furniture</option>
                                    <option value="Building">Building Maintenance</option>
                                    <option value="Other">Other</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Priority <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                        >
                            <option value="low">Low - Can wait</option>
                            <option value="medium">Medium - Normal</option>
                            <option value="high">High - Important</option>
                            <option value="urgent">Urgent - Critical</option>
                        </select>
                    </div>

                    {/* Affected User */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Reported For <span className="text-slate-500 text-xs font-normal">(Optional - If reporting for someone else)</span>
                        </label>
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={userSearchTerm}
                                    onChange={(e) => {
                                        setUserSearchTerm(e.target.value);
                                        setShowUserDropdown(true);
                                    }}
                                    onFocus={() => setShowUserDropdown(true)}
                                    onBlur={() => {
                                        // Delay to allow clicking on dropdown items
                                        setTimeout(() => setShowUserDropdown(false), 200);
                                    }}
                                    placeholder="Search for user by name or email..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            {showUserDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {users
                                        .filter(u =>
                                            !userSearchTerm ||
                                            u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                            u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                                        )
                                        .slice(0, 10)
                                        .map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    // Prevent blur from happening before click
                                                    e.preventDefault();
                                                    setAffectedUserId(user.id);
                                                    setUserSearchTerm(user.name || user.email || '');
                                                    setShowUserDropdown(false);
                                                }}
                                                className={`w-full p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
                                                    affectedUserId === user.id ? 'bg-primary/10' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <UserIcon size={16} className="text-slate-400" />
                                                    <div>
                                                        <div className="font-medium text-slate-900">{user.name}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                        {user.department && (
                                                            <div className="text-xs text-slate-400">{user.department}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    {users.filter(u =>
                                        !userSearchTerm ||
                                        u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                                    ).length === 0 && (
                                        <div className="p-4 text-center text-slate-500 text-sm">
                                            No users found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {affectedUserId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setAffectedUserId(null);
                                    setUserSearchTerm('');
                                }}
                                className="mt-2 text-xs text-red-600 hover:underline"
                            >
                                Clear selection
                            </button>
                        )}
                    </div>

                    {/* Title with Character Counter */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Summary <span className="text-red-500">*</span>
                            </label>
                            <span className={`text-xs ${title.length > MAX_TITLE_LENGTH - 15
                                    ? 'text-orange-600 font-semibold'
                                    : 'text-slate-500'
                                }`}>
                                {title.length}/{MAX_TITLE_LENGTH}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={MAX_TITLE_LENGTH}
                            placeholder="Brief description of the issue (like an email subject)"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide detailed information about the issue..."
                            rows={5}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            required
                        />
                        {description.length > 0 && description.length < 10 && (
                            <p className="text-xs text-orange-600 mt-1">
                                At least 10 characters required ({description.length}/10)
                            </p>
                        )}
                    </div>

                    {/* File Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Attachments <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                        </label>
                        <FileUpload
                            onFilesChange={setFiles}
                            maxFiles={5}
                            maxSize={10}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
