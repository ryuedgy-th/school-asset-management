'use client';

import { useState } from 'react';
import { MapPin, Plus, Edit, Trash2, Building2, User, Package } from 'lucide-react';
import Swal from 'sweetalert2';
import LocationModal from './LocationModal';

interface Location {
    id: number;
    code: string;
    name: string;
    type: string;
    address: string | null;
    capacity: number | null;
    isActive: boolean;
    department: { id: number; code: string; name: string } | null;
    managedBy: { id: number; name: string; email: string } | null;
    _count: { stock: number };
}

interface StationaryLocationsClientProps {
    locations: Location[];
    departments: any[];
    users: any[];
    user: any;
}

export default function StationaryLocationsClient({
    locations,
    departments,
    users,
    user,
}: StationaryLocationsClientProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredLocations = locations.filter((loc) => {
        const matchesSearch =
            searchQuery === '' ||
            loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.code.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === 'all' || loc.type === filterType;

        return matchesSearch && matchesType && loc.isActive;
    });

    const handleEdit = (location: Location) => {
        setSelectedLocation(location);
        setShowModal(true);
    };

    const handleDelete = async (location: Location) => {
        if (location._count.stock > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Cannot Delete',
                text: `This location has ${location._count.stock} stock records. Please transfer or remove stock first.`,
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Delete Location?',
            text: `Are you sure you want to delete "${location.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/stationary/locations/${location.id}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Failed to delete location');
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Location has been deleted successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });

                window.location.reload();
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Failed to delete location',
                });
            }
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'warehouse':
                return 'bg-primary/10 text-primary border-primary/20';
            case 'department':
                return 'bg-secondary/10 text-secondary border-secondary/20';
            case 'storage':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'warehouse':
                return 'Warehouse';
            case 'department':
                return 'Department Store';
            case 'storage':
                return 'Storage Room';
            default:
                return type;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <MapPin className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Storage Locations</h1>
                                <p className="text-slate-500 mt-1">
                                    Manage warehouses and storage locations
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedLocation(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                            Add Location
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-slate-600">Total Locations</p>
                            <Building2 className="text-primary" size={20} />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{locations.length}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-slate-600">Warehouses</p>
                            <Package className="text-primary" size={20} />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {locations.filter((l) => l.type === 'warehouse').length}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-slate-600">Dept. Stores</p>
                            <Building2 className="text-secondary" size={20} />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {locations.filter((l) => l.type === 'department').length}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-slate-600">Total Stock Items</p>
                            <Package className="text-slate-600" size={20} />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">
                            {locations.reduce((sum, l) => sum + l._count.stock, 0)}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Type
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="all">All Types</option>
                                <option value="warehouse">Warehouse</option>
                                <option value="department">Department Store</option>
                                <option value="storage">Storage Room</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Locations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLocations.map((location) => (
                        <div
                            key={location.id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {location.name}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-3">
                                        Code: <code className="bg-slate-100 px-2 py-0.5 rounded">{location.code}</code>
                                    </p>
                                    <span
                                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(
                                            location.type
                                        )}`}
                                    >
                                        {getTypeLabel(location.type)}
                                    </span>
                                </div>
                            </div>

                            {location.address && (
                                <p className="text-sm text-slate-600 mb-3 flex items-start gap-2">
                                    <MapPin size={16} className="text-slate-400 mt-0.5" />
                                    {location.address}
                                </p>
                            )}

                            {location.department && (
                                <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
                                    <Building2 size={16} className="text-slate-400" />
                                    {location.department.name}
                                </p>
                            )}

                            {location.managedBy && (
                                <p className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                                    <User size={16} className="text-slate-400" />
                                    {location.managedBy.name}
                                </p>
                            )}

                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Package size={16} className="text-slate-400" />
                                    <span>{location._count.stock} stock items</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(location)}
                                        className="p-2 text-primary hover:bg-purple-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(location)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredLocations.length === 0 && (
                    <div className="text-center py-12">
                        <MapPin className="mx-auto text-slate-300 mb-4" size={64} />
                        <p className="text-slate-500 text-lg">No locations found</p>
                        <p className="text-slate-400 text-sm mt-2">
                            Try adjusting your search or filters
                        </p>
                    </div>
                )}
            </div>

            {showModal && (
                <LocationModal
                    location={selectedLocation}
                    departments={departments}
                    users={users}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedLocation(null);
                    }}
                />
            )}
        </div>
    );
}
