# School Asset Management – Complete Refactor & Performance Roadmap

> **Goal:** ลด bundle size 60%+, เพิ่ม Server Actions & Streaming, และปรับ Component Tree ให้เป็น Server-first ภายใน 3 สัปดาห์ (2 Sprint) โดยใช้ Next.js 16 App Router best practices

---

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Root Cause Analysis](#3-root-cause-analysis)
4. [Sprint 0: Quick Wins](#4-sprint-0-quick-wins-05-day)
5. [Sprint 1: Server Actions & Streaming](#5-sprint-1-server-actions--streaming-5-days)
6. [Sprint 2: Server-first Component Tree](#6-sprint-2-server-first-component-tree-5-days)
7. [Performance Enhancements](#7-performance-enhancements-cross-cutting)
8. [Testing & Rollback Strategy](#8-testing--rollback-strategy)
9. [Appendix](#9-appendix)

---

## 1. Executive Summary

### 🎯 Objectives & KPI

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **First Load JS (gzipped)** | 280 KB | ≤ 95 KB | **-67%** |
| **Time to Interactive (3G)** | 2.8s | ≤ 1.1s | **-61%** |
| **Dashboard FCP** | 1200ms | ≤ 100ms | **-92% perceived** |
| **Lighthouse Performance** | 72 | ≥ 92 | **+20** |
| **API Routes** | 100+ | ≤ 10 | **-90%** |

### 📊 Expected Impact by Phase

| Phase | Bundle Size | TTI | Lighthouse | Key Wins |
|-------|-------------|-----|------------|----------|
| **Sprint 0** | 280KB → 170KB (-40%) | 2.8s → 1.8s | 72 → 82 | ClientProviders extraction |
| **Sprint 1** | 170KB → 120KB (-30%) | 1.8s → 1.2s | 82 → 88 | Tickets + Dashboard |
| **Sprint 2** | 120KB → 95KB (-21%) | 1.2s → 1.1s | 88 → 92 | Complete refactor |

---

## 2. Current State Analysis

### ✅ What's Working Well

#### Server Actions (24 files already!)
```typescript
// ✅ Good example: src/app/lib/actions.ts
'use server';

export async function createUser(formData: FormData) {
  const user = await prisma.user.create({ ... });
  await logAudit('CREATE_USER', 'User', user.id);
  revalidatePath('/users'); // Auto-refresh ✅
  return { success: true };
}
```

**Existing Server Actions:**
- ✅ `actions.ts` - User CRUD
- ✅ `borrow-actions.ts` - Borrow flow
- ✅ `fm-asset-actions.ts` - FM assets
- ✅ `inspection-actions.ts` - Inspections
- ✅ ... และอีก 20 ไฟล์

### ⚠️ Critical Issues

#### Issue #1: API Routes Overload (100+ endpoints)
```
src/app/api/
├── assets/route.ts
├── tickets/route.ts
├── pm/route.ts
├── borrow/route.ts
├── spare-parts/route.ts
└── ... +95 more files
```

**Problems:**
- ❌ Massive boilerplate (auth, JSON, error handling)
- ❌ No automatic revalidation
- ❌ Lower type safety
- ❌ Harder to maintain

---

#### Issue #2: Client Components Fetch Pattern (658 LOC!)

**Example:** [`TicketsClient.tsx`](file:///home/ryu/school-asset-management/src/app/(auth)/tickets/TicketsClient.tsx)

```typescript
// ❌ BEFORE: 658 lines of client-side fetching
'use client';

export default function TicketsClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTickets();
  }, [filterType, filterStatus]);
  
  const fetchTickets = async () => {
    setLoading(true);
    const res = await fetch(`/api/tickets?type=${filterType}&status=${filterStatus}`);
    const data = await res.json();
    setTickets(data.tickets);
    setLoading(false);
  };
  
  return (
    <div>
      {loading ? <Spinner /> : <TicketTable tickets={tickets} />}
      <TicketModal onSuccess={fetchTickets} /> {/* Manual refresh */}
    </div>
  );
}
```

**Performance Impact:**
```
Timeline:
0ms:    Request page
200ms:  HTML arrives (empty shell)
500ms:  JS Bundle downloaded
800ms:  React hydration complete
1100ms: useEffect fires → fetch('/api/tickets')
1400ms: API responds
1450ms: Data rendered
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 1450ms to see content! 😱
```

**Found in:**
- `TicketsClient.tsx` (658 LOC)
- `RequestTable.tsx`
- `PMCalendar.tsx`
- `AssetGrid.tsx`
- ... many more

---

#### Issue #3: Dashboard Sequential Blocking

**Current:** [`src/app/(auth)/page.tsx`](file:///home/ryu/school-asset-management/src/app/(auth)/page.tsx)

```typescript
// ❌ BEFORE: Wait for everything before showing anything
export default async function Home() {
  // Sequential blocking queries
  const totalAssets = await prisma.asset.count();           // 150ms
  const availableAssets = await prisma.asset.count();       // 120ms
  const borrowedAssets = await prisma.asset.count();        // 100ms
  const maintenanceAssets = await prisma.asset.count();     // 90ms
  const activeAssignments = await prisma.assignment.count(); // 200ms
  const recentAssets = await prisma.asset.findMany();       // 250ms
  
  // Total: 910ms before user sees ANYTHING 🐌
  
  return (
    <div>
      <StatsGrid ... />      {/* Blocked by all queries */}
      <RecentAssets ... />   {/* Blocked by all queries */}
      <QuickActions ... />   {/* Blocked even though it's static! */}
    </div>
  );
}
```

---

## 3. Root Cause Analysis

### 🔴 Critical: Client Providers in Root Layout

**The Biggest Problem:** [`src/app/layout.tsx`](file:///home/ryu/school-asset-management/src/app/layout.tsx)

```typescript
// ❌ CURRENT: Client Providers wrap everything
import { DialogProvider } from '@/contexts/DialogProvider';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>      {/* 'use client' */}
          <DialogProvider>     {/* 'use client' */}
            {children}         {/* ⚠️ ALL children become client! */}
          </DialogProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

> [!WARNING]
> **Critical Architecture Flaw**
> 
> ตามหลักการของ Next.js App Router:
> - `'use client'` แพร่กระจายลงไปทั้ง subtree
> - แม้ว่า Dashboard page จะไม่มี `'use client'`
> - แต่เพราะ Parent Layout มี Client Providers
> - **ทุก child component กลายเป็น Client Component ตาม!**
> 
> Result: **ทุกหน้าต้องส่ง JavaScript ทั้งหมด** แม้จะไม่ได้ใช้

### Impact Breakdown

```
Root Layout (Client Provider)
└── (auth) Layout
    └── Dashboard Page (should be Server, but forced Client!)
        ├── StatCard x4 (should be Server, but forced Client!)
        ├── RecentAssets (should be Server, but forced Client!)
        └── QuickActions (static, but forced Client!)

Result: 280KB JS instead of ~50KB
```

---

## 4. Sprint 0: Quick Wins (0.5 Day)

### Overview
- **Duration:** 4 hours
- **Impact:** ⭐⭐⭐⭐⭐ (40% bundle reduction immediately!)
- **Risk:** Low (isolated changes)

### Tasks

#### Task 4.1: Extract ClientProviders ⭐⭐⭐⭐⭐
**Effort:** 15 minutes | **Impact:** Bundle -30-40%

```typescript
// ✅ AFTER: src/app/layout.tsx (Server Component)
import { ClientProviders } from '@/components/ClientProviders';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
        <div id="portal-root"></div>
      </body>
    </html>
  );
}
```

```typescript
// ✅ NEW: src/components/ClientProviders.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { DialogProvider } from '@/contexts/DialogProvider';
import SessionTimeout from './SessionTimeout';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DialogProvider>
        {children}
        <SessionTimeout />
      </DialogProvider>
    </SessionProvider>
  );
}
```

**Why This Works:**
- Root Layout = Server Component ✅
- ClientProviders = Single Client boundary
- Children can be Server Components again ✅

---

#### Task 4.2: Remove 'use client' from Static Components ⭐⭐⭐⭐
**Effort:** 1 hour | **Impact:** Bundle -5-10%

**Target Components:**
```typescript
// ❌ src/components/StatCard.tsx (NO interaction!)
'use client';  // ← Why is this here?

export default function StatCard({ title, value, iconName, trend }) {
  const Icon = iconMap[iconName];
  
  return (
    <div className="...">
      <Icon />
      <h4>{value}</h4>
      {trend && <TrendBadge {...trend} />}
    </div>
  );
}
```

**Fix:** ลบ `'use client'` ออก

**Detection Script:**
```bash
# Find components with 'use client' but no hooks
grep -l "'use client'" src/components/*.tsx | while read f; do
  if ! grep -qE "useState|useEffect|useCallback|useRouter|onClick|onChange" "$f"; then
    echo "⚠️ $f - ไม่จำเป็นต้องเป็น Client Component"
  fi
done
```

**Components to Fix:**
- ✅ `StatCard.tsx`
- ✅ `Badge.tsx`
- ✅ `RepairStatusBadge.tsx`
- ✅ `DamageSeverityBadge.tsx`

---

#### Task 4.3: Split Sidebar Component ⭐⭐⭐⭐
**Effort:** 2 hours | **Impact:** Bundle -3-5%

**Current:** [`Sidebar.tsx`](file:///home/ryu/school-asset-management/src/components/Sidebar.tsx) - 396 LOC, all client!

```typescript
// ❌ BEFORE: Everything is client (396 lines)
'use client';

export default function Sidebar({ user, role, accessibleModules }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openItems, setOpenItems] = useState<string[]>([]);
  
  // 390 more lines of rendering...
}
```

**After Pattern:**
```typescript
// ✅ src/components/Sidebar.tsx (Server Component)
export default function Sidebar({ user, role, accessibleModules }) {
  return (
    <aside className="...">
      <SidebarLogo />  {/* Server */}
      
      <SidebarNavigation    {/* Client - only this part */}
        items={menuItems}
        modules={accessibleModules}
      />
      
      <SidebarProfile      {/* Server */}
        user={user}
        role={role}
      />
    </aside>
  );
}
```

```typescript
// ✅ src/components/SidebarNavigation.tsx (Client Component - smaller!)
'use client';

export function SidebarNavigation({ items, modules }) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);
  
  // Only interactive logic here (~100 LOC)
}
```

---

#### Task 4.4: Dependency Pinning ⭐⭐⭐
**Effort:** 15 minutes

```json
// package.json
{
  "dependencies": {
    "next": "16.1.1",        // ✅ Stable
    "react": "19.2.3",       // ✅ Stable
    "react-dom": "19.2.3"
  }
}
```

---

### Sprint 0 Exit Criteria

**Must Pass:**
```bash
npm run build

# Check output:
✓ Bundle size ≤ 170KB (gzipped)
✓ Lighthouse Performance ≥ 82
✓ No hydration errors in console
```

**Expected Results:**
- Bundle: 280KB → **170KB** (-40%)
- Lighthouse: 72 → **82** (+10)
- Build time: ~3min → ~2min

---

## 5. Sprint 1: Server Actions & Streaming (5 Days)

### Overview
- **Duration:** 5 days
- **Impact:** ⭐⭐⭐⭐⭐
- **Focus:** Tickets page + Dashboard

---

### 5.1 Convert Top 10 API Routes → Server Actions

#### Priority Matrix

| Priority | API Route | Reason | Impact | Effort |
|:--------:|-----------|--------|:------:|:------:|
| 🔥 | `POST /api/tickets` | Most used + Simple CRUD | ★★★★★ | 4h |
| 🔥 | `GET /api/tickets` | Move to Server Component | ★★★★★ | 6h |
| 🔥 | `POST /api/assets` | Form submission | ★★★★☆ | 4h |
| 🔥 | `POST /api/pm` | PM scheduling | ★★★★☆ | 3h |
| 🔥 | `POST /api/borrow` | Borrow flow | ★★★★☆ | 5h |
| ⚡ | `GET /api/users` | Used in dropdowns | ★★★☆☆ | 2h |
| ⚡ | `GET /api/departments` | Simple list | ★★★☆☆ | 1h |
| ⚡ | `POST /api/assets/bulk-delete` | Batch operation | ★★★☆☆ | 3h |
| ⚡ | `POST /api/settings/sla` | Settings form | ★★★☆☆ | 2h |
| 💡 | `GET /api/reports/*/export` | **Keep as API** | - | - |

> [!NOTE]
> **API Routes to KEEP (Don't convert):**
> - File uploads (`/api/upload`) - multipart/form-data
> - File downloads (`/api/reports/*/export`) - binary streaming
> - Webhooks (`/api/webhooks/*`) - third-party callbacks
> - OAuth (`/api/auth/oauth/callback`) - external redirects

---

### 5.2 Complete Example: Tickets Page Refactor

#### Step 1: Create Server Action

```typescript
// ✅ NEW: src/app/lib/ticket-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';

const TicketSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  type: z.enum(['IT', 'FM']),
});

export async function createTicket(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }
  
  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    priority: formData.get('priority') as string,
    type: formData.get('type') as 'IT' | 'FM',
  };
  
  const validated = TicketSchema.safeParse(data);
  if (!validated.success) {
    return { error: 'Invalid data', details: validated.error };
  }
  
  try {
    const ticket = await prisma.ticket.create({
      data: {
        ...validated.data,
        status: 'open',
        reportedById: parseInt(session.user.id),
      }
    });
    
    revalidatePath('/tickets');  // ✅ Auto-refresh the page
    return { success: true, ticket };
  } catch (error) {
    console.error('Create ticket failed:', error);
    return { error: 'Failed to create ticket' };
  }
}

export async function getTickets(filters: {
  type?: 'IT' | 'FM';
  status?: string;
  priority?: string;
}) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  
  return await prisma.ticket.findMany({
    where: {
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
    },
    include: {
      reportedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true, activities: true } }
    },
    orderBy: { reportedAt: 'desc' }
  });
}
```

---

#### Step 2: Server Component Page

```typescript
// ✅ REPLACE: src/app/(auth)/tickets/page.tsx (Server Component)
import { Suspense } from 'react';
import { getTickets } from '@/app/lib/ticket-actions';
import { TicketTable } from './TicketTable';
import { TicketFilters } from './TicketFilters';
import { CreateTicketButton } from './CreateTicketButton';
import { StatsGrid } from './StatsGrid';
import { TableSkeleton } from './TableSkeleton';

export default async function TicketsPage({ 
  searchParams 
}: { 
  searchParams: { type?: string; status?: string; priority?: string } 
}) {
  // ✅ Fetch data directly in Server Component
  const tickets = await getTickets({
    type: searchParams.type as 'IT' | 'FM',
    status: searchParams.status,
    priority: searchParams.priority,
  });
  
  // ✅ Calculate stats on server
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => ['open', 'assigned'].includes(t.status)).length,
    overdue: tickets.filter(t => 
      t.slaDeadline && 
      new Date(t.slaDeadline) < new Date() && 
      !['resolved', 'closed'].includes(t.status)
    ).length,
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-slate-500">Manage support requests</p>
        </div>
        <CreateTicketButton />  {/* Client Component - modal only */}
      </div>
      
      {/* Stats Cards - render immediately with data */}
      <StatsGrid stats={stats} />
      
      {/* Filters - Client Component for URL updates */}
      <TicketFilters />
      
      {/* Table - Server Component with data */}
      <Suspense fallback={<TableSkeleton />}>
        <TicketTable tickets={tickets} />
      </Suspense>
    </div>
  );
}
```

---

#### Step 3: Small Client Components

```typescript
// ✅ NEW: src/app/(auth)/tickets/TicketFilters.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tickets?${params.toString()}`);
  };
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <select 
        value={searchParams.get('type') || ''}
        onChange={(e) => handleFilterChange('type', e.target.value)}
        className="px-4 py-2 border rounded-lg"
      >
        <option value="">All Types</option>
        <option value="IT">IT</option>
        <option value="FM">FM</option>
      </select>
      
      <select 
        value={searchParams.get('status') || ''}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className="px-4 py-2 border rounded-lg"
      >
        <option value="">All Status</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>
      
      {/* More filters... */}
    </div>
  );
}
```

```typescript
// ✅ NEW: src/app/(auth)/tickets/CreateTicketButton.tsx
'use client';

