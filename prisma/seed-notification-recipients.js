/**
 * Seed default notification recipients
 * Run with: node prisma/seed-notification-recipients.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding notification recipients...');

    // Default recipients for Inspection Reports
    const inspectionRecipients = [
        {
            category: 'inspection',
            recipientType: 'cc',
            role: 'inspector',
            email: null, // Dynamic - from inspection record
            name: 'Inspector (Auto)',
            isActive: true,
        },
        {
            category: 'inspection',
            recipientType: 'cc',
            role: 'director',
            email: process.env.DIRECTOR1_EMAIL || 'director1@school.com',
            name: 'Director 1',
            isActive: true,
        },
        {
            category: 'inspection',
            recipientType: 'cc',
            role: 'director',
            email: process.env.DIRECTOR2_EMAIL || 'director2@school.com',
            name: 'Director 2',
            isActive: true,
        },
        {
            category: 'inspection',
            recipientType: 'cc',
            role: 'it_head',
            email: process.env.IT_HEAD_EMAIL || 'it.head@school.com',
            name: 'IT Head',
            isActive: true,
        },
        {
            category: 'inspection',
            recipientType: 'reply_to',
            role: 'it_support',
            email: process.env.IT_SUPPORT_EMAIL || 'it-support@school.com',
            name: 'IT Support',
            isActive: true,
        },
    ];

    // Default recipients for Damage Approval
    const damageApprovalRecipients = [
        {
            category: 'damage_approval',
            recipientType: 'cc',
            role: 'director',
            email: process.env.DIRECTOR1_EMAIL || 'director1@school.com',
            name: 'Director 1',
            isActive: true,
        },
        {
            category: 'damage_approval',
            recipientType: 'cc',
            role: 'director',
            email: process.env.DIRECTOR2_EMAIL || 'director2@school.com',
            name: 'Director 2',
            isActive: true,
        },
        {
            category: 'damage_approval',
            recipientType: 'cc',
            role: 'it_head',
            email: process.env.IT_HEAD_EMAIL || 'it.head@school.com',
            name: 'IT Head',
            isActive: true,
        },
        {
            category: 'damage_approval',
            recipientType: 'reply_to',
            role: 'it_support',
            email: process.env.IT_SUPPORT_EMAIL || 'it-support@school.com',
            name: 'IT Support',
            isActive: true,
        },
    ];

    // Default recipients for Damage Waiver
    const damageWaiverRecipients = [
        {
            category: 'damage_waiver',
            recipientType: 'cc',
            role: 'director',
            email: process.env.DIRECTOR1_EMAIL || 'director1@school.com',
            name: 'Director 1',
            isActive: true,
        },
        {
            category: 'damage_waiver',
            recipientType: 'cc',
            role: 'director',
            email: process.env.DIRECTOR2_EMAIL || 'director2@school.com',
            name: 'Director 2',
            isActive: true,
        },
        {
            category: 'damage_waiver',
            recipientType: 'cc',
            role: 'it_head',
            email: process.env.IT_HEAD_EMAIL || 'it.head@school.com',
            name: 'IT Head',
            isActive: true,
        },
        {
            category: 'damage_waiver',
            recipientType: 'reply_to',
            role: 'it_support',
            email: process.env.IT_SUPPORT_EMAIL || 'it-support@school.com',
            name: 'IT Support',
            isActive: true,
        },
    ];

    // Combine all recipients
    const allRecipients = [
        ...inspectionRecipients,
        ...damageApprovalRecipients,
        ...damageWaiverRecipients,
    ];

    // Insert recipients
    for (const recipient of allRecipients) {
        // Check if already exists
        const existing = await prisma.notificationRecipient.findFirst({
            where: {
                category: recipient.category,
                recipientType: recipient.recipientType,
                role: recipient.role,
                email: recipient.email,
            },
        });

        if (!existing) {
            await prisma.notificationRecipient.create({
                data: recipient,
            });
            console.log(`✅ Created: ${recipient.category} - ${recipient.role} (${recipient.recipientType})`);
        } else {
            console.log(`⏭️  Skipped: ${recipient.category} - ${recipient.role} (already exists)`);
        }
    }

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding notification recipients:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
