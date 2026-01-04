/**
 * Validation helpers for API routes
 */

import { NextResponse } from 'next/server';

/**
 * Safely parse integer from string with validation
 * @param value - String value to parse
 * @param fieldName - Name of the field (for error messages)
 * @returns Parsed integer or NextResponse with error
 */
export function parseIntSafe(
    value: string | undefined,
    fieldName: string = 'ID'
): number | NextResponse {
    if (!value) {
        return NextResponse.json(
            { error: `${fieldName} is required` },
            { status: 400 }
        );
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
        return NextResponse.json(
            { error: `Invalid ${fieldName}. Must be a number.` },
            { status: 400 }
        );
    }

    if (parsed < 0) {
        return NextResponse.json(
            { error: `Invalid ${fieldName}. Must be a positive number.` },
            { status: 400 }
        );
    }

    return parsed;
}

/**
 * Type guard to check if value is NextResponse (error response)
 */
export function isErrorResponse(value: any): value is NextResponse {
    return value instanceof NextResponse;
}

/**
 * Validate and parse multiple integer parameters
 * @param params - Object with string values
 * @param fields - Field names to validate
 * @returns Parsed values or error response
 */
export function parseMultipleInts(
    params: Record<string, string | undefined>,
    fields: string[]
): Record<string, number> | NextResponse {
    const result: Record<string, number> = {};

    for (const field of fields) {
        const parsed = parseIntSafe(params[field], field);
        if (isErrorResponse(parsed)) {
            return parsed;
        }
        result[field] = parsed;
    }

    return result;
}

/**
 * Password complexity validation
 */
export const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false, // Optional for now
} as const;

export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate password complexity
 * @param password - Password to validate
 * @returns Validation result with errors
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }

    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sanitize string input (remove potential XSS)
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
