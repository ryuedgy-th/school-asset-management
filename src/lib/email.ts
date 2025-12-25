import nodemailer from 'nodemailer';

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

export async function sendSignatureRequest(
    to: string,
    teacherName: string,
    signatureUrl: string
) {
    const emailUser = process.env.EMAIL_SERVER_USER || process.env.SMTP_USER;

    if (!emailUser) {
        console.warn("⚠️ Email not configured. Skipping email send.");
        console.log(`📧 [EMAIL SIMULATION] To: ${to}`);
        console.log(`🔗 Signature Link: ${signatureUrl}`);
        return {
            success: false,
            error: 'Email not configured. Please set EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD in .env file.'
        };
    }

    const html = `
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

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"School IT Asset" <it@school.edu>',
            to,
            subject: `Action Required: Sign Asset Assignment`,
            html,
        });
        console.log(`✅ Email sent successfully to ${to}`);
        return { success: true };
    } catch (error: any) {
        console.error("❌ Failed to send email:", error.message);
        return { success: false, error: error.message };
    }
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
    const emailUser = process.env.EMAIL_SERVER_USER || process.env.SMTP_USER;

    if (!emailUser) {
        console.warn("⚠️ Email not configured. Skipping inspection report email.");
        return {
            success: false,
            error: 'Email not configured'
        };
    }

    // Parse photo URLs
    const photos: string[] = inspectionData.photoUrls ? JSON.parse(inspectionData.photoUrls) : [];

    // Get recipients
    const recipients: string[] = [];

    // Add borrower email
    if (inspectionData.assignment?.user.email) {
        recipients.push(inspectionData.assignment.user.email);
    }

    // Add directors and IT head from environment variables
    const director1 = process.env.DIRECTOR1_EMAIL;
    const director2 = process.env.DIRECTOR2_EMAIL;
    const itHead = process.env.IT_HEAD_EMAIL;

    if (director1) recipients.push(director1);
    if (director2) recipients.push(director2);
    if (itHead) recipients.push(itHead);

    if (recipients.length === 0) {
        console.warn("⚠️ No recipients configured for inspection report");
        return { success: false, error: 'No recipients configured' };
    }

    // Format condition labels
    const conditionLabels: Record<string, string> = {
        'excellent': '✅ Excellent',
        'good': '✅ Good',
        'fair': '⚠️ Fair',
        'poor': '⚠️ Poor',
        'broken': '❌ Broken',
        // Detailed conditions
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

    const html = `
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

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"School IT Asset" <it@school.edu>',
            to: recipients.join(', '),
            subject: `Equipment Inspection Report - ${inspectionData.asset.name} (${inspectionData.asset.assetCode})`,
            html,
        });
        console.log(`✅ Inspection report sent to: ${recipients.join(', ')}`);
        return { success: true };
    } catch (error: any) {
        console.error("❌ Failed to send inspection report:", error.message);
        return { success: false, error: error.message };
    }
}
