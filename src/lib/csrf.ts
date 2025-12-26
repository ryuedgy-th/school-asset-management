import { randomBytes, createHash } from 'crypto';

/**
 * Generate a CSRF token
 * @returns A secure random token
 */
export function generateCSRFToken(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 * @param token - Token from request
 * @param sessionToken - Token from session
 * @returns True if tokens match
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false;

    // Use timing-safe comparison to prevent timing attacks
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const sessionHash = createHash('sha256').update(sessionToken).digest('hex');

    return tokenHash === sessionHash;
}

/**
 * Generate a hash of a token (for storage)
 * @param token - Token to hash
 * @returns Hashed token
 */
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
