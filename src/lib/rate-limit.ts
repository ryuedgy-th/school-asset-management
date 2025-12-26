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
