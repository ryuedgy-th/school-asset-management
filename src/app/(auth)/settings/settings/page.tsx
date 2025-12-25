import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import EmailSettingsClient from '@/components/Settings/EmailSettingsClient';
import { Settings as SettingsIcon } from 'lucide-react';

export default async function SettingsPage() {
    const session = await auth();

    // Check if user is admin
    if (!session?.user?.email) {
        redirect('/login');
    }

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <SettingsIcon className="text-slate-600" size={32} />
                    <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
                </div>
                <p className="text-slate-500">Configure system-wide settings and preferences</p>
            </div>

            <EmailSettingsClient />

            {/* Future: Add more settings sections here */}
            {/* <GeneralSettingsClient /> */}
            {/* <SecuritySettingsClient /> */}
        </div>
    );
}
