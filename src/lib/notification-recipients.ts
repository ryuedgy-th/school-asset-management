import { prisma } from '@/lib/prisma';

/**
 * Get notification recipients for a specific category
 * Returns recipients grouped by type (to, cc, bcc, reply_to)
 */
export async function getNotificationRecipients(category: string, dynamicRecipients?: {
    inspector?: { email: string | null; name: string | null };
    user?: { email: string | null; name: string | null };
}) {
    // Fetch all active recipients for this category
    const recipients = await prisma.notificationRecipient.findMany({
        where: {
            category,
            isActive: true,
        },
        orderBy: [
            { recipientType: 'asc' },
            { role: 'asc' },
        ],
    });

    // Group recipients by type
    const grouped: {
        to: string[];
        cc: string[];
        bcc: string[];
        replyTo: string | null;
    } = {
        to: [],
        cc: [],
        bcc: [],
        replyTo: null,
    };

    for (const recipient of recipients) {
        let email: string | null = recipient.email;

        // Handle dynamic recipients
        if (!email) {
            if (recipient.role === 'inspector' && dynamicRecipients?.inspector?.email) {
                email = dynamicRecipients.inspector.email;
            } else if (recipient.role === 'user' && dynamicRecipients?.user?.email) {
                email = dynamicRecipients.user.email;
            }
        }

        // Skip if no email resolved
        if (!email) continue;

        // Add to appropriate group
        switch (recipient.recipientType) {
            case 'to':
                if (!grouped.to.includes(email)) {
                    grouped.to.push(email);
                }
                break;
            case 'cc':
                if (!grouped.cc.includes(email)) {
                    grouped.cc.push(email);
                }
                break;
            case 'bcc':
                if (!grouped.bcc.includes(email)) {
                    grouped.bcc.push(email);
                }
                break;
            case 'reply_to':
                // Only use first reply_to found
                if (!grouped.replyTo) {
                    grouped.replyTo = email;
                }
                break;
        }
    }

    return grouped;
}

/**
 * Get all notification categories
 */
export async function getNotificationCategories() {
    const recipients = await prisma.notificationRecipient.findMany({
        select: {
            category: true,
        },
        distinct: ['category'],
        orderBy: {
            category: 'asc',
        },
    });

    return recipients.map(r => r.category);
}
