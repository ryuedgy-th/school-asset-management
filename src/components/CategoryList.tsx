'use client';

import { useState } from 'react';
import { Category } from '@prisma/client';
import { Plus, Pencil, Trash2, Save, X, Loader2, RefreshCw } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory, syncCategoriesFromAssets } from '@/app/lib/category-actions';
import { useRouter } from 'next/navigation';
import { useConfirm, useAlert } from '@/contexts/DialogProvider';

interface CategoryListProps {
    categories: Category[];
}

export default function CategoryList({ categories }: CategoryListProps) {
    const { confirm } = useConfirm();
    const { alert } = useAlert();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({ name: '', description: '' });

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await syncCategoriesFromAssets();
            if (res.success) {
                router.refresh();
                if (res.count && res.count > 0) {
                    await alert({
                        title: 'Sync Complete',
                        message: `Synced ${res.count} new categories from assets.`,
                        variant: 'success'
                    });
                } else {
                    await alert({
                        title: 'Already Synced',
                        message: 'All categories are already synced.',
                        variant: 'info'
                    });
                }
            }
        } catch (error) {
            await alert({
                title: 'Sync Failed',
                message: 'Failed to sync categories from assets.',
                variant: 'error'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const openCreate = () => {
        setFormData({ name: '', description: '' });
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const openEdit = (cat: Category) => {
        setFormData({ name: cat.name, description: cat.description || '' });
        setEditingCategory(cat);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const data = new FormData();
        data.set('name', formData.name);
        data.set('description', formData.description);

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, data);
            } else {
                await createCategory(data);
            }
            setIsModalOpen(false);
            router.refresh();
        } catch (error) {
            await alert({
                title: 'Error',
                message: 'Failed to save category',
                variant: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await confirm({
            title: 'Delete Category',
            message: 'Are you sure you want to delete this category? This might affect assets linked to this category.',
            confirmText: 'Delete',
            variant: 'warning'
        });

        if (!confirmed) return;

        try {
            await deleteCategory(id);
            router.refresh();
        } catch (e) {
            await alert({
                title: 'Error',
                message: 'Failed to delete category',
                variant: 'error'
            });
        }
    };;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="font-semibold text-slate-700">All Categories</span>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                        title="Import existing categories from assets"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        Sync from Assets
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={16} />
                        Add Category
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700 w-[50px]">ID</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-mono text-slate-400">#{cat.id}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">{cat.name}</td>
                                <td className="px-6 py-4 text-slate-500">{cat.description || '-'}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEdit(cat)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-colors">
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingCategory ? 'Edit Category' : 'New Category'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none"
                                    placeholder="e.g. Laptop"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80 outline-none resize-none h-24"
                                    placeholder="Optional description..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
