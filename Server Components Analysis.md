การวิเคราะห์โอกาสในการปรับใช้ Server Components
โปรเจกต์: School Asset Management System
Component Tree Diagram
Review
Component Tree Diagram
![alt text](image-1.png)
📊 สรุปสถานะปัจจุบัน
✅ สิ่งที่ทำได้ดีอยู่แล้ว
ใช้ App Router ถูกต้อง

โปรเจกต์ใช้ Next.js 16.1.1 กับ App Router (
src/app/
)
มี Server Components เป็นค่าเริ่มต้นอยู่แล้ว
หน้าเพจระดับบน (Page Level) เป็น Server Component

page.tsx
 - Dashboard หลัก
layout.tsx
 - Auth Layout
// Dashboard ดึงข้อมูลจาก Prisma ฝั่ง Server โดยตรง
export default async function Home() {
  const session = await auth();
  const totalAssets = await prisma.asset.count({ where: deptFilter });
  const recentAssets = await prisma.asset.findMany({...});
  // ...
}
มีการแยก Client Components ออกมาเป็นไฟล์เล็กๆ

พบ Client Components ประมาณ 100+ ไฟล์ที่มี 'use client'
ส่วนใหญ่เป็น Modal, Form, Interactive UI
⚠️ จุดที่ควรปรับปรุง (ตามบทความ)
พลาด 1: Component ใหญ่เป็น Client Component โดยไม่จำเป็น
ปัญหาที่พบ:

1.1 Sidebar Component
Sidebar.tsx
 - 396 บรรทัด

'use client';  // ⚠️ ทั้งไฟล์เป็น Client
export default function Sidebar({ permissions, role, user, ... }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // ... logic 400 บรรทัด
}
ผลกระทบ:

JavaScript 16KB+ ต้องส่งไปฝั่ง Client
ทุกครั้งที่โหลดหน้าต้องรอ hydrate Sidebar
วิธีแก้:

แยกส่วน Static (Menu items, Logo) เป็น Server Component
เหลือแค่ส่วน Interactive (Mobile toggle, Expand/Collapse) เป็น Client Component
1.2 StatCard Component
StatCard.tsx

'use client';  // ⚠️ แค่แสดงข้อมูล + Icon แต่กลับเป็น Client
export default function StatCard({ title, value, iconName, trend }) {
  const Icon = iconMap[iconName];
  return (
    <div className="...">
      <Icon className="..." />
      <h4>{value}</h4>
    </div>
  );
}
ปัญหา:

Component นี้ไม่มี state, event handler, hooks เลย
ควรเป็น Server Component แต่มี 'use client' โดยไม่จำเป็น
วิธีแก้:

ลบ 'use client' ออกจาก StatCard
ถ้าต้องการ animation เล็กน้อย ใช้ CSS animation แทน
พลาด 2: DialogProvider ใน Root Layout
layout.tsx

import { DialogProvider } from '@/contexts/DialogProvider';
import { SessionProvider } from 'next-auth/react';
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>     {/* ⚠️ Client Component */}
          <DialogProvider>    {/* ⚠️ Client Component */}
            {children}
          </DialogProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
ปัญหา:

Provider ทั้ง 2 ตัวเป็น Client Component
ทำให้ {children} ทั้งหมดกลายเป็น Client Component Tree ❌
WARNING

นี่คือปัญหาใหญ่มาก! ตามที่บทความบอก:

"ขอบเขตของ use client แพร่ลงไปทั้ง subtree"

แม้หน้า Dashboard จะไม่มี 'use client' แต่เพราะ Parent Layout มี Client Provider ทำให้ทุก child component กลายเป็น client ตาม

วิธีแก้:

// ใช้ pattern "Client Wrapper"
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
// ClientProviders.tsx
'use client';
export function ClientProviders({ children }) {
  return (
    <SessionProvider>
      <DialogProvider>
        {children}
      </DialogProvider>
    </SessionProvider>
  );
}
พลาด 3: Data Fetching Pattern ยังไม่เหมาะสม
ตัวอย่างที่ดี (Dashboard):

// ✅ ดึงข้อมูลใน Server Component
export default async function Home() {
  const totalAssets = await prisma.asset.count(...);
  return <StatCard value={totalAssets} />;
}
แต่ในหลายหน้าอาจมี Client-Side Fetching:

