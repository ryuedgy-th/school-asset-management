import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { auth } from '@/auth';
import nodemailer from 'nodemailer';

// POST - Test email connection
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { testEmail } = await req.json();

        const account = await prisma.emailAccount.findUnique({
            where: { id: parseInt(id) }
        });

        if (!account) {
            return NextResponse.json(
                { error: 'Email account not found' },
                { status: 404 }
            );
        }

        if (account.type === 'SMTP') {
            // Test SMTP connection
            if (!account.smtpPassword) {
                return NextResponse.json(
                    { error: 'SMTP password not configured' },
                    { status: 400 }
                );
            }

            const password = decrypt(account.smtpPassword);

            // Port 587 uses STARTTLS (secure: false)
            // Port 465 uses SSL/TLS (secure: true)
            const transporter = nodemailer.createTransport({
                host: account.smtpHost!,
                port: account.smtpPort!,
                secure: account.smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: account.smtpUser!,
                    pass: password,
                },
            });

            // Verify connection
            await transporter.verify();

            // Send test email
            const recipient = testEmail || session.user.email;
            await transporter.sendMail({
                from: `"${account.name}" <${account.email}>`,
                to: recipient,
                subject: 'Test Email - MYIS Asset Management',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #574193;">Email Connection Test</h2>
                        <p>This is a test email from your MYIS Asset Management system.</p>
                        <p><strong>Account:</strong> ${account.name} (${account.email})</p>
                        <p><strong>Type:</strong> SMTP</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            If you received this email, your email configuration is working correctly!
                        </p>
                    </div>
                `,
            });

            return NextResponse.json({
                success: true,
                message: `Test email sent successfully to ${recipient}`
            });

        } else if (account.type === 'GOOGLE_OAUTH') {
            // Send via Gmail API with OAuth2
            const { sendEmailViaGmailAPI } = await import('@/lib/gmail-oauth');

            const recipient = testEmail || session.user.email;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #574193;">Email Connection Test</h2>
                    <p>This is a test email from your MYIS Asset Management system.</p>
                    <p><strong>Account:</strong> ${account.name} (${account.email})</p>
                    <p><strong>Type:</strong> Google OAuth</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        If you received this email, your Google OAuth configuration is working correctly!
                    </p>
                </div>
            `;

            await sendEmailViaGmailAPI(
                account.id,
                recipient,
                'Test Email - MYIS Asset Management',
                html
            );

            return NextResponse.json({
                success: true,
                message: `Test email sent successfully to ${recipient} via Gmail API`
            });
        }

        return NextResponse.json(
            { error: 'Unknown account type' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('Error testing email connection:', error);

        return NextResponse.json(
            {
                error: 'Email test failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
