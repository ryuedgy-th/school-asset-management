import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import Link from 'next/link';
import { Package, Warehouse, Send, FileText, RotateCcw, ShoppingCart, TrendingDown, AlertTriangle, MapPin } from 'lucide-react';

export default async function StationaryDashboard() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: {
            userRole: true,
            userDepartment: true,
        },
    });

    if (!user || !hasModuleAccess(user, 'stationary')) {
        redirect('/');
    }

    // Fetch stats
    const [
        totalItems,
        totalStock,
        lowStockCount,
        outOfStockCount,
        pendingRequisitions,
        totalRequisitions,
        totalIssues,
        totalReturns,
        totalPOs,
    ] = await Promise.all([
        prisma.stationaryItem.count({ where: { isActive: true } }),
        prisma.stationaryStock.count(),
        // Low stock count - simplified query
        0, // Will calculate manually if needed
        prisma.stationaryStock.count({ where: { quantity: 0 } }),
        prisma.stationaryRequisition.count({ where: { status: 'pending' } }),
        prisma.stationaryRequisition.count(),
        prisma.stationaryIssue.count(),
        prisma.stationaryReturn.count(),
        prisma.stationaryPurchaseOrder.count(),
    ]);

    const modules = [
        {
            title: 'Items',
            description: 'Manage stationary items and catalog',
            icon: Package,
            href: '/stationary/items',
            color: 'primary',
            count: totalItems,
        },
        {
            title: 'Stock',
            description: 'Monitor inventory and stock levels',
            icon: Warehouse,
            href: '/stationary/stock',
            color: 'primary',
            count: totalStock,
            badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
        },
        {
            title: 'Requisitions',
            description: 'Request items from inventory',
            icon: Send,
            href: '/stationary/requisitions',
            color: 'secondary',
            count: totalRequisitions,
            badge: pendingRequisitions > 0 ? `${pendingRequisitions} pending` : undefined,
        },
        {
            title: 'Issues',
            description: 'Item distribution records',
            icon: FileText,
            href: '/stationary/issues',
            color: 'primary',
            count: totalIssues,
        },
        {
            title: 'Returns',
            description: 'Item return management',
            icon: RotateCcw,
            href: '/stationary/returns',
            color: 'secondary',
            count: totalReturns,
        },
        {
            title: 'Purchase Orders',
            description: 'Procurement and ordering',
            icon: ShoppingCart,
            href: '/stationary/purchase-orders',
            color: 'primary',
            count: totalPOs,
        },
    ];

    const colorClasses: Record<string, { bg: string; text: string; shadow: string }> = {
        primary: { bg: 'bg-primary', text: 'text-primary', shadow: 'shadow-primary/20' },
        secondary: { bg: 'bg-secondary', text: 'text-secondary', shadow: 'shadow-secondary/20' },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <Package className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900">Stationary Management</h1>
                            <p className="text-slate-500 mt-1">Manage inventory, requisitions, and procurement</p>
                        </div>
                    </div>
                </div>

                {/* Alert Cards */}
                {(lowStockCount > 0 || outOfStockCount > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {outOfStockCount > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-100 rounded-lg">
                                        <AlertTriangle className="text-red-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-red-900">Out of Stock Alert</h3>
                                        <p className="text-sm text-red-700 mt-1">
                                            {outOfStockCount} items are currently out of stock
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {lowStockCount > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <TrendingDown className="text-yellow-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-yellow-900">Low Stock Warning</h3>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            {lowStockCount} items are running low on stock
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Module Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => {
                        const colors = colorClasses[module.color];
                        const Icon = module.icon;

                        return (
                            <Link
                                key={module.href}
                                href={module.href}
                                className="group bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 ${colors.bg} rounded-xl shadow-lg ${colors.shadow} group-hover:scale-110 transition-transform`}>
                                        <Icon className="text-white" size={24} />
                                    </div>
                                    {module.badge && (
                                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                            {module.badge}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2">{module.title}</h2>
                                <p className="text-sm text-slate-600 mb-4">{module.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`text-2xl font-bold ${colors.text}`}>{module.count}</span>
                                    <span className={`text-sm ${colors.text} group-hover:translate-x-1 transition-transform`}>
                                        View →
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Quick Links */}
                <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Link
                            href="/stationary/items"
                            className="p-4 text-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Package className="mx-auto mb-2 text-primary" size={24} />
                            <p className="text-sm font-medium text-slate-900">Add Item</p>
                        </Link>
                        <Link
                            href="/stationary/locations"
                            className="p-4 text-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <MapPin className="mx-auto mb-2 text-primary" size={24} />
                            <p className="text-sm font-medium text-slate-900">Locations</p>
                        </Link>
                        <Link
                            href="/stationary/stock"
                            className="p-4 text-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Warehouse className="mx-auto mb-2 text-primary" size={24} />
                            <p className="text-sm font-medium text-slate-900">Adjust Stock</p>
                        </Link>
                        <Link
                            href="/stationary/requisitions"
                            className="p-4 text-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Send className="mx-auto mb-2 text-secondary" size={24} />
                            <p className="text-sm font-medium text-slate-900">New Requisition</p>
                        </Link>
                        <Link
                            href="/stationary/purchase-orders"
                            className="p-4 text-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <ShoppingCart className="mx-auto mb-2 text-primary" size={24} />
                            <p className="text-sm font-medium text-slate-900">Create PO</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
