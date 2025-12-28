'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';

interface UploadedFile {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
}

interface FileUploadProps {
    onFilesChange: (files: UploadedFile[]) => void;
    maxFiles?: number;
    maxSize?: number; // in MB
}

export default function FileUpload({ onFilesChange, maxFiles = 5, maxSize = 10 }: FileUploadProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = async (newFiles: File[]) => {
        setError('');

        // Check file count
        if (files.length + newFiles.length > maxFiles) {
            setError(`Maximum ${maxFiles} files allowed`);
            return;
        }

        // Check file sizes
        const oversizedFiles = newFiles.filter(f => f.size > maxSize * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            setError(`Some files exceed ${maxSize}MB limit`);
            return;
        }

        setUploading(true);

        try {
            const uploadPromises = newFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload/ticket', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Upload failed');
                }

                const data = await response.json();
                return data.file as UploadedFile;
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            const newFilesList = [...files, ...uploadedFiles];
            setFiles(newFilesList);
            onFilesChange(newFilesList);
        } catch (err: any) {
            setError(err.message || 'Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onFilesChange(newFiles);
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return <ImageIcon size={20} className="text-blue-500" />;
        } else if (mimeType === 'application/pdf') {
            return <FileText size={20} className="text-red-500" />;
        } else {
            return <File size={20} className="text-slate-500" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-300 hover:border-slate-400'
                    } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />

                <Upload className="mx-auto text-slate-400 mb-3" size={32} />

                <p className="text-sm font-medium text-slate-700 mb-1">
                    Drag and drop files here, or{' '}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:underline"
                    >
                        browse
                    </button>
                </p>

                <p className="text-xs text-slate-500">
                    Maximum {maxFiles} files, {maxSize}MB each
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    Supported: Images, PDF, Word, Excel, Text
                </p>

                {uploading && (
                    <div className="mt-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-slate-600 mt-2">Uploading...</p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Uploaded Files List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                        Attached Files ({files.length}/{maxFiles})
                    </p>
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                            {getFileIcon(file.mimeType)}

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {file.originalName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-1 hover:bg-slate-200 rounded transition-colors"
                            >
                                <X size={16} className="text-slate-600" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
