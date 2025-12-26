import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Check if user has valid passcode cookie
export async function GET() {
    try {
        const cookieStore = await cookies();
        const scanAccess = cookieStore.get('scan_access');

        if (scanAccess?.value === 'true') {
            return NextResponse.json({ authenticated: true });
        } else {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    try {
        const { passcode } = await req.json();

        // Get passcode from environment variable
        const correctPasscode = process.env.SCAN_PASSCODE || 'MYIS2024';

        if (passcode === correctPasscode) {
            // Set secure cookie for scan access (20 minutes)
            const cookieStore = await cookies();
            cookieStore.set('scan_access', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 20, // 20 minutes
                path: '/'
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid passcode' },
                { status: 401 }
            );
        }
    } catch (error: any) {
        console.error('Passcode verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}

// Clear passcode cookie
export async function DELETE() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('scan_access');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cookie deletion error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