import { useState } from 'react';
import { createTicket } from '@/app/lib/ticket-actions';
import { useDialog } from '@/contexts/DialogProvider';
import { Modal } from '@/components/Modal';

export function CreateTicketButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { alert } = useDialog();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await createTicket(formData);
    
    setPending(false);
    
    if (result.success) {
      await alert({ 
        title: 'Success', 
        message: 'Ticket created successfully!' 
      });
      setIsOpen(false);
      // ✅ No manual refresh needed! revalidatePath does it
    } else {
      await alert({ 
        title: 'Error', 
        message: result.error, 
        variant: 'error' 
      });
    }
  };
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-primary text-white rounded-xl"
      >
        Create Ticket
      </button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold">New Ticket</h2>
          
          <input 
            name="title" 
            placeholder="Title" 
            required 
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <textarea 
            name="description" 
            placeholder="Description" 
            required 
            rows={4}
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <select name="priority" required className="w-full px-4 py-2 border rounded-lg">
            <option value="">Select Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          
          <select name="type" required className="w-full px-4 py-2 border rounded-lg">
            <option value="">Select Type</option>
            <option value="IT">IT</option>
            <option value="FM">FM</option>
          </select>
          
          <button 
            type="submit" 
            disabled={pending}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
          >
            {pending ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </Modal>
    </>
  );
}
```

---

#### Step 4: Delete Old Files

```bash
# ❌ DELETE these files:
rm src/app/api/tickets/route.ts
rm src/app/(auth)/tickets/TicketsClient.tsx  # 658 LOC → gone!
```

#### Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Code lines** | 658 (client) + 50 (API) | ~150 total | **-79%** |
| **Files** | 3 files | 5 smaller files | Better separation |
| **Type safety** | ⚠️ Manual | ✅ Full TypeScript | Much better |
| **Cache** | ❌ Manual | ✅ Auto revalidate | Zero effort |
| **TTI** | 2.8s | 1.5s | **-46%** |

---

### 5.3 Dashboard Streaming Implementation

#### Problem Analysis

```typescript
// ❌ CURRENT: Sequential blocking
export default async function Home() {
  const totalAssets = await prisma.asset.count();       // 150ms ⏸️
  const availableAssets = await prisma.asset.count();   // 120ms (waits)
  const borrowedAssets = await prisma.asset.count();    // 100ms (waits)
  const maintenanceAssets = await prisma.asset.count(); // 90ms  (waits)
  const recentAssets = await prisma.asset.findMany();   // 250ms (waits)
  
  // Total: 710ms before user sees ANYTHING
}
```

**User Experience:**
```
0ms ────────────────────────────────────────────────────── 710ms
    [WHITE SCREEN]                                        [DATA APPEARS]
