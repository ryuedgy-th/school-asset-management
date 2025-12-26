'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 1 day (24 hours)
const WARNING_TIME = 23 * 60 * 60 * 1000; // 23 hours (warn 1 hour before)
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export default function SessionTimeout() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // Update last activity on user interaction
    const updateActivity = useCallback(() => {
        setLastActivity(Date.now());
        setShowWarning(false);
    }, []);

    // Track user activity
    useEffect(() => {
        if (!session) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            window.addEventListener(event, updateActivity);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
        };
    }, [session, updateActivity]);

    // Check session timeout
    useEffect(() => {
        if (!session) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceActivity = now - lastActivity;

            // Show warning at 28 minutes
            if (timeSinceActivity >= WARNING_TIME && timeSinceActivity < SESSION_TIMEOUT) {
                setShowWarning(true);
            }

            // Logout at 30 minutes
            if (timeSinceActivity >= SESSION_TIMEOUT) {
                router.push('/login?timeout=true');
            }
        }, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [session, lastActivity, router]);

    // Extend session on activity
    const extendSession = useCallback(async () => {
        updateActivity();
        await update(); // Refresh session
    }, [update, updateActivity]);

    if (!showWarning || !session) return null;

    const remainingTime = Math.ceil((SESSION_TIMEOUT - (Date.now() - lastActivity)) / 60000);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-amber-100 rounded-full">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Session Expiring Soon</h3>
                </div>

                <p className="text-slate-600 mb-6">
                    Your session will expire in <span className="font-bold text-amber-600">{remainingTime} minute{remainingTime > 1 ? 's' : ''}</span> due to inactivity.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={extendSession}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all"
                    >
                        Stay Logged In
                    </button>
                    <button
                        onClick={() => router.push('/login')}
                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-all"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
