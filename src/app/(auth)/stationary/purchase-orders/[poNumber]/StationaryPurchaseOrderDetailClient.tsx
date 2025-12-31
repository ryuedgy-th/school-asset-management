'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface POItem {
    id: number;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    totalPrice: number;
    item: {
        id: number;
        itemCode: string;
        name: string;
        uom: string;
    };
}

interface Vendor {
    id: number;
    vendorCode: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    paymentTerms: string | null;
}

interface POData {
    id: number;
    poNumber: string;
    orderDate: Date;
    expectedDelivery: Date | null;
    status: string;
    subtotal: number;
    tax: number | null;
    shippingCost: number | null;
    totalAmount: number;
    notes: string | null;
    termsConditions: string | null;
    createdAt: Date;
    updatedAt: Date;
    approvedAt: Date | null;
    receivedAt: Date | null;
    vendor: Vendor;
    createdBy: {
        id: number;
        name: string | null;
        email: string | null;
    };
    approvedBy: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    receivedBy: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
    items: POItem[];
}

export default function StationaryPurchaseOrderDetailClient({
    purchaseOrder,
    canApprove,
    canReceive,
    canEdit,
    isCreator,
    currentUserId,
}: {
    purchaseOrder: POData;
    canApprove: boolean;
    canReceive: boolean;
    canEdit: boolean;
    isCreator: boolean;
    currentUserId: number;
}) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        const result = await Swal.fire({
            title: 'Approve Purchase Order?',
            text: `Approve PO ${purchaseOrder.poNumber} for ฿${purchaseOrder.totalAmount.toFixed(2)}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, approve it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                const res = await fetch(`/api/stationary/purchase-orders/${purchaseOrder.poNumber}/approve`, {
                    method: 'POST',
                });

                if (res.ok) {
                    await Swal.fire('Approved!', 'Purchase order has been approved.', 'success');
                    router.refresh();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to approve PO');
                }
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleReceive = async () => {
        const result = await Swal.fire({
            title: 'Receive Items?',
            text: 'Mark all items in this PO as received and add them to stock?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, receive items',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                const res = await fetch(`/api/stationary/purchase-orders/${purchaseOrder.poNumber}/receive`, {
                    method: 'POST',
                });

                if (res.ok) {
                    await Swal.fire('Received!', 'Items have been received and added to stock.', 'success');
                    router.refresh();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to receive items');
                }
            } catch (error: any) {
                Swal.fire('Error', error.message, 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            draft: { label: 'Draft', color: 'bg-slate-100 text-slate-800' },
            submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
            approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
            ordered: { label: 'Ordered', color: 'bg-purple-100 text-purple-800' },
            partially_received: { label: 'Partially Received', color: 'bg-purple-100 text-purple-800' },
            received: { label: 'Received', color: 'bg-green-100 text-green-800' },
            closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700' },
            cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
        };
        return badges[status] || badges.draft;
    };

    const statusBadge = getStatusBadge(purchaseOrder.status);

    const totalReceived = purchaseOrder.items.reduce((sum, item) => sum + item.quantityReceived, 0);
    const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantityOrdered, 0);
    const receivedPercentage = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Link href="/stationary" className="hover:text-green-600">Stationary</Link>
                    <span>/</span>
                    <Link href="/stationary/purchase-orders" className="hover:text-green-600">Purchase Orders</Link>
                    <span>/</span>
                    <span className="text-slate-900">{purchaseOrder.poNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">Purchase Order</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.color}`}>
                                {statusBadge.label}
                            </span>
                        </div>
                        <p className="text-slate-600 mt-1">{purchaseOrder.poNumber}</p>
                    </div>
                    <div className="flex gap-3">
                        {canApprove && (
                            <button
                                onClick={handleApprove}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Approve PO'}
                            </button>
                        )}
                        {canReceive && (
                            <button
                                onClick={handleReceive}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Receive Items'}
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Print PO
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Order Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Item</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Ordered</th>
                                        {purchaseOrder.items.some(i => i.quantityReceived > 0) && (
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Received</th>
                                        )}
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Unit Price</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseOrder.items.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <Link
                                                        href={`/stationary/items/${item.item.itemCode}`}
                                                        className="font-medium text-green-600 hover:text-green-700"
                                                    >
                                                        {item.item.name}
                                                    </Link>
                                                    <p className="text-sm text-slate-500">{item.item.itemCode}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                {item.quantityOrdered} {item.item.uom}
                                            </td>
                                            {purchaseOrder.items.some(i => i.quantityReceived > 0) && (
                                                <td className="py-3 px-4 text-right font-semibold text-green-700">
                                                    {item.quantityReceived} {item.item.uom}
                                                </td>
                                            )}
                                            <td className="py-3 px-4 text-right text-slate-700">
                                                ฿{item.unitPrice.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                ฿{item.totalPrice.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-200">
                                        <td colSpan={purchaseOrder.items.some(i => i.quantityReceived > 0) ? 4 : 3} className="py-3 px-4 text-right font-semibold text-slate-700">
                                            Subtotal:
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                            ฿{purchaseOrder.subtotal.toFixed(2)}
                                        </td>
                                    </tr>
                                    {purchaseOrder.tax && (
                                        <tr>
                                            <td colSpan={purchaseOrder.items.some(i => i.quantityReceived > 0) ? 4 : 3} className="py-3 px-4 text-right font-semibold text-slate-700">
                                                Tax:
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                ฿{purchaseOrder.tax.toFixed(2)}
                                            </td>
                                        </tr>
                                    )}
                                    {purchaseOrder.shippingCost && (
                                        <tr>
                                            <td colSpan={purchaseOrder.items.some(i => i.quantityReceived > 0) ? 4 : 3} className="py-3 px-4 text-right font-semibold text-slate-700">
                                                Shipping:
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                ฿{purchaseOrder.shippingCost.toFixed(2)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                                        <td colSpan={purchaseOrder.items.some(i => i.quantityReceived > 0) ? 4 : 3} className="py-3 px-4 text-right font-bold text-slate-900">
                                            Total Amount:
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-green-700 text-lg">
                                            ฿{purchaseOrder.totalAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Vendor Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Vendor Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600">Vendor Name</label>
                                <p className="text-slate-900 mt-1 font-medium">{purchaseOrder.vendor.name}</p>
                                <p className="text-sm text-slate-500">{purchaseOrder.vendor.vendorCode}</p>
                            </div>
                            {purchaseOrder.vendor.contactPerson && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Contact Person</label>
                                    <p className="text-slate-900 mt-1">{purchaseOrder.vendor.contactPerson}</p>
                                </div>
                            )}
                            {purchaseOrder.vendor.email && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Email</label>
                                    <p className="text-slate-900 mt-1">{purchaseOrder.vendor.email}</p>
                                </div>
                            )}
                            {purchaseOrder.vendor.phone && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Phone</label>
                                    <p className="text-slate-900 mt-1">{purchaseOrder.vendor.phone}</p>
                                </div>
                            )}
                            {purchaseOrder.vendor.address && (
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-slate-600">Address</label>
                                    <p className="text-slate-900 mt-1">{purchaseOrder.vendor.address}</p>
                                </div>
                            )}
                            {purchaseOrder.vendor.paymentTerms && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Payment Terms</label>
                                    <p className="text-slate-900 mt-1">{purchaseOrder.vendor.paymentTerms}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    {purchaseOrder.termsConditions && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Terms & Conditions</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{purchaseOrder.termsConditions}</p>
                        </div>
                    )}

                    {/* Notes */}
                    {purchaseOrder.notes && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Notes</h2>
                            <p className="text-slate-700 whitespace-pre-wrap">{purchaseOrder.notes}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* PO Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">PO Details</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-600">Created By</label>
                                <p className="text-slate-900 mt-1 font-medium">{purchaseOrder.createdBy.name || 'N/A'}</p>
                                <p className="text-sm text-slate-500">{purchaseOrder.createdBy.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600">Order Date</label>
                                <p className="text-slate-900 mt-1">{new Date(purchaseOrder.orderDate).toLocaleDateString()}</p>
                            </div>
                            {purchaseOrder.expectedDelivery && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Expected Delivery</label>
                                    <p className="text-slate-900 mt-1">{new Date(purchaseOrder.expectedDelivery).toLocaleDateString()}</p>
                                </div>
                            )}
                            {purchaseOrder.approvedAt && purchaseOrder.approvedBy && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Approved By</label>
                                    <p className="text-slate-900 mt-1">{purchaseOrder.approvedBy.name || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{new Date(purchaseOrder.approvedAt).toLocaleString()}</p>
                                </div>
                            )}
                            {purchaseOrder.receivedAt && purchaseOrder.receivedBy && (
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Received By</label>
                                    <p className="text-slate-900 mt-1">{purchaseOrder.receivedBy.name || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{new Date(purchaseOrder.receivedAt).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total Card */}
                    <div className="bg-gradient-to-br from-primary to-purple-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="text-sm font-medium text-purple-100 mb-2">Total Amount</div>
                        <div className="text-4xl font-bold">฿{purchaseOrder.totalAmount.toFixed(2)}</div>
                        <div className="mt-4 pt-4 border-t border-purple-400">
                            <div className="text-sm font-medium text-purple-100">Items Ordered</div>
                            <div className="text-2xl font-bold">{purchaseOrder.items.length}</div>
                        </div>
                    </div>

                    {/* Receiving Progress */}
                    {receivedPercentage > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">Receiving Progress</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Received</span>
                                    <span className="font-semibold text-slate-900">{receivedPercentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3">
                                    <div
                                        className="bg-green-600 rounded-full h-3 transition-all"
                                        style={{ width: `${receivedPercentage}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-600">
                                    <span>{totalReceived} received</span>
                                    <span>{totalOrdered} ordered</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