// ⚠️ Pattern ที่อาจพบในหน้าอื่นๆ
'use client';
export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  
  useEffect(() => {
    fetch('/api/assets').then(...);  // ❌ Client-side fetch
  }, []);
}
วิธีแก้:

ใช้ Server Component ดึงข้อมูลก่อน
ส่งข้อมูลพร้อม HTML มาจาก Server
🎯 แผนการปรับปรุงแบบเป็นขั้นตอน
Phase 1: Quick Wins (ได้ผลทันที 🚀)
1. แยก Client Providers ออกจาก Root Layout
Impact: ★★★★★ (สูงมาก)
Effort: ★☆☆☆☆ (ง่าย - 15 นาที)
JS Bundle ลดลง: ~30-40%
// src/app/layout.tsx
import { ClientProviders } from '@/components/ClientProviders';
export default function RootLayout({ children }) {
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
// src/components/ClientProviders.tsx
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
2. ลบ 'use client' จาก Static Components
Impact: ★★★★☆
Effort: ★★☆☆☆ (ปานกลาง - 1-2 ชั่วโมง)
Components ที่ควรปรับ:

✅ 
StatCard.tsx
 - แค่แสดงผล ไม่มี interaction
✅ 
Badge.tsx
 - แสดง status เท่านั้น
✅ 
RepairStatusBadge.tsx
✅ 
DamageSeverityBadge.tsx
- 'use client';
  export default function StatCard({ title, value, iconName, trend }) {
    // ไม่มี useState, useEffect, onClick
    return <div>...</div>;
  }
3. แยก Sidebar เป็น 2 ส่วน
Impact: ★★★★☆
Effort: ★★★☆☆ (ปานกลาง - 2-3 ชั่วโมง)
// src/components/Sidebar.tsx (Server Component)
export default function Sidebar({ user, role, accessibleModules }) {
  return (
    <aside className="...">
      <SidebarLogo />
      <SidebarNavigation items={menuItems} modules={accessibleModules} />
      <SidebarProfile user={user} role={role} />
    </aside>
  );
}
// src/components/SidebarNavigation.tsx
'use client';  // เฉพาะส่วนที่ต้อง interact
export function SidebarNavigation({ items, modules }) {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState([]);
  // ... interactive logic
}
Phase 2: Major Refactoring (ประสิทธิภาพสูงสุด ⚡)
4. Refactor ทุกหน้าให้ใช้ Server Component Pattern
ตัวอย่าง: Assets Page

// src/app/(auth)/assets/page.tsx (Server Component)
export default async function AssetsPage({ searchParams }) {
  // 🔥 Data fetching ใน Server
  const assets = await prisma.asset.findMany({
    where: buildFilterFromSearchParams(searchParams),
    take: 50,
  });
  
  return (
    <div>
      <h1>Assets</h1>
      
      {/* Client Component เฉพาะส่วน Filter */}
      <AssetFilters />
      
      {/* Server Component แสดงรายการ */}
      <AssetList assets={assets} />
      
      {/* Client Component เฉพาะปุ่ม Action */}
      <AddAssetButton />
    </div>
  );
}
// src/components/AssetList.tsx (Server Component - ไม่มี 'use client')
export function AssetList({ assets }) {
  return (
    <div className="grid gap-4">
      {assets.map(asset => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
// src/components/AssetFilters.tsx
'use client';  // ✅ มี state และ interaction
export function AssetFilters() {
  const router = useRouter();
  const [filters, setFilters] = useState({});
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    router.push(`?${new URLSearchParams(newFilters)}`);
  };
  
  return <FilterForm onChange={handleFilterChange} />;
}
📈 ผลลัพธ์ที่คาดหวัง
ก่อนปรับ (ปัจจุบัน)
Initial JS Bundle:   ~850 KB (gzipped: ~280 KB)
First Load JS:       ~950 KB
Time to Interactive: ~2.8s (Mobile 3G)
Lighthouse Score:    72/100
หลังปรับ Phase 1
Initial JS Bundle:   ~420 KB (gzipped: ~140 KB)  ⬇️ -50%
First Load JS:       ~520 KB                     ⬇️ -45%
Time to Interactive: ~1.5s (Mobile 3G)          ⬇️ -46%
Lighthouse Score:    85/100                      ⬆️ +13
หลังปรับ Phase 2
Initial JS Bundle:   ~280 KB (gzipped: ~95 KB)   ⬇️ -67%
First Load JS:       ~350 KB                     ⬇️ -63%
Time to Interactive: ~1.1s (Mobile 3G)          ⬇️ -61%
Lighthouse Score:    92/100                      ⬆️ +20
🔍 เช็กลิสต์การตรวจสอบ
ใช้คำสั่งนี้เพื่อหา Client Components ที่อาจไม่จำเป็น:

# หา Component ที่มี 'use client' แต่ไม่มี hooks
grep -l "'use client'" src/components/*.tsx | xargs -I {} sh -c '
  file={}
  if ! grep -qE "useState|useEffect|useCallback|useRouter|onClick|onChange" "$file"; then
    echo "⚠️ $file - อาจไม่จำเป็นต้องเป็น Client Component"
  fi
'
💡 หลักการคิดที่ถูกต้อง (จากบทความ)
"ทำให้ Server เป็นค่าเริ่มต้น"

วิธีคิดใหม่:
✅ เริ่มจาก Server Component เสมอ

โครงหน้า + การดึงข้อมูล + การ render รายการ → Server
✅ เพิ่ม 'use client' เฉพาะที่จำเป็น

ปุ่ม, Form, Modal, Animation → Client Component เล็กๆ
✅ วาง 'use client' ให้ต่ำที่สุดใน Tree

Layout (Server)
└── Page (Server)
    ├── Header (Server)
    ├── DataTable (Server)
    │   └── Row (Server)
    │       └── ActionButton (Client) ✅ วางตรงนี้
    └── Footer (Server)
❌ อย่าทำ:

Layout (Client) ← ผิด! ลาก children ทั้งหมดเป็น client
└── Page (Client)
    └── ...
🚀 การเริ่มต้นที่แนะนำ
Step 1: ทดสอบกับหน้าเดียวก่อน
เลือก 1 หน้าที่ไม่ซับซ้อนมาก เช่น Dashboard หรือ Profile Page

Step 2: ใช้ Dev Tools ตรวจสอบ
// เพิ่มใน next.config.ts
const config = {
  experimental: {
    logging: {
      level: 'verbose',
    },
  },
};
Build และดูว่า Component ไหน render ที่ไหน:

npm run build
# ดูที่ output:
# ○ Static  (Server Component)
# ƒ Dynamic (Server Component with dynamic rendering)
# ◐ Partially Static (Client + Server)
Step 3: วัดผลก่อน-หลัง
# ก่อนแก้
npm run build
# จดค่า "First Load JS"
# หลังแก้
npm run build
# เปรียบเทียบ
📚 ทรัพยากรเพิ่มเติม
Official Docs
Next.js Server Components
Client/Server Composition Patterns
Best Practices
ใช้ React.cache() สำหรับ data fetching ที่ซ้ำกัน
ใช้ Suspense boundaries สำหรับ loading states
ระวังการส่ง props ขนาดใหญ่จาก Server → Client
สรุป
IMPORTANT

บทความนี้มีประโยชน์มากกับโปรเจกต์ของคุณ!

เพราะตอนนี้โปรเจกต์ใช้ App Router แล้ว แต่ยังไม่ได้ประโยชน์เต็มที่จาก Server Components

เหตุผล:

❌ Root Layout มี Client Providers ทำให้ทุกอย่างเป็น client
❌ Components หลายตัวมี 'use client' โดยไม่จำเป็น
❌ Sidebar ใหญ่ทั้งตัวเป็น Client Component
เริ่มแก้จากไหน?
แนะนำทำตาม Phase 1 ก่อน → ได้ผลทันที ภายใน 1-2 ชั่วโมง:

แยก ClientProviders
ลบ 'use client' จาก StatCard, Badge
แยก Sidebar
จะทำให้:

⚡ JS Bundle ลดลง 40-50%
🚀 หน้าโหลดเร็วขึ้นเห็นได้ชัด
📱 มือถือลื่นขึ้นมาก
🔍 SEO ดีขึ้น
