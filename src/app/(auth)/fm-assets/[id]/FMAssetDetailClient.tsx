'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Edit, Trash2, QrCode, Warehouse, MapPin, Calendar, DollarSign,
    Settings, Wrench, ClipboardList, Ticket, FileText, Network, Package,
    Image as ImageIcon, Download, AlertCircle, CheckCircle, Clock, User, Plus
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import QRPrintModal from '@/components/QRPrintModal';
import PMScheduleModal from '@/components/PMScheduleModal';
import ComponentModal from '@/components/ComponentModal';

interface FMAssetDetailClientProps {
    fmAsset: any;
    users: any[];
    categories: any[];
    user: any;
}

export default function FMAssetDetailClient({ fmAsset, users, categories, user }: FMAssetDetailClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [showQRModal, setShowQRModal] = useState(false);
    const [showPMModal, setShowPMModal] = useState(false);
    const [showComponentModal, setShowComponentModal] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState<any>(null);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Warehouse },
        { id: 'components', label: 'Components', icon: Settings, badge: fmAsset.components?.length },
        { id: 'maintenance', label: 'Maintenance History', icon: Wrench, badge: fmAsset.maintenanceLogs?.length },
        { id: 'pm-schedules', label: 'PM Schedules', icon: ClipboardList, badge: fmAsset.pmSchedules?.length },
        { id: 'tickets', label: 'Tickets', icon: Ticket, badge: fmAsset.tickets?.length },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'hierarchy', label: 'Hierarchy', icon: Network },
    ];

    const getStatusBadge = (status: string) => {
        const badges = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
            maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Maintenance' },
            retired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Retired' },
        };
        const badge = badges[status as keyof typeof badges] || badges.inactive;
        return <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>;
    };

    const getConditionBadge = (condition: string) => {
        const badges = {
            excellent: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
            good: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            fair: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
            poor: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
        };
        const badge = badges[condition as keyof typeof badges] || badges.good;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${badge.bg} ${badge.text}`}>
                <Icon size={14} />
                {condition}
            </span>
        );
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete FM Asset?',
            html: `Are you sure you want to delete <strong>"${fmAsset.name}"</strong>?<br/><br/>This will set the status to <strong>Retired</strong>.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, retire it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/fm-assets/${fmAsset.id}?soft=true`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    await Swal.fire({
                        title: 'Asset Retired',
                        text: 'FM asset has been retired successfully.',
                        icon: 'success',
                        confirmButtonColor: '#3b82f6',
                    });
                    router.push('/fm-assets');
                } else {
                    throw new Error('Failed to delete asset');
                }
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to retire asset',
                    icon: 'error',
                    confirmButtonColor: '#3b82f6',
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/10 to-slate-50 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/fm-assets"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to FM Assets
                    </Link>

                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="p-4 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <Warehouse className="text-white" size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-slate-900">{fmAsset.name}</h1>
                                    {getStatusBadge(fmAsset.status)}
                                    {getConditionBadge(fmAsset.condition)}
                                </div>
                                <div className="flex items-center gap-4 text-slate-600">
                                    <span className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-md">
                                        {fmAsset.assetCode}
                                    </span>
                                    <span className="text-sm">{fmAsset.category.name}</span>
                                    {fmAsset.brand && fmAsset.model && (
                                        <span className="text-sm">{fmAsset.brand} {fmAsset.model}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowQRModal(true)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                title="Print QR Code"
                            >
                                <QrCode size={20} />
                            </button>
                            <Link
                                href={`/fm-assets/${fmAsset.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                            >
                                <Edit size={18} />
                                Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <Trash2 size={18} />
                                Retire
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-200">
                        <div className="flex overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3 py-3 font-medium transition-colors whitespace-nowrap text-sm ${activeTab === tab.id
                                            ? 'text-primary border-b-2 border-primary bg-primary/5'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {tab.label}
                                        {tab.badge !== undefined && tab.badge > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 sm:p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <InfoItem icon={Warehouse} label="Asset Type" value={fmAsset.type} />
                                        <InfoItem icon={Package} label="Serial Number" value={fmAsset.serialNumber || 'N/A'} />
                                        <InfoItem icon={MapPin} label="Location" value={fmAsset.location} />
                                        {fmAsset.building && (
                                            <InfoItem icon={MapPin} label="Building" value={`${fmAsset.building}${fmAsset.floor ? `, Floor ${fmAsset.floor}` : ''}${fmAsset.room ? `, Room ${fmAsset.room}` : ''}`} />
                                        )}
                                        <InfoItem icon={Calendar} label="Purchase Date" value={fmAsset.purchaseDate ? new Date(fmAsset.purchaseDate).toLocaleDateString() : 'N/A'} />
                                        <InfoItem icon={Calendar} label="Install Date" value={fmAsset.installDate ? new Date(fmAsset.installDate).toLocaleDateString() : 'N/A'} />
                                        <InfoItem icon={Calendar} label="Warranty Expiry" value={fmAsset.warrantyExpiry ? new Date(fmAsset.warrantyExpiry).toLocaleDateString() : 'N/A'} />
                                        <InfoItem icon={DollarSign} label="Purchase Cost" value={fmAsset.purchaseCost ? `$${fmAsset.purchaseCost.toLocaleString()}` : 'N/A'} />
                                        <InfoItem icon={DollarSign} label="Current Value" value={fmAsset.currentValue ? `$${fmAsset.currentValue.toLocaleString()}` : 'N/A'} />
                                        <InfoItem
                                            icon={Wrench}
                                            label="Requires Maintenance"
                                            value={fmAsset.requiresMaintenance ? 'Yes' : 'No'}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                {fmAsset.description && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Description</h3>
                                        <p className="text-slate-700">{fmAsset.description}</p>
                                    </div>
                                )}

                                {/* Specifications */}
                                {fmAsset.specifications && Object.keys(fmAsset.specifications).length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Specifications</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {Object.entries(fmAsset.specifications).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <span className="text-slate-600 font-medium">{key}:</span>
                                                    <span className="text-slate-900">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Images */}
                                {fmAsset.images && fmAsset.images.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Photos</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {fmAsset.images.map((img: string, idx: number) => (
                                                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                                                    <img
                                                        src={img}
                                                        alt={`Asset ${idx + 1}`}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                                        onClick={() => window.open(img, '_blank')}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Created By */}
                                {fmAsset.createdBy && (
                                    <div className="pt-4 border-t border-slate-200">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <User size={16} />
                                            Created by {fmAsset.createdBy.name} on {new Date(fmAsset.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Components Tab */}
                        {activeTab === 'components' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-900">Components</h3>
                                    <button
                                        onClick={() => {
                                            setSelectedComponent(null);
                                            setShowComponentModal(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20"
                                    >
                                        <Settings size={18} />
                                        Add Component
                                    </button>
                                </div>

                                {fmAsset.components && fmAsset.components.length > 0 ? (
                                    <div className="space-y-4">
                                        {fmAsset.components.map((component: any) => (
                                            <div key={component.id} className="p-4 border border-slate-200 rounded-lg hover:border-primary/50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h4 className="font-semibold text-slate-900">{component.name}</h4>
                                                            <span className={`px-2 py-0.5 text-xs rounded-full ${component.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {component.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-slate-600 space-y-1">
                                                            <p><strong>Type:</strong> {component.componentType}</p>
                                                            {component.partNumber && <p><strong>Part #:</strong> {component.partNumber}</p>}
                                                            {component.lastServiceDate && (
                                                                <p><strong>Last Service:</strong> {new Date(component.lastServiceDate).toLocaleDateString()}</p>
                                                            )}
                                                            {component.nextServiceDue && (
                                                                <p><strong>Next Service:</strong> {new Date(component.nextServiceDue).toLocaleDateString()}</p>
                                                            )}
                                                            <p><strong>Service Records:</strong> {component._count.serviceHistory}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedComponent(component);
                                                                setShowComponentModal(true);
                                                            }}
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                                                            title="Edit Component"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const result = await Swal.fire({
                                                                    title: 'Delete Component?',
                                                                    html: `Are you sure you want to delete <strong>"${component.name}"</strong>?`,
                                                                    icon: 'warning',
                                                                    showCancelButton: true,
                                                                    confirmButtonColor: '#ef4444',
                                                                    cancelButtonColor: '#6b7280',
                                                                    confirmButtonText: 'Yes, delete it',
                                                                    cancelButtonText: 'Cancel',
                                                                });
                                                                if (result.isConfirmed) {
                                                                    try {
                                                                        const response = await fetch(`/api/components/${component.id}`, {
                                                                            method: 'DELETE',
                                                                        });
                                                                        if (response.ok) {
                                                                            await Swal.fire({
                                                                                title: 'Deleted!',
                                                                                text: 'Component has been deleted successfully.',
                                                                                icon: 'success',
                                                                                confirmButtonColor: '#3b82f6',
                                                                            });
                                                                            router.refresh();
                                                                        } else {
                                                                            throw new Error('Failed to delete component');
                                                                        }
                                                                    } catch (error) {
                                                                        Swal.fire({
                                                                            title: 'Error',
                                                                            text: 'Failed to delete component',
                                                                            icon: 'error',
                                                                            confirmButtonColor: '#3b82f6',
                                                                        });
                                                                    }
                                                                }
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                            title="Delete Component"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <Settings className="mx-auto mb-4 text-slate-300" size={48} />
                                        <p>No components added yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Maintenance History Tab */}
                        {activeTab === 'maintenance' && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Maintenance History</h3>
                                {fmAsset.maintenanceLogs && fmAsset.maintenanceLogs.length > 0 ? (
                                    <div className="space-y-4">
                                        {fmAsset.maintenanceLogs.map((log: any) => (
                                            <div key={log.id} className="flex gap-4 p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                                                <div className="flex-shrink-0 w-20 text-center">
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short' })}
                                                    </div>
                                                    <div className="text-2xl font-bold text-primary">
                                                        {new Date(log.date).getDate()}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {new Date(log.date).getFullYear()}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                                                            {log.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 mb-2">{log.description || 'No description'}</p>
                                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                                        <span><User size={14} className="inline mr-1" />{log.performedBy}</span>
                                                        {log.cost && <span><DollarSign size={14} className="inline mr-1" />${log.cost}</span>}
                                                        {log.partsChanged && <span><Package size={14} className="inline mr-1" />{log.partsChanged}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <Wrench className="mx-auto mb-4 text-slate-300" size={48} />
                                        <p>No maintenance records yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PM Schedules Tab */}
                        {activeTab === 'pm-schedules' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-900">Preventive Maintenance Schedules</h3>
                                    <button
                                        onClick={() => setShowPMModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20"
                                    >
                                        <Plus size={18} />
                                        New PM Schedule
                                    </button>
                                </div>

                                {fmAsset.pmSchedules && fmAsset.pmSchedules.length > 0 ? (
                                    <div className="space-y-3">
                                        {fmAsset.pmSchedules.map((schedule: any) => (
                                            <div key={schedule.id} className="p-4 border border-slate-200 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">{schedule.name}</h4>
                                                        <p className="text-sm text-slate-600 mt-1">{schedule.description}</p>
                                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                                            <span className={`px-2 py-1 rounded-full ${schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {schedule.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                            <span className="text-slate-600">
                                                                <Clock size={14} className="inline mr-1" />
                                                                Next: {schedule.nextDueDate ? new Date(schedule.nextDueDate).toLocaleDateString() : 'Not scheduled'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <ClipboardList className="mx-auto mb-4 text-slate-300" size={48} />
                                        <p>No PM schedules configured</p>
                                        <p className="text-sm mt-2">Click '+ New PM Schedule' to create your first maintenance schedule</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tickets Tab */}
                        {activeTab === 'tickets' && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Open Tickets</h3>
                                {fmAsset.tickets && fmAsset.tickets.length > 0 ? (
                                    <div className="space-y-3">
                                        {fmAsset.tickets.map((ticket: any) => (
                                            <Link
                                                key={ticket.id}
                                                href={`/tickets/${ticket.id}`}
                                                className="block p-4 border border-slate-200 rounded-lg hover:border-primary/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono text-sm text-primary">{ticket.ticketNumber}</span>
                                                            <span className={`px-2 py-0.5 text-xs rounded-full ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                                ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {ticket.priority}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-semibold text-slate-900">{ticket.title}</h4>
                                                        <p className="text-sm text-slate-600 mt-1">{ticket.description}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <Ticket className="mx-auto mb-4 text-slate-300" size={48} />
                                        <p>No open tickets</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="text-center py-12 text-slate-500">
                                <FileText className="mx-auto mb-4 text-slate-300" size={48} />
                                <p>Document management coming soon</p>
                            </div>
                        )}

                        {/* Hierarchy Tab */}
                        {activeTab === 'hierarchy' && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Asset Hierarchy</h3>

                                {fmAsset.parentAsset && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-slate-600 mb-2">Parent Asset</h4>
                                        <Link
                                            href={`/fm-assets/${fmAsset.parentAsset.id}`}
                                            className="inline-flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:border-primary/50"
                                        >
                                            <Warehouse size={18} className="text-primary" />
                                            <div>
                                                <div className="font-medium text-slate-900">{fmAsset.parentAsset.name}</div>
                                                <div className="text-sm text-slate-500">{fmAsset.parentAsset.assetCode}</div>
                                            </div>
                                        </Link>
                                    </div>
                                )}

                                {fmAsset.childAssets && fmAsset.childAssets.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 mb-2">Child Assets ({fmAsset.childAssets.length})</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {fmAsset.childAssets.map((child: any) => (
                                                <Link
                                                    key={child.id}
                                                    href={`/fm-assets/${child.id}`}
                                                    className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:border-primary/50"
                                                >
                                                    <Warehouse size={18} className="text-primary" />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-slate-900">{child.name}</div>
                                                        <div className="text-sm text-slate-500">{child.assetCode}</div>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${child.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {child.status}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!fmAsset.parentAsset && (!fmAsset.childAssets || fmAsset.childAssets.length === 0) && (
                                    <div className="text-center py-12 text-slate-500">
                                        <Network className="mx-auto mb-4 text-slate-300" size={48} />
                                        <p>No hierarchy relationships</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Print Modal */}
            <QRPrintModal
                assetId={fmAsset.id}
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
            />

            {/* PM Schedule Modal */}
            <PMScheduleModal
                isOpen={showPMModal}
                onClose={() => setShowPMModal(false)}
                onSubmit={async (data) => {
                    try {
                        const res = await fetch('/api/pm-schedules', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                        });
                        if (!res.ok) throw new Error('Failed to create PM schedule');
                        await Swal.fire({
                            title: 'Success!',
                            text: 'PM Schedule created successfully',
                            icon: 'success',
                            confirmButtonColor: '#574193',
                        });
                        setShowPMModal(false);
                        router.refresh();
                    } catch (error) {
                        Swal.fire({
                            title: 'Error',
                            text: 'Failed to create PM schedule',
                            icon: 'error',
                        });
                        throw error;
                    }
                }}
                schedule={null}
                assets={[{ id: fmAsset.id, name: fmAsset.name, assetCode: fmAsset.assetCode }]}
                users={users}
                preselectedAssetId={fmAsset.id}
                components={fmAsset.components || []}
            />

            {/* Component Modal */}
            <ComponentModal
                isOpen={showComponentModal}
                onClose={() => {
                    setShowComponentModal(false);
                    setSelectedComponent(null);
                }}
                onSuccess={() => {
                    setShowComponentModal(false);
                    setSelectedComponent(null);
                    Swal.fire({
                        title: 'Success!',
                        text: selectedComponent ? 'Component updated successfully' : 'Component added successfully',
                        icon: 'success',
                        confirmButtonColor: '#574193',
                    });
                    router.refresh();
                }}
                assetId={fmAsset.id}
                component={selectedComponent}
            />
        </div>
    );
}

// Helper Component
function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <Icon size={18} className="text-primary mt-0.5" />
            <div>
                <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                <div className="text-sm font-medium text-slate-900">{value}</div>
            </div>
        </div>
    );
}
