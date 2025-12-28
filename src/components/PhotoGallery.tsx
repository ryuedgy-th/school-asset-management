'use client';

import { useState } from 'react';
import { X, Upload, Trash2, ZoomIn, Download } from 'lucide-react';
import Image from 'next/image';

interface PhotoGalleryProps {
    images: string[];
    onUpload?: (files: FileList) => Promise<void>;
    onDelete?: (imagePath: string) => Promise<void>;
    editable?: boolean;
    maxFiles?: number;
}

export default function PhotoGallery({
    images,
    onUpload,
    onDelete,
    editable = false,
    maxFiles = 10,
}: PhotoGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !onUpload) return;

        // Validate file count
        if (images.length + files.length > maxFiles) {
            alert(`Maximum ${maxFiles} images allowed`);
            return;
        }

        // Validate file sizes (5MB max)
        for (let i = 0; i < files.length; i++) {
            if (files[i].size > 5 * 1024 * 1024) {
                alert(`File ${files[i].name} exceeds 5MB limit`);
                return;
            }
        }

        setUploading(true);
        try {
            await onUpload(files);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (imagePath: string) => {
        if (!onDelete) return;
        if (!confirm('Are you sure you want to delete this image?')) return;

        setDeleting(imagePath);
        try {
            await onDelete(imagePath);
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Delete failed');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload Button */}
            {editable && (
                <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                        <Upload size={18} />
                        {uploading ? 'Uploading...' : 'Upload Images'}
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileChange}
                            disabled={uploading || images.length >= maxFiles}
                            className="hidden"
                        />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                        Max {maxFiles} images, 5MB each. Supported: JPG, PNG, WebP
                    </p>
                </div>
            )}

            {/* Image Grid */}
            {images.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">No images uploaded</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                        >
                            <Image
                                src={image}
                                alt={`Image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />

                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setSelectedImage(image)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 hover:bg-gray-100"
                                    title="View full size"
                                >
                                    <ZoomIn size={18} className="text-gray-700" />
                                </button>

                                <a
                                    href={image}
                                    download
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 hover:bg-gray-100"
                                    title="Download"
                                >
                                    <Download size={18} className="text-gray-700" />
                                </a>

                                {editable && onDelete && (
                                    <button
                                        onClick={() => handleDelete(image)}
                                        disabled={deleting === image}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 rounded-full p-2 hover:bg-red-600 disabled:opacity-50"
                                        title="Delete"
                                    >
                                        {deleting === image ? (
                                            <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 size={18} className="text-white" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
                    >
                        <X size={24} className="text-gray-700" />
                    </button>

                    <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
                        <Image
                            src={selectedImage}
                            alt="Full size preview"
                            fill
                            className="object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
