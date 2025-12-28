'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
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

export default function TicketModal({ isOpen, onClose, onSuccess }: TicketModalProps) {
    const [type, setType] = useState<'IT' | 'FM'>('IT');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const MAX_TITLE_LENGTH = 255;

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setPriority('medium');
            setCategory('');
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
