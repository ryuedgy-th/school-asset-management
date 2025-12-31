import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Database Verification\n');

  // Users
  const users = await prisma.user.findMany({
    select: { email: true, name: true, userRole: { select: { name: true } } }
  });
  console.log('👥 Users:');
  users.forEach(u => {
    const roleName = u.userRole?.name || 'No role';
    console.log(`  - ${u.email} (${roleName})`);
  });

  // Modules
  const modules = await prisma.module.count();
  console.log(`\n📦 Total Modules: ${modules}`);

  // Stationary
  const stationaryModule = await prisma.module.findUnique({
    where: { code: 'stationary' },
    include: { permissions: true }
  });
  console.log(`\n📋 Stationary Module:`);
  console.log(`  - Permissions: ${stationaryModule?.permissions.length || 0}`);

  const [categories, items, stock, vendors, requisitions] = await Promise.all([
    prisma.stationaryCategory.count(),
    prisma.stationaryItem.count(),
    prisma.stationaryStock.count(),
    prisma.stationaryVendor.count(),
    prisma.stationaryRequisition.count(),
  ]);

  console.log(`  - Categories: ${categories}`);
  console.log(`  - Items: ${items}`);
  console.log(`  - Stock Records: ${stock}`);
  console.log(`  - Vendors: ${vendors}`);
  console.log(`  - Requisitions: ${requisitions}`);

  // FM Assets
  const [fmAssets, fmCategories] = await Promise.all([
    prisma.fMAsset.count(),
    prisma.fMAssetCategory.count(),
  ]);
  console.log(`\n🏢 FM Module:`);
  console.log(`  - Assets: ${fmAssets}`);
  console.log(`  - Categories: ${fmCategories}`);

  await prisma.$disconnect();

  console.log('\n✅ Database is ready for use!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@school.com');
  console.log('   Password: admin123');
}

verify().catch(console.error);
