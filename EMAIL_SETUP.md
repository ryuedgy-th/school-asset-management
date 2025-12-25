# Email Configuration Guide

## Problem
Send Email button not working - no emails being sent.

## Root Cause
Email configuration not set up in `.env` file.

## Solution

### 1. Add Email Configuration to `.env`

Add these lines to your `.env` file:

```env
# Email Configuration (Gmail Example)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="School IT <your-email@gmail.com>"
```

### 2. Get Gmail App Password

If using Gmail:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required)
3. Go to **App Passwords**
4. Generate new app password for "Mail"
5. Copy the 16-character password
6. Use it as `EMAIL_SERVER_PASSWORD`

### 3. Test Email

1. Restart dev server: `npm run dev`
2. Go to Assignment detail page
3. Click "Send Email"
4. Check console for success/error messages

## Alternative Email Providers

### Outlook/Office 365
```env
EMAIL_SERVER_HOST="smtp.office365.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@outlook.com"
EMAIL_SERVER_PASSWORD="your-password"
```

### Custom SMTP
```env
EMAIL_SERVER_HOST="mail.yourdomain.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="noreply@yourdomain.com"
EMAIL_SERVER_PASSWORD="your-password"
```

## Troubleshooting

### Email Still Not Sending

Check console for error messages:
- ❌ "Email not configured" → Add EMAIL_SERVER_USER to .env
- ❌ "Authentication failed" → Check password/app password
- ❌ "Connection timeout" → Check host/port
- ❌ "TLS error" → Try port 465 instead of 587

### Testing Without Email

The system will work without email configuration:
- Use "Copy Link" button instead
- Manually send link to users
- Email simulation mode will log to console

## Current Behavior

**With Email Configured:**
- ✅ Sends actual email to user
- Shows "✅ Email sent successfully!"

**Without Email Configured:**
- ⚠️ Shows warning message
- Logs signature link to console
- You can still copy link manually
