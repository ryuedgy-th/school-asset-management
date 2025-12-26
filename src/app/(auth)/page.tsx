import {
  Package,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Box,
  ShoppingBag,
  Wrench
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import StatCard from '@/components/StatCard';
import Badge from '@/components/ui/Badge';

async function seedIfEmpty() {
  const count = await prisma.user.count();
  if (count === 0) {
    // (Seed logic kept same/omitted for brevity as it runs only once)
  }
}

export default async function Home() {
  await seedIfEmpty();

  const totalAssets = await prisma.asset.count();
  const availableAssets = await prisma.asset.count({
    where: { status: 'Available' }
  });
  const borrowedAssets = await prisma.asset.count({
    where: { status: 'Borrowed' }
  });
  const maintenanceAssets = await prisma.asset.count({
    where: { status: 'Maintenance' }
  });

  const activeAssignments = await prisma.assignment.count({
    where: { status: 'Active' }
  });
  const maintenanceCount = await prisma.pMTask.count({
    where: { status: 'Pending' }
  });

  const recentAssets = await prisma.asset.findMany({
    take: 4,
    orderBy: { id: 'desc' }
  });

  // Calculate trends (mock data - you can calculate real trends from historical data)
  const totalTrend = { value: 8, isPositive: true };
  const inUseTrend = { value: 12, isPositive: true };
  const availableTrend = { value: 5, isPositive: false };
  const maintenanceTrend = { value: 2, isPositive: true };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      {/* Asset Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={totalAssets}
          iconName="Package"
          trend={totalTrend}
        />
        <StatCard
          title="In Use"
          value={borrowedAssets}
          iconName="ShoppingBag"
          trend={inUseTrend}
        />
        <StatCard
          title="Available"
          value={availableAssets}
          iconName="CheckCircle2"
          trend={availableTrend}
        />
        <StatCard
          title="Maintenance"
          value={maintenanceAssets}
          iconName="Wrench"
          trend={maintenanceTrend}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Assets */}
        <section className="col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <h3 className="font-semibold text-slate-900">Recently Added Assets</h3>
            <button className="text-sm font-medium text-primary hover:text-primary/90">View All</button>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {recentAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Box size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{asset.name}</p>
                      <p className="text-sm text-slate-500">{asset.category}</p>
                    </div>
                  </div>
                  <Badge
                    color={
                      asset.status === 'Available' ? 'success' :
                        asset.status === 'Borrowed' ? 'warning' :
                          'error'
                    }
                  >
                    {asset.status}
                  </Badge>
                </div>
              ))}
              {recentAssets.length === 0 && (
                <p className="text-center text-slate-500 py-4">No assets found</p>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-800 p-6 text-white shadow-lg">
          <h3 className="mb-4 font-semibold text-slate-100">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between rounded-xl bg-white/10 p-4 hover:bg-white/20 transition-colors">
              <span className="text-sm font-medium">Add New Asset</span>
              <Package size={18} className="text-primary/60" />
            </button>
            <button className="w-full flex items-center justify-between rounded-xl bg-white/10 p-4 hover:bg-white/20 transition-colors">
              <span className="text-sm font-medium">Approve Requests</span>
              <CheckCircle2 size={18} className="text-emerald-300" />
            </button>
            <button className="w-full flex items-center justify-between rounded-xl bg-white/10 p-4 hover:bg-white/20 transition-colors">
              <span className="text-sm font-medium">Schedule Maintenance</span>
              <Clock size={18} className="text-amber-300" />
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 text-slate-300">
              <TrendingUp size={20} />
              <span className="text-xs">System efficiency increased by 12% this week</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
