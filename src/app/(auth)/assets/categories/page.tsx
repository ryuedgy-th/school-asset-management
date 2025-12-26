import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import CategoryList from '@/components/CategoryList';
import { Package2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Categories | AssetMaster',
    description: 'Manage asset categories',
};

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <div className="container py-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Package2 className="text-primary" size={32} />
                        Categories
                    </h1>
                    <p className="text-gray-500 mt-1">Define and manage equipment types.</p>
                </div>
            </div>

            <CategoryList categories={categories} />
        </div>
    );
}
