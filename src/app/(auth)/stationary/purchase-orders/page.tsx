import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { hasModuleAccess } from '@/lib/permissions';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

export default async function StationaryPurchaseOrdersPage() {
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

    // Fetch purchase orders
    const posRaw = await prisma.stationaryPurchaseOrder.findMany({
        include: {
            vendor: { select: { id: true, vendorCode: true, name: true } },
            createdBy: { select: { id: true, name: true } },
            approvedBy: { select: { id: true, name: true } },
            items: {
                include: {
                    item: { select: { id: true, itemCode: true, name: true, uom: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    const pos = posRaw.map(po => ({
        ...po,
        subtotal: Number(po.subtotal),
        totalAmount: Number(po.totalAmount),
        items: po.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
        })),
    }));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/stationary"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/90 mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Stationary
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                            <ShoppingCart className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
                            <p className="text-slate-500 mt-1">Procurement and vendor management</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">PO Number</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Vendor</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Items</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Total Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Order Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {pos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No purchase orders found
                                        </td>
                                    </tr>
                                ) : (
                                    pos.map((po) => (
                                        <tr key={po.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm">{po.poNumber}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-sm">{po.vendor.name}</p>
                                                    <p className="text-xs text-slate-500">{po.vendor.vendorCode}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold">{po.items.length} items</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-green-600">{formatCurrency(po.totalAmount)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm">{new Date(po.orderDate).toLocaleDateString('th-TH')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    po.status === 'received' ? 'bg-green-100 text-green-800' :
                                                    po.status === 'partially_received' ? 'bg-purple-100 text-purple-800' :
                                                    po.status === 'ordered' ? 'bg-purple-100 text-purple-800' :
                                                    po.status === 'approved' ? 'bg-cyan-100 text-cyan-800' :
                                                    po.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                    po.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                    po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {po.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
