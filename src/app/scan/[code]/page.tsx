'use client';

import { use, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Smartphone, Calendar, User, ClipboardCheck, History, Package, MapPin, DollarSign, XCircle, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';

interface ScanPageProps {
    params: Promise<{ code: string }>;
}

export default function ScanPage({ params }: ScanPageProps) {
    const { code } = use(params);
    const [asset, setAsset] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Passcode states (20-minute session)
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [passcodeError, setPasscodeError] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check if user has valid passcode cookie
    useEffect(() => {
        fetch('/api/scan/verify-passcode', {
            method: 'GET',
        })
            .then(res => {
                if (res.ok) {
                    setIsAuthenticated(true);
                }
            })
            .catch(() => {
                // No valid cookie
            })
            .finally(() => setCheckingAuth(false));
    }, []);

    // Fetch asset data when authenticated
    useEffect(() => {
        if (!code || !isAuthenticated) return;

        fetch(`/api/scan/${code}`)
            .then(res => {
                if (!res.ok) throw new Error('Asset not found');
                return res.json();
            })
            .then(data => setAsset(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [code, isAuthenticated]);

    const handlePasscodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasscodeError('');

        try {
            const res = await fetch('/api/scan/verify-passcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
            });

            const data = await res.json();

            if (data.success) {
                setIsAuthenticated(true);
                setPasscode('');
            } else {
                setPasscodeError('Invalid passcode. Please try again.');
            }
        } catch (err) {
            setPasscodeError('Connection error. Please try again.');
        }
    };


    // Show passcode modal if not authenticated
    if (!isAuthenticated && !checkingAuth) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-primary/10 flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={28} className="sm:hidden" />
                        <Lock size={32} className="hidden sm:block" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-center">Access Protected</h1>
                    <p className="text-sm sm:text-base text-slate-500 mb-6 text-center px-2">Please enter the passcode to view asset information</p>

                    <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter passcode"
                                className="w-full px-4 py-3 sm:py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/80 text-center text-base sm:text-lg font-mono"
                                autoFocus
                            />
                            {passcodeError && (
                                <p className="text-red-500 text-xs sm:text-sm mt-2 text-center">{passcodeError}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 sm:py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <Unlock size={18} className="sm:hidden" />
                            <Unlock size={20} className="hidden sm:block" />
                            Unlock
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-400">
                        MYIS International School<br />
                        Asset Management System
                    </div>
                </div>
            </div>
        );
    }

    if (checkingAuth || loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/10 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Loading Asset Data...</p>
            </div>
        </div>
    );

    if (error || !asset) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary/10 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Asset Not Found</h1>
                <p className="text-slate-500 mb-6">The scanned QR code matches no record in our system.</p>
                <Link href="/" className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                    Go Home
                </Link>
            </div>
        </div>
    );

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'Available': 'bg-green-100 text-green-800',
            'Borrowed': 'bg-primary/20 text-blue-800',
            'Maintenance': 'bg-yellow-100 text-yellow-800',
            'Broken': 'bg-red-100 text-red-800',
            'Lost': 'bg-gray-100 text-gray-800',
            'Retired': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const isWarrantyActive = asset.warrantyExp ? new Date(asset.warrantyExp) > new Date() : false;

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-primary/10 pb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary text-white p-6 pb-12 rounded-b-3xl shadow-xl">
                <div className="w-full max-w-5xl px-4 md:px-8 lg:px-12" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Package size={24} />
                        <span className="text-sm font-semibold opacity-90">Asset Information</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">{asset.name}</h1>
                </div>
            </div>

            <div className="w-full max-w-5xl px-4 md:px-8 lg:px-12 -mt-8 space-y-4" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                {/* Status Card */}
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</span>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(asset.status)}`}>
                            {asset.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg col-span-2 md:col-span-3">
                            <div className="text-xs text-slate-500 mb-1">Asset Code</div>
                            <div className="font-mono text-lg font-bold text-primary">{asset.assetCode}</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-500 mb-1">Category</div>
                            <div className="font-semibold text-slate-900">{asset.category || 'N/A'}</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <div className="text-xs text-slate-500 mb-1">Stock</div>
                            <div className="font-semibold text-slate-900">
                                {asset.totalStock === 1 ? (asset.status === 'Available' ? 1 : 0) : asset.currentStock} / {asset.totalStock}
                            </div>
                        </div>
                        {asset.brand && (
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <div className="text-xs text-slate-500 mb-1">Brand</div>
                                <div className="font-semibold text-slate-900">{asset.brand}</div>
                            </div>
                        )}
                        {asset.model && (
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <div className="text-xs text-slate-500 mb-1">Model</div>
                                <div className="font-semibold text-slate-900">{asset.model}</div>
                            </div>
                        )}
                        {asset.serialNumber && (
                            <div className="p-3 bg-slate-50 rounded-lg col-span-2 md:col-span-3">
                                <div className="text-xs text-slate-500 mb-1">Serial Number</div>
                                <div className="font-mono text-sm text-slate-900">{asset.serialNumber}</div>
                            </div>
                        )}
                        {asset.location && (
                            <div className="p-3 bg-slate-50 rounded-lg col-span-2 md:col-span-3">
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <MapPin size={12} />
                                    Location
                                </div>
                                <div className="font-semibold text-slate-900">{asset.location}</div>
                            </div>
                        )}
                    </div>
                </div >

                {/* Warranty */}
                {
                    asset.warrantyExp && (
                        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <CheckCircle size={16} className="text-primary" />
                                Warranty Status
                            </h3>
                            <div className={`p-4 rounded-xl ${isWarrantyActive ? 'bg-green-50' : 'bg-slate-50'}`}>
                                <div className={`text-sm font-bold ${isWarrantyActive ? 'text-green-700' : 'text-slate-500'}`}>
                                    {isWarrantyActive ? '✓ Active Coverage' : '✗ Expired'}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Expires: {new Date(asset.warrantyExp).toLocaleDateString('en-GB')}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Borrow History */}
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <History size={16} className="text-primary" />
                        Recent Borrows
                    </h3>
                    {asset.borrowHistory && asset.borrowHistory.length > 0 ? (
                        <div className="space-y-3">
                            {asset.borrowHistory.map((item: any, idx: number) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-semibold text-sm text-slate-900">
                                            {item.borrowTransaction?.assignment?.user?.name || 'N/A'}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.status === 'Returned' ? 'bg-gray-100 text-gray-700' : 'bg-primary/20 text-primary/90'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {item.borrowTransaction?.assignment?.user?.department || 'N/A'} • Qty: {item.quantity}
                                    </div>
                                    {item.borrowTransaction?.borrowDate && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            {new Date(item.borrowTransaction.borrowDate).toLocaleDateString('en-GB')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 bg-slate-50 rounded-xl text-center">
                            <div className="text-slate-400 text-sm">No borrow history available</div>
                        </div>
                    )}
                </div>

                {/* Inspection History */}
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <ClipboardCheck size={16} className="text-primary" />
                        Recent Inspections
                    </h3>
                    {asset.inspections && asset.inspections.length > 0 ? (
                        <div className="space-y-3">
                            {asset.inspections.map((inspection: any) => (
                                <div key={inspection.id} className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-slate-500">
                                            {new Date(inspection.inspectionDate).toLocaleDateString('en-GB')}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${inspection.inspectionType === 'checkout' ? 'bg-primary/20 text-primary/90' :
                                            inspection.inspectionType === 'checkin' ? 'bg-green-100 text-green-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                            {inspection.inspectionType}
                                        </span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900 mb-1">
                                        Condition: {inspection.overallCondition}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <User size={12} />
                                        {inspection.inspector.name}
                                    </div>
                                    {inspection.damageFound && (
                                        <div className="mt-2 text-xs text-red-600 font-medium">
                                            ⚠️ Damage reported
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 bg-slate-50 rounded-xl text-center">
                            <div className="text-slate-400 text-sm">No inspection history available</div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={() => alert('Feature coming soon: Report Issue')}
                        className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                        <AlertCircle size={20} />
                        Report Issue
                    </button>
                </div>
            </div >

            <div className="text-center mt-8 text-xs text-slate-400">
                MYIS International School<br />
                Asset Management System
            </div>
        </div >
    );
}
