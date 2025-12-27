import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/email/test
 * Send a test email with template preview
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Allow any authenticated user to send test emails
        // This is a testing feature, not a production email send


        // Parse request body
        const body = await request.json();
        const { to, subject, html } = body;

        // Validate input
        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Send test email
        const result = await sendEmail({
            to,
            subject: `[TEST] ${subject}`,
            html: `
                <div style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                        ⚠️ This is a test email
                    </p>
                    <p style="margin: 4px 0 0; color: #92400e; font-size: 12px;">
                        This email was sent from the Email Template Editor for testing purposes.
                    </p>
                </div>
                ${html}
            `,
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Test email sent successfully to ${to}`,
            });
        } else {
            return NextResponse.json(
                { error: result.error || 'Failed to send test email' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Error sending test email:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