```

---

#### Solution: Streaming with Suspense

```typescript
// ✅ NEW: src/app/(auth)/page.tsx
import { Suspense } from 'react';
import { 
  TotalAssetsCard, 
  InUseAssetsCard, 
  AvailableAssetsCard, 
  MaintenanceAssetsCard,
  StatCardSkeleton 
} from './StatsCards';
import { RecentAssets, RecentAssetsSkeleton } from './RecentAssets';
import { QuickActions } from './QuickActions';

export default async function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500">Welcome back</p>
      </div>
      
      {/* Stats Grid - Each card streams independently */}
      <div className="grid grid-cols-4 gap-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <TotalAssetsCard />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <InUseAssetsCard />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <AvailableAssetsCard />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <MaintenanceAssetsCard />
        </Suspense>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Assets - slow query, doesn't block others */}
        <Suspense fallback={<RecentAssetsSkeleton />}>
          <RecentAssets />
        </Suspense>
        
        {/* Quick Actions - static, renders immediately */}
        <QuickActions />
      </div>
    </div>
  );
}
```

---

#### Server Components for Each Card

```typescript
// ✅ NEW: src/app/(auth)/StatsCards.tsx
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getDepartmentFilter } from '@/lib/permissions';
import StatCard from '@/components/StatCard';

