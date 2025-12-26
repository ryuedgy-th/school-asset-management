import { prisma } from '@/lib/prisma';

// Configuration
const LOCKOUT_CONFIG = {
    maxAttempts: 5,
    lockoutDuration: 15, // minutes
    attemptWindow: 15, // minutes
};

/**
 * Check if an account is currently locked
 */
export async function checkAccountLock(email: string): Promise<{
    isLocked: boolean;
    remainingTime?: number;
    message?: string;
}> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { lockedUntil: true },
    });

    if (!user?.lockedUntil) {
        return { isLocked: false };
    }

    const now = new Date();
    if (now < user.lockedUntil) {
        const remainingMs = user.lockedUntil.getTime() - now.getTime();
        const remainingMin = Math.ceil(remainingMs / 60000);
        return {
            isLocked: true,
            remainingTime: remainingMin,
            message: `Account locked. Please try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
        };
    }

    // Lock expired, auto unlock
    await unlockAccount(email);
    return { isLocked: false };
}

/**
 * Increment failed login attempts
 */
export async function incrementFailedAttempts(email: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { failedLoginAttempts: true, lastLoginAttempt: true },
    });

    if (!user) {
        // User doesn't exist, but don't reveal this
        return 0;
    }

    // Check if last attempt was within the attempt window
    const now = new Date();
    const attemptWindowMs = LOCKOUT_CONFIG.attemptWindow * 60 * 1000;
    const shouldReset =
        user.lastLoginAttempt &&
        now.getTime() - user.lastLoginAttempt.getTime() > attemptWindowMs;

    const newAttempts = shouldReset ? 1 : (user.failedLoginAttempts || 0) + 1;

    await prisma.user.update({
        where: { email },
        data: {
            failedLoginAttempts: newAttempts,
            lastLoginAttempt: now,
        },
    });

    // Auto-lock if max attempts reached
    if (newAttempts >= LOCKOUT_CONFIG.maxAttempts) {
        await lockAccount(email, LOCKOUT_CONFIG.lockoutDuration);
    }

    return newAttempts;
}

/**
 * Lock an account for specified duration
 */
export async function lockAccount(
    email: string,
    durationMinutes: number
): Promise<void> {
    const lockUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    await prisma.user.update({
        where: { email },
        data: {
            lockedUntil: lockUntil,
        },
    });

    // Log the lockout
    const { logAudit } = await import('@/lib/logger');
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (user) {
        await logAudit('ACCOUNT_LOCKED', 'User', user.id, {
            reason: 'Too many failed login attempts',
            duration: `${durationMinutes} minutes`,
            lockUntil: lockUntil.toISOString(),
        });
    }
}

/**
 * Unlock an account (manual or automatic)
 */
export async function unlockAccount(email: string): Promise<void> {
    await prisma.user.update({
        where: { email },
        data: {
            lockedUntil: null,
            failedLoginAttempts: 0,
            lastLoginAttempt: null,
        },
    });
}

/**
 * Reset failed login attempts (after successful login)
 */
export async function resetFailedAttempts(email: string): Promise<void> {
    await prisma.user.update({
        where: { email },
        data: {
            failedLoginAttempts: 0,
            lastLoginAttempt: null,
        },
    });
}

/**
 * Get failed attempts count
 */
export async function getFailedAttempts(email: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { failedLoginAttempts: true },
    });

    return user?.failedLoginAttempts || 0;
}

/**
 * Get lockout status with details
 */
export async function getLockoutStatus(email: string): Promise<{
    isLocked: boolean;
    failedAttempts: number;
    lockedUntil: Date | null;
    remainingAttempts: number;
}> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            failedLoginAttempts: true,
            lockedUntil: true,
        },
    });

    const failedAttempts = user?.failedLoginAttempts || 0;
    const lockedUntil = user?.lockedUntil || null;
    const isLocked = lockedUntil ? new Date() < lockedUntil : false;
    const remainingAttempts = Math.max(
        0,
        LOCKOUT_CONFIG.maxAttempts - failedAttempts
    );

    return {
        isLocked,
        failedAttempts,
        lockedUntil,
        remainingAttempts,
    };
}
