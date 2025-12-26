import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding default email templates...');

    // Check if default account exists, if not create one
    let defaultAccount = await prisma.emailAccount.findFirst({
        where: { isDefault: true }
    });

    if (!defaultAccount) {
        console.log('📧 No default email account found. Creating placeholder...');
        defaultAccount = await prisma.emailAccount.create({
            data: {
                name: 'Default Account',
                email: process.env.EMAIL_FROM || 'it@school.edu',
                type: 'SMTP',
                isDefault: true,
                isActive: false, // Inactive until configured
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpSecure: false,
            }
        });
        console.log('✅ Created placeholder email account');
    }

    // Template 1: Signature Request (Borrowing)
    const signatureTemplate = await prisma.emailTemplate.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Asset Assignment Signature Request',
            subject: 'Action Required: Sign Asset Assignment',
            category: 'borrowing',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{teacherName}', '{signatureUrl}', '{date}']),
            body: `Dear {teacherName},

You have been assigned new equipment or assets. As part of our school's asset policy, we require your digital signature to acknowledge the receipt and condition of these items.

Please click the link below to review and sign your assignment:

{signatureUrl}

This link is secure and valid for 7 days.

---
This is an automated message from the School Asset Management System.
If you did not request this or believe it is an error, please contact the IT Department immediately.`,
        }
    });

    // Template 2: Inspection Report
    const inspectionTemplate = await prisma.emailTemplate.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Equipment Inspection Report',
            subject: 'Equipment Inspection Report - {assetName} ({assetCode})',
            category: 'inspection',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify([
                '{userName}', '{assetName}', '{assetCode}', '{assetCategory}',
                '{assignmentNumber}', '{borrowDate}', '{overallCondition}',
                '{exteriorCondition}', '{screenCondition}', '{keyboardCondition}',
                '{batteryHealth}', '{damageFound}', '{damageDescription}',
                '{estimatedCost}', '{inspectorName}', '{inspectionDate}', '{notes}'
            ]),
            body: `Dear {userName},

This is the periodic inspection report for your assigned equipment.

EQUIPMENT INFORMATION:
- Asset Name: {assetName}
- Asset Code: {assetCode}
- Category: {assetCategory}
- Assignment: {assignmentNumber}
- Date Borrowed: {borrowDate}

INSPECTION RESULTS:
- Overall Condition: {overallCondition}
- Exterior: {exteriorCondition}
- Screen: {screenCondition}
- Keyboard: {keyboardCondition}
- Battery Health: {batteryHealth}

{damageFound}

{notes}

Inspected by: {inspectorName}
Inspection Date: {inspectionDate}

---
This is an automated inspection report from the School Asset Management System.
For questions or concerns, please contact the IT Department.`,
        }
    });

    // Template 3: Damage Approval
    const damageApprovalTemplate = await prisma.emailTemplate.upsert({
        where: { id: 3 },
        update: {},
        create: {
            name: 'Damage Claim Approved',
            subject: 'Damage Claim Approved - {assetName} ({assetCode})',
            category: 'inspection',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify([
                '{userName}', '{assetName}', '{assetCode}',
                '{damageDescription}', '{estimatedCost}',
                '{approverName}', '{approvalNotes}'
            ]),
            body: `Dear {userName},

Your equipment damage claim has been APPROVED by {approverName}.

EQUIPMENT INFORMATION:
- Equipment: {assetName}
- Asset Code: {assetCode}
- Damage: {damageDescription}
- Repair Cost: ฿{estimatedCost}

{approvalNotes}

NEXT STEPS:
You will receive a Damage Acknowledgement Form shortly. Please review, sign, and return it to the IT Department.

If you have any questions, please contact the IT Department.

---
This is an automated message from the School Asset Management System.`,
        }
    });

    // Template 4: Damage Waiver
    const damageWaiverTemplate = await prisma.emailTemplate.upsert({
        where: { id: 4 },
        update: {},
        create: {
            name: 'Damage Charges Waived',
            subject: 'Damage Charges Waived - {assetName} ({assetCode})',
            category: 'inspection',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify([
                '{userName}', '{assetName}', '{assetCode}',
                '{damageDescription}', '{estimatedCost}',
                '{approverName}', '{waiverReason}'
            ]),
            body: `Dear {userName},

Good news! The damage charges for your equipment have been WAIVED by {approverName}.

EQUIPMENT INFORMATION:
- Equipment: {assetName}
- Asset Code: {assetCode}
- Damage: {damageDescription}
- Original Cost: ฿{estimatedCost} (WAIVED)

REASON FOR WAIVER:
{waiverReason}

✅ No further action is required from you. The damage has been documented and the charges have been waived.

If you have any questions, please contact the IT Department.

---
This is an automated message from the School Asset Management System.`,
        }
    });

    console.log('✅ Created/updated 4 default email templates:');
    console.log(`   1. ${signatureTemplate.name}`);
    console.log(`   2. ${inspectionTemplate.name}`);
    console.log(`   3. ${damageApprovalTemplate.name}`);
    console.log(`   4. ${damageWaiverTemplate.name}`);
    console.log('');
    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding templates:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
