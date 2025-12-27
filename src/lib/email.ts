import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { sendEmailViaGmailAPI } from '@/lib/gmail-oauth';
import { wrapEmailTemplate } from '@/lib/email-template-wrapper';

// Legacy transporter for backwards compatibility
// Use standard email environment variable names
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT || '587'),
    secure: (process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT) === '465',
    auth: {
        user: process.env.EMAIL_SERVER_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASS,
    },
});

/**
 * Get email transporter from database (default email account)
 * Supports both SMTP and Google OAuth
 */
async function getEmailTransporter() {
    const account = await prisma.emailAccount.findFirst({
        where: {
            isDefault: true,
            isActive: true,
        },
    });

    if (!account) {
        // Fallback to legacy transporter
        console.warn('⚠️ No default email account found. Using legacy transporter.');
        return { type: 'SMTP', transporter, from: process.env.EMAIL_FROM || '"School IT Asset" <it@school.edu>' };
    }

    if (account.type === 'GOOGLE_OAUTH') {
        return {
            type: 'GOOGLE_OAUTH',
            account,
            from: `"${account.name}" <${account.email}>`,
        };
    }

    // SMTP account
    if (!account.smtpHost || !account.smtpUser || !account.smtpPassword) {
        throw new Error('SMTP account is missing required configuration');
    }

    const smtpTransporter = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort || 587,
        secure: account.smtpSecure,
        auth: {
            user: account.smtpUser,
            pass: decrypt(account.smtpPassword),
        },
    });

    return {
        type: 'SMTP',
        transporter: smtpTransporter,
        from: `"${account.name}" <${account.email}>`,
    };
}

/**
 * Send email using default email account from database
 */
