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
