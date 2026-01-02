'use client';

import { Package, BookOpen, Clock, CheckCircle2, PenTool, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface UserDashboardProps {
    user: {
        name: string;
        email: string;
        department: string;
    };
    stats: {
        activeItems: number;
        activeAssignments: number;
        totalAssignments: number;
        closedAssignments: number;
        unsignedTransactions: number;
    };
    recentBorrows: Array<{
        asset: {
            id: number;
            name: string;
            assetCode: string;
            category: string;
            image: string | null;
            brand: string;
            model: string | null;
        };
        borrowDate: Date;
        transactionId: number;
        transactionNumber: string;
        isSigned: boolean;
        assignmentNumber: string;
    }>;
}

export default function UserDashboardClient({ user, stats, recentBorrows }: UserDashboardProps) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-green-50/20">
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-8 md:p-12 shadow-2xl shadow-primary/20">
                    {/* Pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }}></div>
                    </div>

                    <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="text-yellow-300 animate-pulse" size={24} />
                                <span className="text-purple-100 text-sm font-medium tracking-wide uppercase">
                                    {getGreeting()}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                                {user.name}
                            </h1>
                            <p className="text-purple-100 text-lg">
                                {user.department}
                            </p>
                        </div>

                        <div className="hidden md:block">
                            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <Package className="text-white" size={48} />
                            </div>
                        </div>
                    </div>

                    {/* Quick stats bar */}
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <div className="text-3xl font-bold text-white">{stats.activeItems}</div>
                            <div className="text-purple-100 text-sm mt-1">Items in Use</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <div className="text-3xl font-bold text-white">{stats.activeAssignments}</div>
                            <div className="text-purple-100 text-sm mt-1">Active Assignments</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <div className="text-3xl font-bold text-white">{stats.totalAssignments}</div>
                            <div className="text-purple-100 text-sm mt-1">Total Assignments</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                            <div className="text-3xl font-bold text-white">{stats.closedAssignments}</div>
                            <div className="text-purple-100 text-sm mt-1">Completed</div>
                        </div>
                    </div>
                </div>

                {/* Action needed alert */}
                {stats.unsignedTransactions > 0 && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 shadow-xl shadow-amber-500/20 animate-pulse" style={{ animationDuration: '2s' }}>
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <PenTool className="text-white" size={24} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-lg">Action Required</h3>
                                <p className="text-amber-50">
                                    You have {stats.unsignedTransactions} transaction{stats.unsignedTransactions > 1 ? 's' : ''} waiting for your signature
                                </p>
                            </div>
                            <Link
                                href="/assignments"
                                className="flex-shrink-0 px-6 py-3 bg-white text-amber-600 rounded-xl font-semibold hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Sign Now
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Currently Borrowed Items */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Package className="text-primary" size={20} />
                                </div>
                                Your Equipment
                            </h2>
                            <Link
                                href="/assignments"
                                className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1 group"
                            >
                                View All
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {recentBorrows.length === 0 ? (
                            <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center shadow-sm">
                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Package className="text-slate-400" size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Equipment</h3>
                                <p className="text-slate-500">You don't have any borrowed items at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {recentBorrows.map((borrow, idx) => (
                                    <Link
                                        key={`${borrow.transactionId}-${borrow.asset.id}`}
                                        href={`/assignments/${borrow.assignmentNumber}`}
                                        className="group"
                                        style={{
                                            animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards`
                                        }}
                                    >
                                        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 h-full">
                                            {/* Unsigned badge */}
                                            {!borrow.isSigned && (
                                                <div className="absolute top-3 right-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                                        <PenTool size={10} />
                                                        Sign
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex gap-4">
                                                {/* Asset image */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-primary/30 transition-colors">
                                                        {borrow.asset.image ? (
                                                            <img
                                                                src={borrow.asset.image}
                                                                alt={borrow.asset.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Package className="text-slate-400" size={28} />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Asset details */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
                                                        {borrow.asset.name}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 truncate">
                                                        {borrow.asset.brand} {borrow.asset.model || ''}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                            {borrow.asset.assetCode}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                                                        <Clock size={12} />
                                                        Since {new Date(borrow.borrowDate).toLocaleDateString('en-GB')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Sidebar */}
                    <div className="space-y-6">
                        {/* My Assignments Card */}
                        <div className="rounded-3xl bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 p-6 shadow-xl shadow-secondary/20 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-xl font-bold">My Assignments</h3>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between py-2 border-b border-white/20">
                                    <span className="text-green-50">Active</span>
                                    <span className="font-bold text-2xl">{stats.activeAssignments}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-white/20">
                                    <span className="text-green-50">Completed</span>
                                    <span className="font-bold text-2xl">{stats.closedAssignments}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-green-50">Total</span>
                                    <span className="font-bold text-2xl">{stats.totalAssignments}</span>
                                </div>
                            </div>

                            <Link
                                href="/assignments"
                                className="block w-full py-3 bg-white text-secondary rounded-xl font-semibold text-center hover:bg-green-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                View All Assignments
                            </Link>
                        </div>

                        {/* Help Card */}
                        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="text-primary" size={20} />
                                Need Help?
                            </h3>
                            <p className="text-sm text-slate-600 mb-4">
                                If you have any questions about your borrowed equipment or assignments, feel free to reach out.
                            </p>
                            <button className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
                                Contact Support
                            </button>
                        </div>

                        {/* Academic Year Info */}
                        <div className="rounded-3xl bg-gradient-to-br from-purple-100 via-purple-50 to-white border border-purple-200 p-6 shadow-sm">
                            <h3 className="font-bold text-purple-900 mb-2">Academic Year</h3>
                            <div className="text-3xl font-bold text-primary mb-1">
                                {new Date().getFullYear()}
                            </div>
                            <p className="text-sm text-purple-600">
                                Term {new Date().getMonth() < 6 ? '2' : '1'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