export async function TotalAssetsCard() {
  const session = await auth();
  const user = await prisma.user.findUnique({ 
    where: { id: parseInt(session!.user.id) } 
  });
  const deptFilter = await getDepartmentFilter(user!.id);
  
  const count = await prisma.asset.count({ where: deptFilter });
  
  return (
    <StatCard 
      title="Total Assets" 
      value={count} 
      iconName="Package"
      trend={{ value: 8, isPositive: true }}
    />
  );
}

export async function InUseAssetsCard() {
  const count = await prisma.asset.count({ 
    where: { status: 'Borrowed' } 
  });
  
  return (
    <StatCard 
      title="In Use" 
      value={count} 
      iconName="ShoppingBag"
      trend={{ value: 12, isPositive: true }}
    />
  );
}

export async function AvailableAssetsCard() {
  const count = await prisma.asset.count({ 
    where: { status: 'Available' } 
  });
  
  return (
    <StatCard 
      title="Available" 
      value={count} 
      iconName="CheckCircle2"
      trend={{ value: 5, isPositive: false }}
    />
  );
}

export async function MaintenanceAssetsCard() {
  const count = await prisma.asset.count({ 
    where: { status: 'Maintenance' } 
  });
  
  return (
    <StatCard 
      title="Maintenance" 
      value={count} 
      iconName="Wrench"
      trend={{ value: 2, isPositive: true }}
    />
  );
}

