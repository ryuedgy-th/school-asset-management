'use client';

import Link from 'next/link';
import { Mail, FileText, Settings } from 'lucide-react';

export default function EmailSettingsPage() {
    const sections = [
        {
            title: 'Email Accounts',
            description: 'Manage SMTP and OAuth email accounts for sending notifications',
            icon: Mail,
            href: '/settings/email/accounts',
            color: 'primary',
        },
        {
            title: 'Email Templates',
            description: 'Create and manage email templates with dynamic variables',
            icon: FileText,
            href: '/settings/email/templates',
            color: 'secondary',
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Email Management</h1>
                <p className="text-slate-600 mt-2">Configure email accounts and templates for automated notifications</p>
            </div>

            {/* Sections Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="group bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-primary hover:shadow-xl transition-all duration-200"
                        >
                            <div className={`w-14 h-14 rounded-xl bg-${section.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <Icon size={28} className={`text-${section.color}`} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                                {section.title}
                            </h2>
                            <p className="text-slate-600">
                                {section.description}
                            </p>
                            <div className="mt-4 text-primary font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                                Manage →
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Settings size={20} className="text-primary" />
                    Quick Start Guide
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-700">
                    <li>Add an email account (SMTP or Google OAuth)</li>
                    <li>Create email templates with variables like <code className="px-2 py-0.5 bg-slate-100 rounded text-sm">{'{userName}'}</code></li>
                    <li>Templates will be used automatically for inspections and borrowing notifications</li>
                </ol>
            </div>
        </div>
    );
}
