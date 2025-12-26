/**
 * Image Optimization Utility
 * 
 * Optimizes images before upload to prevent database bloat:
 * - Resizes large images to max dimensions
 * - Compresses to reduce file size
 * - Converts to WebP format for better compression
 * - Returns optimized base64 data URL
 */

export interface ImageOptimizationOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1, default 0.8
    format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'webp'
};

/**
 * Optimizes an image file
 * @param file - The image file to optimize
 * @param options - Optimization options
 * @returns Promise<string> - Optimized image as base64 data URL
 */
export async function optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                try {
                    // Calculate new dimensions while maintaining aspect ratio
                    let { width, height } = img;
                    const aspectRatio = width / height;

                    if (width > opts.maxWidth) {
                        width = opts.maxWidth;
                        height = width / aspectRatio;
                    }

                    if (height > opts.maxHeight) {
                        height = opts.maxHeight;
                        width = height * aspectRatio;
                    }

                    // Create canvas and draw resized image
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(width);
                    canvas.height = Math.round(height);

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    // Use better image smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw image
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Convert to optimized format
                    const mimeType = `image/${opts.format}`;
                    const optimizedDataUrl = canvas.toDataURL(mimeType, opts.quality);

                    resolve(optimizedDataUrl);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Optimizes multiple images in parallel
 * @param files - Array of image files to optimize
 * @param options - Optimization options
 * @returns Promise<string[]> - Array of optimized images as base64 data URLs
 */
export async function optimizeImages(
    files: File[],
    options: ImageOptimizationOptions = {}
): Promise<string[]> {
    return Promise.all(files.map(file => optimizeImage(file, options)));
}

/**
 * Gets the size reduction percentage
 * @param originalFile - Original file
 * @param optimizedDataUrl - Optimized data URL
 * @returns number - Percentage reduction (0-100)
 */
export function getSizeReduction(originalFile: File, optimizedDataUrl: string): number {
    const originalSize = originalFile.size;
    // Base64 is ~33% larger than binary, so we estimate the actual size
    const base64Size = optimizedDataUrl.length * 0.75;
    const reduction = ((originalSize - base64Size) / originalSize) * 100;
    return Math.max(0, Math.round(reduction));
}

/**
 * Formats file size for display
 * @param bytes - Size in bytes
 * @returns string - Formatted size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
