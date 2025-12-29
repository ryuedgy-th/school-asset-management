import nodemailer from 'nodemailer';
import { getNotificationRecipients } from '@/lib/notification-recipients';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

/**
 * Send Damage Approval Notification
 */
export async function sendDamageApprovalEmail(data: {
    inspection: {
        id: number;
        asset: {
            name: string;
            assetCode: string;
        };
        estimatedCost: number | null;
        damageDescription: string | null;
    };
    user: {
        name: string;
        email: string;
    };
    approver: {
        name: string;
    };
    approvalNotes?: string | null;
}) {
    // Get recipients from database
    const dbRecipients = await getNotificationRecipients('damage_approval');
    const recipients = [
        data.user.email,
        ...dbRecipients.to,
        ...dbRecipients.cc
    ].filter(Boolean);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Damage Claim Approved</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 14px;">Equipment Damage Approval Notification</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>${data.user.name}</strong>,
            </p>

            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your equipment damage claim has been <strong style="color: #10b981;">approved</strong> by ${data.approver.name}.
            </p>

            <!-- Equipment Info -->
            <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">Equipment Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Equipment:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${data.inspection.asset.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Asset Code:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${data.inspection.asset.assetCode}</td>
                    </tr>
                    ${data.inspection.damageDescription ? `
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Damage:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.inspection.damageDescription}</td>
                    </tr>
                    ` : ''}
                    ${data.inspection.estimatedCost ? `
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Repair Cost:</td>
                        <td style="padding: 8px 0; color: #dc2626; font-size: 16px; font-weight: 700;">฿${data.inspection.estimatedCost.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            ${data.approvalNotes ? `
            <div style="background-color: #eff6ff; border-left: 4px solid: #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 14px;">Approval Notes:</h4>
                <p style="color: #1f2937; margin: 0; font-size: 14px; line-height: 1.5;">${data.approvalNotes}</p>
            </div>
            ` : ''}

            <!-- Next Steps -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px;">📋 Next Steps:</h4>
                <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
                    You will receive a <strong>Damage Acknowledgement Form</strong> shortly. Please review, sign, and return it to the IT Department.
                </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you have any questions, please contact the IT Department.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated message from the School Asset Management System.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: recipients.join(', '),
            subject: `Damage Claim Approved - ${data.inspection.asset.name} (${data.inspection.asset.assetCode})`,
            html,
        });

        return { success: true };
    } catch (error: any) {
        console.error("❌ Failed to send damage approval email:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send Damage Waiver Notification
 */
export async function sendDamageWaiverEmail(data: {
    inspection: {
        id: number;
        asset: {
            name: string;
            assetCode: string;
        };
        estimatedCost: number | null;
        damageDescription: string | null;
    };
    user: {
        name: string;
        email: string;
    };
    approver: {
        name: string;
    };
    waiverReason: string;
}) {
    // Get recipients from database
    const dbRecipients = await getNotificationRecipients('damage_waiver');
    const recipients = [
        data.user.email,
        ...dbRecipients.to,
        ...dbRecipients.cc
    ].filter(Boolean);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔄 Damage Charges Waived</h1>
            <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 14px;">Equipment Damage Waiver Notification</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>${data.user.name}</strong>,
            </p>

            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Good news! The damage charges for your equipment have been <strong style="color: #f59e0b;">waived</strong> by ${data.approver.name}.
            </p>

            <!-- Equipment Info -->
            <div style="background-color: #f9fafb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">Equipment Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Equipment:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${data.inspection.asset.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Asset Code:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${data.inspection.asset.assetCode}</td>
                    </tr>
                    ${data.inspection.damageDescription ? `
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Damage:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${data.inspection.damageDescription}</td>
                    </tr>
                    ` : ''}
                    ${data.inspection.estimatedCost ? `
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Original Cost:</td>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; text-decoration: line-through;">฿${data.inspection.estimatedCost.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            <!-- Waiver Reason -->
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h4 style="color: #1e40af; margin: 0 0 8px 0; font-size: 14px;">Reason for Waiver:</h4>
                <p style="color: #1f2937; margin: 0; font-size: 14px; line-height: 1.5;">${data.waiverReason}</p>
            </div>

            <!-- Success Message -->
            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #065f46; margin: 0; font-size: 14px; line-height: 1.6;">
                    ✅ <strong>No further action is required from you.</strong> The damage has been documented and the charges have been waived.
                </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you have any questions, please contact the IT Department.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated message from the School Asset Management System.
            </p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: recipients.join(', '),
            subject: `Damage Charges Waived - ${data.inspection.asset.name} (${data.inspection.asset.assetCode})`,
            html,
        });
        return { success: true };
    } catch (error: any) {
        console.error("❌ Failed to send damage waiver email:", error.message);
        return { success: false, error: error.message };
    }
}
