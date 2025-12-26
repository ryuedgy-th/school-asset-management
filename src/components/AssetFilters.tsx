'use client';

import { Search, Filter, FileSpreadsheet, X, ChevronDown, Download } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useState, useEffect } from 'react';
import ImportAssetsModal from './ImportAssetsModal';

interface AssetFiltersProps {
    categories?: string[];
    locations?: string[];
    statuses?: string[];
}

export default function AssetFilters({ categories = [], locations = [], statuses = ['Available', 'Borrowed', 'Maintenance'] }: AssetFiltersProps) {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Multi-select states
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

    // Initialize from URL params
    useEffect(() => {
        const cats = searchParams.get('categories')?.split(',').filter(Boolean) || [];
        const stats = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
        const locs = searchParams.get('locations')?.split(',').filter(Boolean) || [];

        setSelectedCategories(cats);
        setSelectedStatuses(stats);
        setSelectedLocations(locs);
    }, [searchParams]);

    const handleSearch = useDebouncedCallback((term: string) => {
        updateParams({ q: term || undefined });
    }, 300);

    const updateParams = (updates: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams);

        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        // Reset to page 1 when filters change
        params.set('page', '1');
        replace(`/assets?${params.toString()}`);
    };

    const applyFilters = () => {
        updateParams({
            categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
            statuses: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
            locations: selectedLocations.length > 0 ? selectedLocations.join(',') : undefined,
        });
        setShowFilters(false);
    };

    const clearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedStatuses([]);
        setSelectedLocations([]);
        updateParams({
            categories: undefined,
            statuses: undefined,
            locations: undefined,
            q: undefined,
        });
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const toggleLocation = (loc: string) => {
        setSelectedLocations(prev =>
            prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
        );
    };

    const activeFilterCount = selectedCategories.length + selectedStatuses.length + selectedLocations.length;

    return (
        <>
            <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                {/* Top Row: Search and Actions */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search assets by name or serial..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 transition-all"
                            onChange={(e) => handleSearch(e.target.value)}
                            defaultValue={searchParams.get('q')?.toString()}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-emerald-700 transition-all hover:shadow-md"
                        >
                            <FileSpreadsheet size={18} />
                            <span className="hidden sm:inline">Import CSV</span>
                        </button>

                        <div className="h-6 w-px bg-slate-200 mx-2"></div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeFilterCount > 0
                                    ? 'bg-primary text-white shadow-sm hover:bg-primary/90'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            <Filter size={18} />
                            <span className="hidden sm:inline">Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="bg-white text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        <div className="h-6 w-px bg-slate-200 mx-2"></div>

                        <span className="text-sm text-gray-600 hidden sm:inline">Show</span>
                        <select
                            className="border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80"
                            onChange={(e) => {
                                const params = new URLSearchParams(searchParams);
                                params.set('pageSize', e.target.value);
                                params.set('page', '1');
                                replace(`/assets?${params.toString()}`);
                            }}
                            defaultValue={searchParams.get('pageSize') || '25'}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                {/* Active Filters Display */}
                {activeFilterCount > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Active Filters:</span>
                        {selectedCategories.map(cat => (
                            <span key={cat} className="inline-flex items-center gap-1 bg-primary/20 text-primary/90 px-2 py-1 rounded-md text-xs font-medium">
                                {cat}
                                <button onClick={() => toggleCategory(cat)} className="hover:bg-blue-200 rounded-full p-0.5">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        {selectedStatuses.map(status => (
                            <span key={status} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium">
                                {status}
                                <button onClick={() => toggleStatus(status)} className="hover:bg-emerald-200 rounded-full p-0.5">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        {selectedLocations.map(loc => (
                            <span key={loc} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-medium">
                                {loc}
                                <button onClick={() => toggleLocation(loc)} className="hover:bg-purple-200 rounded-full p-0.5">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={clearAllFilters}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 underline ml-2"
                        >
                            Clear All
                        </button>
                    </div>
                )}

                {/* Filter Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        {/* Categories */}
                        {categories.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-2">Categories</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {categories.map(cat => (
                                        <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(cat)}
                                                onChange={() => toggleCategory(cat)}
                                                className="rounded border-slate-300 text-primary focus:ring-primary/80"
                                            />
                                            <span className="text-sm text-slate-700">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-2">Status</h4>
                            <div className="space-y-2">
                                {statuses.map(status => (
                                    <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.includes(status)}
                                            onChange={() => toggleStatus(status)}
                                            className="rounded border-slate-300 text-primary focus:ring-primary/80"
                                        />
                                        <span className="text-sm text-slate-700">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Locations */}
                        {locations.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-2">Locations</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {locations.map(loc => (
                                        <label key={loc} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={selectedLocations.includes(loc)}
                                                onChange={() => toggleLocation(loc)}
                                                className="rounded border-slate-300 text-primary focus:ring-primary/80"
                                            />
                                            <span className="text-sm text-slate-700">{loc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Apply/Clear Buttons */}
                        <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <button
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setSelectedStatuses([]);
                                    setSelectedLocations([]);
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ImportAssetsModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
            />
        </>
    );
}