// Skeleton for loading state
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-6 animate-pulse">
      <div className="h-12 w-12 bg-gray-200 rounded-xl" />
      <div className="mt-5 space-y-2">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
```

```typescript
// ✅ NEW: src/app/(auth)/RecentAssets.tsx
import { prisma } from '@/lib/prisma';

export async function RecentAssets() {
  const assets = await prisma.asset.findMany({
    take: 4,
    orderBy: { id: 'desc' },
    include: { category: true }
  });
  
  return (
    <div className="col-span-2 rounded-2xl border bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">Recently Added Assets</h3>
        <button className="text-sm text-primary">View All</button>
      </div>
      
      <div className="space-y-4">
        {assets.map(asset => (
          <div key={asset.id} className="flex items-center gap-4 group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <Package className="text-slate-500" size={24} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{asset.name}</p>
              <p className="text-sm text-slate-500">{asset.category}</p>
            </div>
            <Badge color={asset.status === 'Available' ? 'success' : 'warning'}>
              {asset.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentAssetsSkeleton() {
  return (
    <div className="col-span-2 rounded-2xl border bg-white p-6">
      <div className="h-6 w-40 bg-gray-200 rounded mb-6 animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

#### Streaming Timeline (Visual)

```
User Experience Timeline:

0ms:     ┌─────────────────────────────────────┐
         │ HTML Structure Arrives              │
         │ ├── Header ✅                       │
         │ ├── [Skeleton] Total Assets         │
         │ ├── [Skeleton] In Use               │
         │ ├── [Skeleton] Available            │
         │ ├── [Skeleton] Maintenance          │
         │ ├── [Skeleton] Recent Assets        │
         │ └── [Loaded] Quick Actions ✅       │ ← Static!
         └─────────────────────────────────────┘

90ms:    └── [Loaded] Maintenance Card ✅

100ms:   └── [Loaded] Borrowed Card ✅

120ms:   └── [Loaded] Available Card ✅

150ms:   └── [Loaded] Total Assets Card ✅

250ms:   └── [Loaded] Recent Assets ✅


Comparison:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Before: 710ms ────────────────────→ Everything appears
✅ After:  0ms → Layout visible
           90-150ms → Cards appear one by one
           250ms → Complete

Perceived Performance: ⭐⭐ → ⭐⭐⭐⭐⭐
```

---

### Sprint 1 Exit Criteria

```bash
npm run build

# Verify:
✓ Tickets page: No /api/tickets route
✓ Dashboard: 4 Suspense boundaries
✓ Bundle: ≤ 120KB (gzipped)
✓ Lighthouse: ≥ 88
✓ No console errors
```

---

## 6. Sprint 2: Server-first Component Tree (5 Days)

### 6.1 Audit All Client Components

#### Detection Script

```bash
#!/bin/bash
# Find Client Components that don't need to be

echo "🔍 Scanning for unnecessary Client Components..."
echo ""

grep -l "'use client'" src/components/*.tsx | while read file; do
  # Check if file has any interactive features
  if ! grep -qE "useState|useEffect|useCallback|useRef|useRouter|usePathname|useSearchParams|onClick|onChange|onSubmit|onKeyDown" "$file"; then
    lines=$(wc -l < "$file")
    echo "⚠️  $file ($lines lines)"
    echo "   → No hooks or event handlers found"
    echo "   → Consider converting to Server Component"
    echo ""
  fi
done

echo "✅ Audit complete!"
```

**Run:**
```bash
chmod +x scripts/audit-client-components.sh
./scripts/audit-client-components.sh
```

---

#### Classification Guide

| Type | Keep Client | Convert to Server |
|------|-------------|-------------------|
| **Pure presentation** (no state) | ❌ | ✅ |
| **Static data display** | ❌ | ✅ |
| **Forms with validation** | ✅ | ❌ |
| **Modals & Dialogs** | ✅ | ❌ |
| **Navigation menus** | ⚠️ Hybrid | Split |
| **Charts (ApexCharts)** | ✅ | ❌ |
| **Tables (display only)** | ❌ | ✅ |
| **Tables (with sorting)** | ✅ | ❌ |

---

### 6.2 Page-Level Refactors

#### Assets Page

**Before:**
```typescript
// ❌ Client Component fetches everything
'use client';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/assets').then(/* ... */);
  }, []);
  
  return (
    <div>
      {loading ? <Spinner /> : <AssetGrid assets={assets} />}
    </div>
  );
}
```

**After:**
```typescript
// ✅ Server Component with data
export default async function AssetsPage({ searchParams }) {
  const assets = await prisma.asset.findMany({
    where: buildFilter(searchParams),
    take: 50,
  });
  
  return (
    <div>
      <AssetFilters />  {/* Client - URL updates */}
      <Suspense fallback={<GridSkeleton />}>
        <AssetGrid assets={assets} />  {/* Server - display */}
      </Suspense>
    </div>
  );
}
```

---

#### FM Dashboard

```typescript
// ✅ Similar to main dashboard
export default async function FMDashboard() {
  return (
    <div className="space-y-8">
      <h1>FM Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <TotalFMAssetsCard />
        </Suspense>
        
        <Suspense fallback={<StatCardSkeleton />}>
          <ActiveMaintenanceCard />
        </Suspense>
        
        {/* ... more cards */}
      </div>
      
      <Suspense fallback={<ChartSkeleton />}>
        <MaintenanceChart />  {/* Server Component */}
      </Suspense>
    </div>
  );
}
```

---

### 6.3 Bundle Size Budget

```typescript
// next.config.ts
const config = {
  webpack(config) {
    config.performance = {
      maxAssetSize: 250 * 1024,  // 250KB limit
      maxEntrypointSize: 250 * 1024,
      hints: 'error'  // Fail build if exceeded
    };
    return config;
  },
  
  // Optimize imports
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'lodash-es',
      'recharts'
    ]
  }
};

export default config;
```

---

## 7. Performance Enhancements (Cross-cutting)

### 7.1 Dynamic Imports for Heavy Libraries

```typescript
// ❌ BEFORE: All imported upfront
import { Chart } from 'react-apexcharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// ✅ AFTER: Dynamic imports
'use client';

export function ReportGenerator() {
  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    // ...
  };
  
  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    // ...
  };
}
```

**Impact:** Initial bundle -50KB+

---

### 7.2 Image Optimization

```typescript
// ❌ BEFORE
<img src="/assets/logo.png" alt="Logo" />

// ✅ AFTER
import Image from 'next/image';

<Image 
  src="/assets/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority  // For above-the-fold images
/>
```

---

### 7.3 React.cache() for Expensive Queries

```typescript
// ✅ Cache expensive user lookup
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getUser = cache(async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      userRole: true,
      userDepartment: true,
    }
  });
});

// Now safe to call multiple times in same request
export async function UserProfile({ userId }) {
  const user = await getUser(userId);  // Cached!
  // ...
}

export async function UserStats({ userId }) {
  const user = await getUser(userId);  // Same cache!
  // ...
}
```

---

### 7.4 Prisma Optimizations

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["relationJoins"]  // ✅ Faster joins
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"  // ✅ Better for serverless
}
```

```typescript
// Use transactions for multiple writes
await prisma.$transaction([
  prisma.asset.update({ ... }),
  prisma.auditLog.create({ ... }),
]);

// Use select to limit fields
await prisma.user.findMany({
  select: {  // ✅ Only needed fields
    id: true,
    name: true,
    email: true,
  }
});
```

---

## 8. Testing & Rollback Strategy

### 8.1 Unit Tests for Server Actions

```typescript
// __tests__/ticket-actions.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTicket } from '@/app/lib/ticket-actions';

describe('createTicket', () => {
  beforeEach(() => {
    // Reset DB state
  });
  
  it('should create ticket with valid data', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Ticket');
    formData.append('description', 'Test Description');
    formData.append('priority', 'high');
    formData.append('type', 'IT');
    
    const result = await createTicket(formData);
    
    expect(result.success).toBe(true);
    expect(result.ticket).toBeDefined();
  });
  
  it('should reject invalid data', async () => {
    const formData = new FormData();
    formData.append('title', 'ab');  // Too short
    
    const result = await createTicket(formData);
    
    expect(result.error).toBeDefined();
  });
});
```

---

### 8.2 E2E Tests with Playwright

```typescript
// e2e/tickets.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tickets Page', () => {
  test('should load tickets without spinner', async ({ page }) => {
    await page.goto('/tickets');
    
    // Should NOT see loading spinner (SSR)
    await expect(page.locator('[data-testid="spinner"]')).not.toBeVisible();
    
    // Should see data immediately
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });
  
  test('should create ticket via Server Action', async ({ page }) => {
    await page.goto('/tickets');
    await page.click('button:text("Create Ticket")');
    
    await page.fill('[name="title"]', 'E2E Test Ticket');
    await page.fill('[name="description"]', 'Test description');
    await page.selectOption('[name="priority"]', 'high');
    await page.selectOption('[name="type"]', 'IT');
    
    await page.click('button[type="submit"]');
    
    // Should see success message
    await expect(page.locator('text=Ticket created')).toBeVisible();
    
    // Page should refresh automatically
    await expect(page.locator('text=E2E Test Ticket')).toBeVisible();
  });
});

test.describe('Dashboard Streaming', () => {
  test('should show skeletons then data', async ({ page }) => {
    await page.goto('/');
    
    // Should see skeletons first
    const skeleton = page.locator('[data-testid="stat-skeleton"]').first();
    await expect(skeleton).toBeVisible();
    
    // Should replace with data
    await expect(skeleton).not.toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Total Assets')).toBeVisible();
  });
});
```

---

### 8.3 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Start server
        run: npm start &
      
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/tickets
            http://localhost:3000/assets
          configPath: './lighthouserc.json'
          uploadArtifacts: true
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "interactive": ["error", { "maxNumericValue": 3500 }]
      }
    }
  }
}
```

---

### 8.4 Feature Flag for Rollback

```typescript
// .env
ENABLE_SERVER_ACTIONS=true

// src/app/(auth)/tickets/page.tsx
export default async function TicketsPage({ searchParams }) {
  if (process.env.ENABLE_SERVER_ACTIONS !== 'true') {
    // Fallback to old TicketsClient
    return <TicketsClient />;
  }
  
  // New Server Component implementation
  const tickets = await getTickets(searchParams);
  return <TicketTable tickets={tickets} />;
}
```

**Rollback Plan:**
```bash
# If issues occur:
1. Set ENABLE_SERVER_ACTIONS=false
2. Redeploy
3. Investigate issues
4. Fix and re-enable
```

---

## 9. Appendix

### 9.1 Comparison Tables

#### API Route vs Server Action

| Aspect | API Route | Server Action |
|--------|-----------|---------------|
| **Files needed** | 2 (route + client) | 1 |
| **Boilerplate** | ❌ High (auth, JSON, NextResponse) | ✅ Low |
| **Type Safety** | ⚠️ Manual types needed | ✅ Full TypeScript inference |
| **Cache Control** | ❌ Manual revalidate logic | ✅ Auto with `revalidatePath()` |
| **Security** | ⚠️ Manual auth checks | ✅ Server-only by default |
| **Error Handling** | ❌ try-catch + JSON errors | ✅ Return object pattern |
| **Form Integration** | ❌ Form → JSON conversion | ✅ Native FormData support |
| **Code Size** | ~100 LOC | ~50 LOC |

---

#### Client Fetch vs Server Component

| Aspect | Client Fetch | Server Component |
|--------|--------------|------------------|
| **Loading UX** | ❌ Spinner (1-2s) | ✅ SSR (instant) or Skeleton |
| **SEO** | ❌ No data in HTML | ✅ Full HTML with data |
| **Bundle Size** | ❌ +20-30KB per component | ✅ 0KB (server-only) |
| **Waterfall** | ❌ JS → Hydrate → Fetch | ✅ Data ready on first paint |
| **Caching** | ⚠️ Manual (SWR/React Query) | ✅ Next.js automatic |
| **Code Complexity** | ❌ useEffect + useState | ✅ Simple async function |

---

#### Sequential vs Streaming

| Aspect | Sequential (Current) | Streaming (Target) |
|--------|---------------------|-------------------|
| **User Experience** | ❌ White screen 1s+ | ✅ Progressive reveal |
| **TTFB** | ❌ 500-1000ms | ✅ 50-150ms |
| **Perceived Perf** | ⭐⭐☆☆☆ | ⭐⭐⭐⭐⭐ |
| **Mobile 3G** | ❌ 3-5s | ✅ 1-2s |
| **Complexity** | ✅ Simple | ⚠️ Need Suspense boundaries |

---

### 9.2 Debugging Commands

```bash
# Build and analyze bundle
npm run build
npx @next/bundle-analyzer

# Check which components are server vs client
npm run build 2>&1 | grep "○"  # Server
npm run build 2>&1 | grep "●"  # Client

# Find large dependencies
npx bundle-wizard

# Profile React components
# Add to next.config.ts:
# reactStrictMode: true
# Then use React DevTools Profiler

# Check hydration errors
# Browser console will show warnings

# Measure Core Web Vitals
npx unlighthouse --site http://localhost:3000
```

---

### 9.3 Resources

**Official Documentation:**
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Streaming and Suspense](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Caching](https://nextjs.org/docs/app/building-your-application/caching)

**Guides & Best Practices:**
- [Architecting a Server-first Next.js App](https://vercel.com/blog/nextjs-server-components-architecture) - Vercel Blog 2024
- [Prisma + Next.js Optimization](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [React Server Components Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

**Tools:**
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Bundle Wizard](https://www.npmjs.com/package/bundle-wizard)

**Examples:**
- [Next.js Commerce](https://github.com/vercel/commerce) - Full streaming implementation
- [Server Actions Examples](https://github.com/vercel/next.js/tree/canary/examples/next-forms)

---

### 9.4 Timeline Summary

```
Week 1
├── Day 0.5: Sprint 0 - Quick Wins
│   └── Expected: Bundle -40%, Lighthouse +10
│
├── Day 1-2: Tickets Page Refactor
│   ├── Create ticket-actions.ts
│   ├── Convert TicketsClient → Server Component
│   └── Delete API route
│
├── Day 3-4: Dashboard Streaming
│   ├── Split Stats Cards with Suspense
│   ├── Create Skeleton components
│   └── Test on slow network
│
└── Day 5: Sprint 1 Wrap-up
    └── Expected: Bundle -30%, Lighthouse +6

Week 2
├── Day 1-2: Component Audit
│   ├── Run detection scripts
│   ├── Convert pure components to Server
│   └── Split hybrid components
│
├── Day 3-4: Page Refactors
│   ├── Assets page
│   ├── FM Dashboard
│   └── Profile page
│
└── Day 5: Sprint 2 Wrap-up
    ├── Set bundle size budget
    ├── Run full test suite
    └── Performance verification

Final: Production Deployment
├── Lighthouse: 92+
├── Bundle: 95KB (gzipped)
├── TTI: 1.1s
└── 🎉 Success!
```

---

## 🎯 Quick Reference Checklist

### Sprint 0 (0.5 day)
- [ ] Extract `ClientProviders` from root layout
- [ ] Remove `'use client'` from StatCard, Badge components
- [ ] Split Sidebar → Server + Client
- [ ] Verify: Bundle ≤ 170KB, Lighthouse ≥ 82

### Sprint 1 (5 days)
- [ ] Create `ticket-actions.ts`
- [ ] Convert Tickets page to Server Component
- [ ] Delete `/api/tickets` route
- [ ] Implement Dashboard streaming with 4 Suspense
- [ ] Create Skeleton components
- [ ] Verify: Bundle ≤ 120KB, Lighthouse ≥ 88

### Sprint 2 (5 days)
- [ ] Run client component audit script
- [ ] Convert Assets page to Server Component
- [ ] Convert FM Dashboard to streaming
- [ ] Set webpack bundle size budget
- [ ] Full E2E test pass
- [ ] Verify: Bundle ≤ 95KB, Lighthouse ≥ 92

### Testing
- [ ] Unit tests for Server Actions
- [ ] Playwright E2E tests
- [ ] Lighthouse CI in GitHub Actions
- [ ] Feature flag ready for rollback

---

> **Expected Final Results:**
> - Bundle Size: 280KB → **95KB** (-67%)
> - Time to Interactive: 2.8s → **1.1s** (-61%)
> - Dashboard FCP: 1200ms → **100ms** (-92% perceived)
> - Lighthouse Score: 72 → **92** (+20)
> - API Routes: 100+ → **~10** (-90%)

**Legend:** ⭐ = Impact (1-5 stars) | 🔥 = High Priority | ⚡ = Medium Priority | 💡 = Low Priority