export async function sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
}) {
    try {
        const emailConfig = await getEmailTransporter();

        if (emailConfig.type === 'GOOGLE_OAUTH') {
            // Send via Gmail API
            if (!emailConfig.account) {
                throw new Error('Email account configuration is missing');
            }

            const recipients = Array.isArray(options.to) ? options.to : [options.to];

            // Note: Gmail API sendEmail needs to be updated to support CC/BCC
            // For now, we'll send to all recipients in TO field
            const allRecipients = [
                ...recipients,
                ...(options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : []),
            ];

            for (const recipient of allRecipients) {
                await sendEmailViaGmailAPI(
                    emailConfig.account.id,
                    recipient,
                    options.subject,
                    options.html
                );
            }

            console.log(`✅ Email sent via Gmail API to ${allRecipients.join(', ')}`);
            return { success: true };
        } else {
            // Send via SMTP
            if (!emailConfig.transporter) {
                throw new Error('Email transporter is not configured');
            }

            // Wrap HTML content in professional template
            const wrappedHtml = wrapEmailTemplate(options.subject, options.html);

            await emailConfig.transporter.sendMail({
                from: emailConfig.from,
                to: options.to,
                cc: options.cc,
                bcc: options.bcc,
                replyTo: options.replyTo,
                subject: options.subject,
                html: wrappedHtml,
            });

            const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
            const ccList = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : '';
            console.log(`✅ Email sent via SMTP to ${recipients}${ccList ? ` (CC: ${ccList})` : ''}`);
            return { success: true };
        }
    } catch (error: any) {
        console.error('❌ Failed to send email:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send templated email with automatic recipient resolution
 * Integrates Email Templates with Notification Recipients using category-based linking
 */
export async function sendTemplatedEmail(options: {
    category: string;
    variables: Record<string, string>;
    dynamicRecipients?: {
        inspector?: { email: string | null; name: string | null };
        user?: { email: string | null; name: string | null };
    };
    overrideRecipients?: {
        to?: string[];
        cc?: string[];
        bcc?: string[];
        replyTo?: string;
    };
    fallbackHtml?: string;
    fallbackSubject?: string;
}) {
    try {
        // 1. Fetch template by category
        const template = await prisma.emailTemplate.findFirst({
            where: {
                category: options.category,
                isActive: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // 2. Fetch recipients by category
        const { getNotificationRecipients } = await import('@/lib/notification-recipients');
        const recipients = await getNotificationRecipients(
            options.category,
            options.dynamicRecipients
        );

        // 3. Prepare email content
        let subject = template?.subject || options.fallbackSubject || 'Notification';
        let html = template?.body || options.fallbackHtml || '';

        // Replace variables in subject and body
        for (const [key, value] of Object.entries(options.variables)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            subject = subject.replace(regex, value);
            html = html.replace(regex, value);
        }

        // Wrap in premium template if not already HTML
        if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
            html = wrapInPremiumTemplate(html, subject);
        }

        // 4. Merge recipients (overrides take precedence)
        const finalRecipients = {
            to: options.overrideRecipients?.to || recipients.to,
            cc: options.overrideRecipients?.cc || recipients.cc,
            bcc: options.overrideRecipients?.bcc || recipients.bcc,
            replyTo: options.overrideRecipients?.replyTo || recipients.replyTo,
        };

        // 5. Send email
        return await sendEmail({
            to: finalRecipients.to.length > 0 ? finalRecipients.to : finalRecipients.cc,
            cc: finalRecipients.to.length > 0 ? finalRecipients.cc : undefined,
            bcc: finalRecipients.bcc.length > 0 ? finalRecipients.bcc : undefined,
            replyTo: finalRecipients.replyTo || undefined,
            subject,
            html,
        });
    } catch (error: any) {
        console.error('❌ Failed to send templated email:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Wrap plain text content in a premium HTML email template
 * For Magic Years International School - Premium branding
 */
function wrapInPremiumTemplate(content: string, subject: string): string {
    // Convert newlines to paragraphs
    const paragraphs = content.split('\n\n').map(p =>
        `<p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 24px;">${p.replace(/\n/g, '<br>')}</p>`
    ).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Magic Years International School</h1>
                                    <p style="margin: 12px 0 0; color: #e0e7ff; font-size: 15px; font-weight: 500;">Asset Management System</p>
                                </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    ${paragraphs}
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center; line-height: 20px;">
                                        <strong style="color: #374151;">Magic Years International School</strong><br>
                                        Excellence in Education Since 2010
                                    </p>
                                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 18px;">
                                        This is an automated message from the Asset Management System.<br>
                                        For assistance, please contact the IT Department.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}



export async function sendSignatureRequest(
    to: string,
    teacherName: string,
    signatureUrl: string
) {
    // Prepare variables for template
    const variables: Record<string, string> = {
        userName: teacherName,
        teacherName: teacherName,
        userEmail: to,
        signatureUrl: signatureUrl,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    // Fallback HTML
    const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Asset Assignment Signature Request</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="padding: 30px 40px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">School Asset Management</h1>
                                    <p style="margin: 10px 0 0; color: #bfdbfe; font-size: 14px;">Signature Request</p>
                                </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px; font-weight: 600;">Action Required</h2>
                                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
                                        Dear <span style="font-weight: 600; color: #111827;">${teacherName}</span>,
                                    </p>
                                    <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 24px;">
                                        You have been assigned new equipment or assets. As part of our school's asset policy, we require your digital signature to acknowledge the receipt and condition of these items.
                                    </p>

                                    <!-- Action Button -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center">
                                                <a href="${signatureUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
                                                    Review & Sign Assignment
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin: 32px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                                        This link is secure and valid for 7 days.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 18px;">
                                        This is an automated message from the School Asset Management System.<br>
                                        If you did not request this or believe it is an error, please contact the IT Department immediately.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    // Use sendTemplatedEmail with category 'assignment_signature'
    return await sendTemplatedEmail({
        category: 'assignment_signature',
        variables,
        dynamicRecipients: {
            user: {
                email: to,
                name: teacherName,
            },
        },
        overrideRecipients: {
            to: [to], // Always send to the teacher
        },
        fallbackHtml,
        fallbackSubject: 'Action Required: Sign Asset Assignment',
    });
}

/**
 * Send Inspection Report Email
 * Sends to: User (borrower), Directors, IT Head
 */
export async function sendInspectionReport(inspectionData: {
    id: number;
    asset: {
        name: string;
        assetCode: string;
        category: string;
    };
    assignment?: {
        assignmentNumber: string;
        user: {
            name: string | null;
            email: string | null;
        };
        borrowTransactions: Array<{
            borrowDate: Date;
        }>;
    } | null;
    inspector: {
        name: string | null;
        email?: string | null;
    };
    inspectionDate: Date;
    inspectionType: string;
    overallCondition: string;
    exteriorCondition?: string | null;
    screenCondition?: string | null;
    keyboardCondition?: string | null;
    batteryHealth?: string | null;
    damageFound: boolean;
    damageDescription?: string | null;
    estimatedCost?: number | null;
    photoUrls?: string | null;
    notes?: string | null;
}) {
    // Parse photo URLs
    const photos: string[] = inspectionData.photoUrls ? JSON.parse(inspectionData.photoUrls) : [];

    // Format condition labels
    const conditionLabels: Record<string, string> = {
        'excellent': '✅ Excellent',
        'good': '✅ Good',
        'fair': '⚠️ Fair',
        'poor': '⚠️ Poor',
        'broken': '❌ Broken',
        'no_damage': 'No Damage',
        'minor_wear': 'Minor Wear',
        'moderate_wear': 'Moderate Wear',
        'visible_dent': 'Visible Dent',
        'structural_damage': 'Structural Damage',
        'perfect': 'Perfect',
        'minor_scratches': 'Minor Scratches',
        'noticeable_scratches': 'Noticeable Scratches',
        'screen_blemish': 'Screen Blemish',
        'cracked': 'Cracked',
        'all_functional': 'All Functional',
        'sticky_button': 'Sticky Button',
        'loose_port': 'Loose Port',
        'non_functional': 'Non-Functional',
        'fully_functional': 'Fully Functional',
        'sticking_keys': 'Sticking Keys',
        'missing_keys': 'Missing Keys',
        'inconsistent': 'Inconsistent',
        'normal': 'Normal',
        'moderate': 'Moderate',
        'replace_soon': 'Replace Soon',
        'not_applicable': 'N/A'
    };

    const borrowDate = inspectionData.assignment?.borrowTransactions[0]?.borrowDate;

    // Prepare variables for template
    const variables: Record<string, string> = {
        userName: inspectionData.assignment?.user.name || 'User',
        assetName: inspectionData.asset.name,
        assetCode: inspectionData.asset.assetCode,
        assetCategory: inspectionData.asset.category,
        assignmentNumber: inspectionData.assignment?.assignmentNumber || 'N/A',
        inspectorName: inspectionData.inspector.name || 'Inspector',
        inspectionDate: new Date(inspectionData.inspectionDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        borrowDate: borrowDate ? new Date(borrowDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        }) : 'N/A',
        overallCondition: conditionLabels[inspectionData.overallCondition] || inspectionData.overallCondition,
        exteriorCondition: inspectionData.exteriorCondition ?
            (conditionLabels[inspectionData.exteriorCondition] || inspectionData.exteriorCondition) : 'N/A',
        screenCondition: inspectionData.screenCondition ?
            (conditionLabels[inspectionData.screenCondition] || inspectionData.screenCondition) : 'N/A',
        keyboardCondition: inspectionData.keyboardCondition ?
            (conditionLabels[inspectionData.keyboardCondition] || inspectionData.keyboardCondition) : 'N/A',
        batteryHealth: inspectionData.batteryHealth ?
            (conditionLabels[inspectionData.batteryHealth] || inspectionData.batteryHealth) : 'N/A',
        damageDescription: inspectionData.damageDescription || 'No damage details',
        estimatedCost: inspectionData.estimatedCost ?
            `${inspectionData.estimatedCost.toLocaleString()} THB` : 'N/A',
        notes: inspectionData.notes || 'No additional notes',
        photoCount: photos.length.toString(),
    };

    // Fallback HTML (current implementation)
    const fallbackHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Equipment Inspection Report</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
                <tr>
                    <td align="center" style="padding: 40px 20px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="padding: 30px 40px; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Equipment Inspection Report</h1>
                                    <p style="margin: 10px 0 0; color: #e9d5ff; font-size: 14px;">Periodic Maintenance Inspection</p>
                                </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    ${inspectionData.assignment ? `
                                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
                                        Dear <span style="font-weight: 600; color: #111827;">${inspectionData.assignment.user.name}</span>,
                                    </p>
                                    <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 24px;">
                                        This is the periodic inspection report for your assigned equipment.
                                    </p>
                                    ` : `
                                    <p style="margin: 0 0 32px; color: #374151; font-size: 16px; line-height: 24px;">
                                        Equipment inspection completed. Details below:
                                    </p>
                                    `}

                                    <!-- Equipment Details -->
                                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                        <tr style="background-color: #f9fafb;">
                                            <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb;">
                                                <strong style="color: #111827; font-size: 16px;">Equipment Information</strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; width: 40%; font-weight: 600; color: #374151;">Asset Name:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${inspectionData.asset.name}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; color: #374151;">Asset Code:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${inspectionData.asset.assetCode}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; color: #374151;">Category:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${inspectionData.asset.category}</td>
                                        </tr>
                                        ${inspectionData.assignment ? `
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; color: #374151;">Assignment:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${inspectionData.assignment.assignmentNumber}</td>
                                        </tr>
                                        ${borrowDate ? `
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; color: #374151;">Date Borrowed:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${new Date(borrowDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                        </tr>
                                        ` : ''}
                                        ` : ''}
                                    </table>

                                    <!-- Inspection Results -->
                                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                        <tr style="background-color: #f9fafb;">
                                            <td colspan="2" style="padding: 12px 16px; border: 1px solid #e5e7eb;">
                                                <strong style="color: #111827; font-size: 16px;">Inspection Results</strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; width: 40%; font-weight: 600; color: #374151;">Overall Condition:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827; font-weight: 600;">
                                                ${conditionLabels[inspectionData.overallCondition] || inspectionData.overallCondition}
                                            </td>
                                        </tr>
                                        ${inspectionData.exteriorCondition ? `
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; color: #374151;">Exterior:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${conditionLabels[inspectionData.exteriorCondition] || inspectionData.exteriorCondition}</td>
                                        </tr>
                                        ` : ''}
                                        ${inspectionData.screenCondition ? `
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; color: #374151;">Screen:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${conditionLabels[inspectionData.screenCondition] || inspectionData.screenCondition}</td>
                                        </tr>
                                        ` : ''}
                                        ${inspectionData.keyboardCondition ? `
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; color: #374151;">Keyboard:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${conditionLabels[inspectionData.keyboardCondition] || inspectionData.keyboardCondition}</td>
                                        </tr>
                                        ` : ''}
                                        ${inspectionData.batteryHealth ? `
                                        <tr>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; color: #374151;">Battery Health:</td>
                                            <td style="padding: 12px 16px; border: 1px solid #e5e7eb; color: #111827;">${conditionLabels[inspectionData.batteryHealth] || inspectionData.batteryHealth}</td>
                                        </tr>
                                        ` : ''}
                                    </table>

                                    ${inspectionData.damageFound ? `
                                    <!-- Damage Alert -->
                                    <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; margin-bottom: 24px;">
                                        <h3 style="margin: 0 0 12px; color: #991b1b; font-size: 18px; font-weight: 600;">⚠️ Damage Found</h3>
                                        <p style="margin: 0 0 12px; color: #7f1d1d; font-size: 15px; line-height: 22px;">
                                            ${inspectionData.damageDescription || 'Damage details not specified'}
                                        </p>
                                        ${inspectionData.estimatedCost ? `
                                        <p style="margin: 0; color: #7f1d1d; font-size: 15px; font-weight: 600;">
                                            Estimated Repair Cost: ${inspectionData.estimatedCost.toLocaleString()} THB
                                        </p>
                                        ` : ''}
                                        ${inspectionData.assignment ? `
                                        <p style="margin: 16px 0 0; color: #7f1d1d; font-size: 14px;">
                                            A Damage Acknowledgement Form will be sent separately for your review and signature.
                                        </p>
                                        ` : ''}
                                    </div>
                                    ` : `
                                    <!-- No Damage -->
                                    <div style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; margin-bottom: 24px;">
                                        <p style="margin: 0; color: #166534; font-size: 15px; font-weight: 600;">
                                            ✅ No damage found. Equipment is in good condition.
                                        </p>
                                    </div>
                                    `}

                                    ${photos.length > 0 ? `
                                    <!-- Photos -->
                                    <div style="margin-bottom: 24px;">
                                        <h3 style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">Inspection Photos:</h3>
                                        <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
                                            ${photos.length} photo(s) attached to this inspection.
                                        </p>
                                        <p style="margin: 0; color: #6b7280; font-size: 13px; font-style: italic;">
                                            Photos can be viewed in the asset management system.
                                        </p>
                                    </div>
                                    ` : ''}

                                    ${inspectionData.notes ? `
                                    <!-- Additional Notes -->
                                    <div style="padding: 16px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                                        <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">Additional Notes:</h3>
                                        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 20px;">
                                            ${inspectionData.notes}
                                        </p>
                                    </div>
                                    ` : ''}

                                    <!-- Inspector Info -->
                                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                            <strong>Inspected by:</strong> ${inspectionData.inspector.name}<br>
                                            <strong>Inspection Date:</strong> ${new Date(inspectionData.inspectionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 18px;">
                                        This is an automated inspection report from the School Asset Management System.<br>
                                        For questions or concerns, please contact the IT Department.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    // Use sendTemplatedEmail with fallback
    return await sendTemplatedEmail({
        category: 'inspection',
        variables,
        dynamicRecipients: {
            inspector: {
                email: inspectionData.inspector.email || null,
                name: inspectionData.inspector.name,
            },
            user: {
                email: inspectionData.assignment?.user.email || null,
                name: inspectionData.assignment?.user.name || null,
            },
        },
        fallbackHtml,
        fallbackSubject: `Equipment Inspection Report - ${inspectionData.asset.name} (${inspectionData.asset.assetCode})`,
    });
}
