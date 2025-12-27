/**
 * Email Template Wrapper
 * Wraps email content in professional branded template
 */

/**
 * Wrap email content in professional template with school branding
 */
export function wrapEmailTemplate(subject: string, bodyContent: string): string {
    // Auto-format: Convert line breaks to proper paragraphs
    const formattedBody = bodyContent
        .split('\n\n')
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .map(para => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #374151;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <!-- Main Container -->
                        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            
                            <!-- Header with School Purple -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #574193 0%, #6b4fa3 100%); padding: 32px 40px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                                        ${subject}
                                    </h1>
                                </td>
                            </tr>
                            
                            <!-- Body Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    ${formattedBody}
                                </td>
                            </tr>
                            
                            <!-- Divider -->
                            <tr>
                                <td style="padding: 0 40px;">
                                    <div style="border-top: 2px solid #e5e7eb;"></div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 32px 40px; background-color: #f9fafb;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center">
                                                <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #574193;">
                                                    Magic Years International School
                                                </p>
                                                <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                                                    Asset Management System
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                        </table>
                        
                        <!-- Footer Note -->
                        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
                            <tr>
                                <td align="center" style="padding: 0 20px;">
                                    <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                                        This is an automated message from the School Asset Management System.
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
