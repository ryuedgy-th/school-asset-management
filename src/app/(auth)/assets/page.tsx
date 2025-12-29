import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Metadata } from 'next';
import AssetGrid from '@/components/AssetGrid';
import AssetFilters from '@/components/AssetFilters';
import Pagination from '@/components/Pagination';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDepartmentFilter } from '@/lib/permissions';

export const metadata: Metadata = {
    title: 'IT Assets | AssetMaster',
    description: 'Manage school equipment and IT assets',
};

export default async function AssetsPage(props: {
    searchParams?: Promise<{
        q?: string;
        categories?: string;
        statuses?: string;
        locations?: string;
        page?: string;
        pageSize?: string;
    }>;
}) {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    // Get user with department info
    const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: {
            userRole: true,
            userDepartment: true,
        },
    });

    if (!user) {
        redirect('/login');
    }

    const searchParams = await props.searchParams;
    const query = searchParams?.q || '';
    const categoriesParam = searchParams?.categories || '';
    const statusesParam = searchParams?.statuses || '';
    const locationsParam = searchParams?.locations || '';
    const page = Number(searchParams?.page) || 1;
    const pageSize = Number(searchParams?.pageSize) || 25;

    const whereClause: any = {
        ...await getDepartmentFilter(user.id), // 🔒 Department isolation
    };

    // Search query
    if (query) {
        whereClause.OR = [
            { name: { contains: query } },
            { serialNumber: { contains: query } },
            { assetCode: { contains: query } },
        ];
    }

    // Multi-select categories
    if (categoriesParam) {
        const categories = categoriesParam.split(',').filter(Boolean);
        if (categories.length > 0) {
            whereClause.category = { in: categories };
        }
    }

    // Multi-select statuses
    if (statusesParam) {
        const statuses = statusesParam.split(',').filter(Boolean);
        if (statuses.length > 0) {
            whereClause.status = { in: statuses };
        }
    }

    // Multi-select locations
    if (locationsParam) {
        const locations = locationsParam.split(',').filter(Boolean);
        if (locations.length > 0) {
            whereClause.location = { in: locations };
        }
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Fetch assets and total count in parallel
    const [assets, totalCount, categories, locations] = await Promise.all([
        prisma.asset.findMany({
            where: whereClause,
            skip,
            take: pageSize,
            orderBy: { id: 'desc' },
        }),
        prisma.asset.count({ where: whereClause }),
        prisma.asset.findMany({
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' }
        }),
        prisma.asset.findMany({
            select: { location: true },
            where: { location: { not: null } },
            distinct: ['location'],
            orderBy: { location: 'asc' }
        })
    ]);

    const uniqueCategories = categories.map(c => c.category);
    const uniqueLocations = locations.map(l => l.location).filter(Boolean) as string[];

    return (
        <div className="container py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">IT Assets</h1>
                    <p className="text-gray-500 mt-1">Manage and track all school equipment</p>
                </div>
                <Link
                    href="/assets/new"
                    className="btn btn-primary"
                >
                    <Plus size={20} />
                    New Asset
                </Link>
            </div>

            {/* Filters */}
            <AssetFilters
                categories={uniqueCategories}
                locations={uniqueLocations}
            />

            {/* Assets Grid Client Component */}
            <AssetGrid assets={assets.map(asset => ({
                ...asset,
                cost: asset.cost ? Number(asset.cost) : null
            }))} />

            {/* Pagination */}
            <Pagination
                totalItems={totalCount}
                currentPage={page}
                pageSize={pageSize}
            />
        </div>
    );
}
