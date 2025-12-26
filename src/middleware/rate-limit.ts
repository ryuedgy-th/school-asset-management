import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Rate limit middleware for API routes
 * Usage: export const GET = withRateLimit(handler, { limit: 10 });
 */
export function withRateLimit(
    handler: (req: NextRequest) => Promise<NextResponse>,
    options: { limit?: number; identifier?: (req: NextRequest) => string } = {}
) {
    return async (req: NextRequest) => {
        const limit = options.limit || 10;

        // Get identifier (IP address or custom)
        const identifier = options.identifier
            ? options.identifier(req)
            : req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit
        const { allowed, remaining } = checkRateLimit(identifier, limit);

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'Retry-After': '60',
                    }
                }
            );
        }

        // Add rate limit headers to response
        const response = await handler(req);
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());

        return response;
    };
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: NextRequest): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
}
