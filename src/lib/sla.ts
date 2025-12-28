/**
 * SLA (Service Level Agreement) Management
 *
 * Calculates SLA deadlines based on ticket priority and tracks status.
 * SLA values are now configurable via database settings.
 */

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type SLAStatus = 'within_sla' | 'at_risk' | 'breached' | null;

/**
 * Default SLA Resolution Times (in hours)
 * Used as fallback if database settings are not available
 */
const DEFAULT_SLA_HOURS: Record<Priority, number> = {
    urgent: 2,   // 2 hours
    high: 8,     // 8 hours
    medium: 24,  // 24 hours (1 day)
    low: 72,     // 72 hours (3 days)
};

const DEFAULT_AT_RISK_THRESHOLD = 20; // 20%

/**
 * In-memory cache for SLA settings
 */
let slaCache: {
    hours: Record<Priority, number>;
    atRiskThreshold: number;
    lastFetch: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch SLA settings from database
 * Uses in-memory cache to reduce database queries
 */
async function getSLASettings(): Promise<{
    hours: Record<Priority, number>;
    atRiskThreshold: number;
}> {
    // Check cache
    if (slaCache && Date.now() - slaCache.lastFetch < CACHE_TTL) {
        return {
            hours: slaCache.hours,
            atRiskThreshold: slaCache.atRiskThreshold,
        };
    }

    try {
        // Import prisma dynamically to avoid issues on client-side
        const { prisma } = await import('@/lib/prisma');

        const settings = await prisma.systemSettings.findMany({
            where: { category: 'sla' },
        });

        const hours: Record<Priority, number> = { ...DEFAULT_SLA_HOURS };
        let atRiskThreshold = DEFAULT_AT_RISK_THRESHOLD;

        settings.forEach((setting) => {
            const value = parseInt(setting.value || '0');
            switch (setting.key) {
                case 'sla_urgent_hours':
                    hours.urgent = value;
                    break;
                case 'sla_high_hours':
                    hours.high = value;
                    break;
                case 'sla_medium_hours':
                    hours.medium = value;
                    break;
                case 'sla_low_hours':
                    hours.low = value;
                    break;
                case 'sla_at_risk_threshold':
                    atRiskThreshold = value;
                    break;
            }
        });

        // Update cache
        slaCache = {
            hours,
            atRiskThreshold,
            lastFetch: Date.now(),
        };

        return { hours, atRiskThreshold };
    } catch (error) {
        console.error('Error fetching SLA settings from database, using defaults:', error);
        // Return defaults on error
        return {
            hours: DEFAULT_SLA_HOURS,
            atRiskThreshold: DEFAULT_AT_RISK_THRESHOLD,
        };
    }
}

/**
 * Clear SLA cache
 * Call this after updating SLA settings
 */
export function clearSLACache(): void {
    slaCache = null;
}

/**
 * Calculate SLA deadline based on priority and creation time
 *
 * @param priority - Ticket priority
 * @param createdAt - Ticket creation timestamp
 * @returns Promise<Date> - SLA deadline date
 */
export async function calculateSLADeadline(
    priority: string,
    createdAt: Date = new Date()
): Promise<Date> {
    const priorityKey = priority.toLowerCase() as Priority;
    const { hours } = await getSLASettings();
    const slaHours = hours[priorityKey] || hours.medium;

    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + slaHours);

    return deadline;
}

/**
 * Check SLA status based on deadline
 *
 * @param deadline - SLA deadline
 * @param currentTime - Current timestamp (defaults to now)
 * @param createdAt - Ticket creation time (optional, for calculating total SLA time)
 * @returns Promise<SLAStatus> - SLA status
 */
export async function checkSLAStatus(
    deadline: Date | null,
    currentTime: Date = new Date(),
    createdAt?: Date
): Promise<SLAStatus> {
    if (!deadline) return null;

    const now = currentTime.getTime();
    const deadlineTime = new Date(deadline).getTime();
    const timeRemaining = deadlineTime - now;

    // Already breached
    if (timeRemaining <= 0) {
        return 'breached';
    }

    // Get threshold from settings
    const { atRiskThreshold } = await getSLASettings();
    const thresholdPercent = atRiskThreshold / 100;

    // Calculate total SLA time if createdAt is provided
    const totalTime = createdAt
        ? deadlineTime - new Date(createdAt).getTime()
        : timeRemaining;

    const thresholdTime = totalTime * thresholdPercent;

    // At risk if remaining time is less than threshold
    if (timeRemaining <= thresholdTime) {
        return 'at_risk';
    }

    return 'within_sla';
}

/**
 * Get time remaining until SLA deadline
 * 
 * @param deadline - SLA deadline
 * @param currentTime - Current timestamp (defaults to now)
 * @returns Object with time remaining in various units
 */
export function getTimeRemaining(
    deadline: Date | null,
    currentTime: Date = new Date()
): {
    total: number;
    hours: number;
    minutes: number;
    isOverdue: boolean;
} {
    if (!deadline) {
        return { total: 0, hours: 0, minutes: 0, isOverdue: false };
    }

    const now = currentTime.getTime();
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;

    if (diff <= 0) {
        return {
            total: Math.abs(diff),
            hours: Math.abs(Math.floor(diff / (1000 * 60 * 60))),
            minutes: Math.abs(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))),
            isOverdue: true,
        };
    }

    return {
        total: diff,
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        isOverdue: false,
    };
}

/**
 * Format time remaining for display
 * 
 * @param deadline - SLA deadline
 * @returns Human-readable time remaining string
 */
export function formatTimeRemaining(deadline: Date | null): string {
    const { hours, minutes, isOverdue } = getTimeRemaining(deadline);

    if (!deadline) return 'No SLA';

    if (isOverdue) {
        if (hours > 0) {
            return `Overdue by ${hours}h ${minutes}m`;
        }
        return `Overdue by ${minutes}m`;
    }

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h remaining`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    }

    return `${minutes}m remaining`;
}

/**
 * Get SLA status badge color for UI
 * 
 * @param status - SLA status
 * @returns Tailwind color class
 */
export function getSLABadgeColor(status: SLAStatus): string {
    switch (status) {
        case 'within_sla':
            return 'bg-green-100 text-green-800';
        case 'at_risk':
            return 'bg-yellow-100 text-yellow-800';
        case 'breached':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

/**
 * Get SLA status display text
 * 
 * @param status - SLA status
 * @returns Human-readable status text
 */
export function getSLAStatusText(status: SLAStatus): string {
    switch (status) {
        case 'within_sla':
            return 'On Track';
        case 'at_risk':
            return 'At Risk';
        case 'breached':
            return 'SLA Breached';
        default:
            return 'No SLA';
    }
}
