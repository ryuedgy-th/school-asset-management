import { LRUCache } from 'lru-cache';

// Rate limit configuration
interface RateLimitConfig {
    interval: number; // Time window in milliseconds
    uniqueTokenPerInterval: number; // Max number of unique tokens
}

// Default: 10 requests per minute
const defaultConfig: RateLimitConfig = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
};

// Create LRU cache for rate limiting
const tokenCache = new LRUCache({
    max: defaultConfig.uniqueTokenPerInterval,
    ttl: defaultConfig.interval,
});

/**
 * Rate limit presets for different use cases
 */
export const RATE_LIMITS = {
    // Login attempts: 5 per 15 minutes
    LOGIN: { limit: 5, interval: 15 * 60 * 1000 },
    // API requests: 100 per minute
    API: { limit: 100, interval: 60 * 1000 },
    // File uploads: 10 per minute
    UPLOAD: { limit: 10, interval: 60 * 1000 },
    // Email sending: 5 per hour
    EMAIL: { limit: 5, interval: 60 * 60 * 1000 },
    // Password reset: 3 per hour
    PASSWORD_RESET: { limit: 3, interval: 60 * 60 * 1000 },
} as const;

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum number of requests allowed
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    limit: number = 10
): { allowed: boolean; remaining: number } {
    const tokenCount = (tokenCache.get(identifier) as number) || 0;

    if (tokenCount >= limit) {
        return { allowed: false, remaining: 0 };
    }

    tokenCache.set(identifier, tokenCount + 1);
    return { allowed: true, remaining: limit - tokenCount - 1 };
}

/**
 * Reset rate limit for an identifier
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
    tokenCache.delete(identifier);
}

/**
 * Get current rate limit status
 * @param identifier - Unique identifier
 * @param limit - Maximum number of requests allowed
 * @returns Current count and remaining requests
 */
export function getRateLimitStatus(
    identifier: string,
    limit: number = 10
): { count: number; remaining: number } {
    const count = (tokenCache.get(identifier) as number) || 0;
    return { count, remaining: Math.max(0, limit - count) };
}

/**
 * Get client IP from request headers
 * @param request - Next.js Request object
 * @returns Client IP address
 */
export function getClientIP(request: Request): string {
    // Check for forwarded IP (behind proxy/load balancer)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // Check for real IP
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP.trim();
    }

    // Fallback
    return 'unknown';
}

/**
 * Helper to apply rate limit in API routes
 * @param request - Request object
 * @param identifier - Optional custom identifier (default: IP address)
 * @param limit - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export function applyRateLimit(
    request: Request,
    identifier?: string,
    limit: { limit: number; interval: number } = RATE_LIMITS.API
): Response | null {
    const id = identifier || getClientIP(request);
    const result = checkRateLimit(id, limit.limit);

    if (!result.allowed) {
        return new Response(
            JSON.stringify({
                error: 'Too many requests',
                message: 'You have exceeded the rate limit. Please try again later.',
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': limit.limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'Retry-After': Math.ceil(limit.interval / 1000).toString(),
                },
            }
        );
    }

    return null;
}
