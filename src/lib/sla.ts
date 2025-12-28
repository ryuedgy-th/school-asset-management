/**
 * SLA (Service Level Agreement) Management
 * 
 * Calculates SLA deadlines based on ticket priority and tracks status
 */

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type SLAStatus = 'within_sla' | 'at_risk' | 'breached' | null;

/**
 * SLA Resolution Times (in hours)
 */
const SLA_HOURS: Record<Priority, number> = {
    urgent: 2,   // 2 hours
    high: 8,     // 8 hours
    medium: 24,  // 24 hours (1 day)
    low: 72,     // 72 hours (3 days)
};

/**
 * Calculate SLA deadline based on priority and creation time
 * 
 * @param priority - Ticket priority
 * @param createdAt - Ticket creation timestamp
 * @returns SLA deadline date
 */
export function calculateSLADeadline(
    priority: string,
    createdAt: Date = new Date()
): Date {
    const priorityKey = priority.toLowerCase() as Priority;
    const hours = SLA_HOURS[priorityKey] || SLA_HOURS.medium;

    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + hours);

    return deadline;
}

/**
 * Check SLA status based on deadline
 * 
 * @param deadline - SLA deadline
 * @param currentTime - Current timestamp (defaults to now)
 * @returns SLA status
 */
export function checkSLAStatus(
    deadline: Date | null,
    currentTime: Date = new Date()
): SLAStatus {
    if (!deadline) return null;

    const now = currentTime.getTime();
    const deadlineTime = new Date(deadline).getTime();
    const timeRemaining = deadlineTime - now;

    // Already breached
    if (timeRemaining <= 0) {
        return 'breached';
    }

    // Calculate total SLA time to determine thresholds
    // We use 20% as threshold for "at risk"
    const totalTime = deadlineTime - now;
    const twentyPercent = totalTime * 0.2;

    // At risk if less than 20% time remaining
    if (timeRemaining <= twentyPercent) {
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
