'use client';

import { useState } from 'react';
import { Search, AlertCircle, Box, Filter } from 'lucide-react';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const CATEGORIES = ['All', 'Laptop', 'Tablet', 'Camera', 'AV Equipment', 'Accessory'];

export default function BorrowClient({ initialAssets }: { initialAssets: any[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredItems = initialAssets.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleRequest = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Browse Equipment</h1>
                <p className="text-slate-500">Search and request school assets for your activities.</p>
            </div>

            {/* Filter Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search equipment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/80/10 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
                                selectedCategory === cat
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                        <div className="relative aspect-video w-full bg-slate-100">
                            {item.image ? (
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-slate-50 text-slate-300">
                                    <Box size={40} />
                                </div>
                            )}
                            <div className="absolute top-3 right-3 z-10">
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md",
                                    item.currentStock > 0
                                        ? "bg-white/90 text-emerald-700"
                                        : "bg-slate-900/90 text-white"
                                )}>
                                    {item.currentStock > 0 ? `${item.currentStock} Available` : 'Out of Stock'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col p-5">
                            <div className="mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                    {item.category}
                                </span>
                                <h3 className="mt-1 text-lg font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                            </div>

                            <button
                                className={cn(
                                    "mt-auto w-full rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                                    item.currentStock > 0
                                        ? "bg-primary text-white shadow-primary/80/25 hover:bg-primary/90 hover:shadow-primary/30"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                )}
                                onClick={() => handleRequest(item)}
                                disabled={item.currentStock === 0}
                            >
                                {item.currentStock > 0 ? 'Request Item' : 'Unavailable'}
                            </button>
                        </div>
                    </div>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
                        <Search size={40} className="mb-4 opacity-20" />
                        <p className="font-medium">No equipment found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Request Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={`Request ${selectedItem?.name}`}
            >
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const startDate = (form.elements.namedItem('startDate') as HTMLInputElement).value;
                    const endDate = (form.elements.namedItem('endDate') as HTMLInputElement).value;
                    const reason = (form.elements.namedItem('reason') as HTMLTextAreaElement).value;

                    try {
                        const res = await fetch('/api/borrow', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                assetId: selectedItem.id,
                                userId: 1, // Mock user
                                startDate,
                                endDate,
                                reason
                            })
                        });

                        if (!res.ok) throw new Error('Failed');

                        alert('Request submitted successfully!');
                        closeModal();
                    } catch (err) {
                        alert('Failed to submit request');
                    }
                }} className="space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">From</label>
                            <input
                                type="date"
                                name="startDate"
                                required
                                className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/80/10 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">To</label>
                            <input
                                type="date"
                                name="endDate"
                                required
                                className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/80/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reason</label>
                        <textarea
                            name="reason"
                            rows={3}
                            className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/80/10 transition-all placeholder:text-slate-400"
                            placeholder="E.g. Teaching class grade 10, Project presentation..."
                            required
                        />
                    </div>

                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-700">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p className="text-sm">
                            Please return the equipment in the same condition. You are responsible for any damages incurred during the borrowing period.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white shadow-lg shadow-primary/80/25 hover:bg-primary/90 hover:shadow-primary/30 transition-all active:scale-95">
                            Confirm Request
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
