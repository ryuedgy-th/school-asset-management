import { z } from 'zod';

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * User creation schema
 */
export const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    nickname: z.string().max(50, 'Nickname is too long').optional(),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['Admin', 'Technician', 'User'], {
        errorMap: () => ({ message: 'Invalid role' }),
    }),
    department: z.string().max(100, 'Department name is too long').optional(),
    phoneNumber: z.string().max(20, 'Phone number is too long').optional(),
});

/**
 * User update schema (password optional)
 */
export const updateUserSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    nickname: z.string().max(50, 'Nickname is too long').optional(),
    email: emailSchema,
    role: z.enum(['Admin', 'Technician', 'User']).optional(),
    department: z.string().max(100, 'Department name is too long').optional(),
    phoneNumber: z.string().max(20, 'Phone number is too long').optional(),
});

/**
 * Asset creation schema
 */
export const createAssetSchema = z.object({
    name: z.string().min(1, 'Asset name is required').max(200, 'Name is too long'),
    category: z.string().min(1, 'Category is required').max(100, 'Category is too long'),
    brand: z.string().max(100, 'Brand name is too long').optional(),
    model: z.string().max(100, 'Model is too long').optional(),
    serialNumber: z.string().max(100, 'Serial number is too long').optional(),
    location: z.string().max(200, 'Location is too long').optional(),
    cost: z.number().nonnegative('Cost must be positive').optional(),
    totalStock: z.number().int().positive('Stock must be positive').default(1),
});

/**
 * Login credentials schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Validate and sanitize file upload
 */
export const fileUploadSchema = z.object({
    filename: z.string().min(1, 'Filename is required'),
    mimetype: z.enum([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
    ], {
        errorMap: () => ({ message: 'Invalid file type. Only images and PDFs are allowed.' }),
    }),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
});
