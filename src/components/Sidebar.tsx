'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Box,
    Calendar,
    Globe,
    Key,
    FileText,
    Users,
    Settings,
    CheckCircle,
    Building2,
    LogOut,
    Shield,
    ShoppingBag,
    ChevronDown,
    ChevronRight,
    Menu,
    X as CloseIcon,
    Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import MobileHeader from './MobileHeader';

type SubMenuItem = {
    label: string;
    href: string;
    roles?: string[];
};

type MenuItem = {
    icon: any;
    label: string;
    href: string;
    roles?: string[];
    subItems?: SubMenuItem[];
};

const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    {
        icon: Box,
        label: 'IT Assets',
        href: '/assets',
        subItems: [
            { label: 'All IT Assets', href: '/assets' },
            { label: 'Categories', href: '/assets/categories' },
            { label: 'Domains', href: '/domains' },
            { label: 'Software Licenses', href: '/licenses' }
        ]
    },
    {
        icon: Calendar,
        label: 'Maintenance',
        href: '/pm',
        subItems: [
            { label: 'PM Schedule', href: '/pm' },
            { label: 'Inspections', href: '/inspections' }
        ]
    },
    {
        label: 'Asset Assignment',
        icon: ShoppingBag,
        href: '/dashboard/borrowing',
        subItems: [
            { label: 'Borrowing Management', href: '/dashboard/borrowing', roles: ['Admin', 'Technician'] },
            { label: 'My Assignment', href: '/borrow' }
        ]
    },
    {
        label: 'Users',
        icon: Users,
        href: '/users',
        roles: ['Admin'],
        subItems: [
            { label: 'All Users', href: '/users' },
            { label: 'Roles', href: '/roles' },
            { label: 'Audit Logs', href: '/audit' }
        ]
    },
    {
        icon: Settings,
        label: 'Settings',
        href: '/settings',
        subItems: [
            { label: 'Email Accounts', href: '/settings/email/accounts' },
            { label: 'Email Templates', href: '/settings/email/templates' },
        ]
    },
];

interface SidebarProps {
    permissions: string[];
    role: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

function SidebarMenu({ items, role }: { items: MenuItem[], role: string }) {
    const pathname = usePathname();
    const [openItems, setOpenItems] = useState<string[]>([]);

    useEffect(() => {
        const newOpenItems: string[] = [];
        items.forEach(item => {
            if (item.subItems && item.subItems.some(sub => pathname === sub.href)) {
                newOpenItems.push(item.label);
            }
        });
        setOpenItems(prev => Array.from(new Set([...prev, ...newOpenItems])));
    }, [pathname, items]);

    const toggleItem = (label: string) => {
        setOpenItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    return (
        <div className="space-y-1">
            {items.map((item) => {
                const isMainActive = pathname === item.href;
                const isChildActive = item.subItems?.some(sub => pathname === sub.href);
                const isActive = isMainActive || isChildActive;
                const isExpanded = openItems.includes(item.label);
                const hasSubItems = item.subItems && item.subItems.length > 0;

                // Filter subItems based on role (case-insensitive)
                const filteredSubItems = item.subItems?.filter(subItem => {
                    if (!subItem.roles) return true;
                    return subItem.roles.some(r => r.toLowerCase() === role.toLowerCase());
                });

                // If menu has subitems but role filters all of them out, treat as no subitems?
                // For now assuming if subItems defined, it's a parent. But if filteredSubItems is empty, should we hide parent?
                // Maybe not, usually parent is clickable if it has href.
                // But here parent href directs to a page too.

                return (
                    <div key={item.label}>
                        {hasSubItems ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleItem(item.label);
                                }}
                                className={cn(
                                    "w-full group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 select-none",
                                    isActive || isExpanded
                                        ? "text-gray-900 bg-gray-100" // Active parent style
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            "transition-colors duration-200",
                                            isActive || isExpanded ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                                        )}
                                    />
                                    <span>{item.label}</span>
                                </div>
                                <div className={cn("transition-transform duration-200 text-gray-500", isExpanded && "rotate-180")}>
                                    <ChevronDown size={16} />
                                </div>
                            </button>
                        ) : (
                            <Link
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon
                                    size={20}
                                    className={cn(
                                        "transition-colors duration-200",
                                        isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                                    )}
                                />
                                <span>{item.label}</span>

                            </Link>
                        )}

                        {/* Submenu with Animation */}
                        {hasSubItems && (
                            <div
                                className={cn(
                                    "grid transition-all duration-200 ease-in-out",
                                    isExpanded ? "grid-rows-[1fr] mt-1" : "grid-rows-[0fr]"
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="ml-11 border-l-2 border-gray-200 pl-2 space-y-1 pb-1">
                                        {filteredSubItems && filteredSubItems.map((sub) => {
                                            const isSubActive = pathname === sub.href;
                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={cn(
                                                        "block rounded-md px-3 py-2 text-xs font-medium transition-colors",
                                                        isSubActive
                                                            ? "bg-gray-100 text-gray-900"
                                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                                    )}
                                                >
                                                    {sub.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function Sidebar({ permissions, role, user }: SidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    console.log('🔍 Sidebar role:', role); // Debug log

    const filteredItems = menuItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.some(r => r.toLowerCase() === role.toLowerCase());
    });

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header */}
            <MobileHeader onMenuClick={() => setIsMobileOpen(!isMobileOpen)} />

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-sm transition-transform duration-300 ease-in-out flex flex-col",
                // Mobile: slide in from left
                "lg:translate-x-0",
                isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Logo Section */}
                <div className="flex h-20 items-center gap-3 px-6 border-b border-gray-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                        <Building2 className="text-white" size={20} />
                    </div>
                    <div className="flex flex-col flex-1">
                        <span className="text-lg font-bold tracking-tight text-gray-900">AssetMaster</span>
                        <span className="text-xs text-gray-500 font-medium tracking-wide">EDUCATION EDITION</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <CloseIcon size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                    <p className="mb-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                        Main Menu
                    </p>
                    <SidebarMenu items={filteredItems} role={role} />
                </nav>


                {/* Footer / Profile */}
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-3 transition-colors hover:bg-gray-50 hover:border-primary cursor-pointer"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white overflow-hidden">
                            {user?.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-semibold text-gray-900">
                                {user?.name || user?.email || 'User'}
                            </span>
                            <span className="truncate text-xs text-gray-500">
                                {role || 'User'}
                            </span>
                        </div>
                    </Link>
                    <form
                        action={async () => {
                            const { logout } = await import('@/app/lib/actions');
                            await logout();
                        }}
                        className="mt-2"
                    >
                        <button className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </form>
                </div >
            </aside >
        </>
    );
}
