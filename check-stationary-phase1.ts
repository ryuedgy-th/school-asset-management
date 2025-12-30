import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPhase1() {
    console.log('🔍 Phase 1 Verification\n');
    console.log('='.repeat(50));

    // 1. Check Stationary Module
    console.log('\n📦 1. Stationary Module:');
    const module = await prisma.module.findUnique({
        where: { code: 'stationary' },
        include: { permissions: true }
    });

    if (module) {
        console.log('  ✅ Module exists');
        console.log('  - ID:', module.id);
        console.log('  - Name:', module.name);
        console.log('  - Category:', module.category);
        console.log('  - Route:', module.routePath);
        console.log('  - Permissions:', module.permissions.length);
        console.log('\n  📝 Permissions:');
        module.permissions.forEach(p => {
            console.log(`    - ${p.action}: ${p.name}`);
        });
    } else {
        console.log('  ❌ Module not found');
    }

    // 2. Check Categories
    console.log('\n\n📂 2. Stationary Categories:');
    const categories = await prisma.stationaryCategory.findMany({
        orderBy: { sortOrder: 'asc' }
    });
    console.log(`  ✅ ${categories.length} categories`);
    categories.forEach(c => {
        console.log(`    - ${c.code}: ${c.name}`);
    });

    // 3. Check Vendors
    console.log('\n\n🏪 3. Stationary Vendors:');
    const vendors = await prisma.stationaryVendor.findMany();
    console.log(`  ✅ ${vendors.length} vendors`);
    vendors.forEach(v => {
        console.log(`    - ${v.vendorCode}: ${v.name} (${v.rating}⭐)`);
    });

    // 4. Check Items
    console.log('\n\n📦 4. Stationary Items:');
    const items = await prisma.stationaryItem.findMany({
        include: { category: true }
    });
    console.log(`  ✅ ${items.length} items`);
    items.forEach(item => {
        console.log(`    - ${item.itemCode}: ${item.name} (${item.category.name})`);
        console.log(`      UOM: ${item.uom}, Min: ${item.minStockLevel}, Cost: ${item.unitCost} THB`);
    });

    // 5. Check Locations
    console.log('\n\n📍 5. Storage Locations:');
    const locations = await prisma.stationaryLocation.findMany({
        include: { department: true }
    });
    console.log(`  ✅ ${locations.length} locations`);
    locations.forEach(loc => {
        console.log(`    - ${loc.code}: ${loc.name}`);
        console.log(`      Type: ${loc.type}, Department: ${loc.department?.name || 'N/A'}`);
    });

    // 6. Check Stock
    console.log('\n\n📊 6. Stock Records:');
    const stock = await prisma.stationaryStock.findMany({
        include: {
            item: true,
            location: true
        }
    });
    console.log(`  ✅ ${stock.length} stock records`);
    let totalValue = 0;
    stock.forEach(s => {
        const value = Number(s.totalValue || 0);
        totalValue += value;
        console.log(`    - ${s.item.name} @ ${s.location.name}: ${s.quantity} ${s.item.uom} (${value.toFixed(2)} THB)`);
    });
    console.log(`\n  💰 Total Inventory Value: ${totalValue.toFixed(2)} THB`);

    // 7. Check Budgets
    console.log('\n\n💰 7. Department Budgets:');
    const budgets = await prisma.departmentBudget.findMany({
        include: { department: true },
        where: { fiscalYear: 2025 }
    });
    console.log(`  ✅ ${budgets.length} budgets for FY2025`);
    budgets.forEach(b => {
        console.log(`    - ${b.department.name}:`);
        console.log(`      Allocated: ${Number(b.allocatedAmount).toFixed(2)} THB`);
        console.log(`      Available: ${Number(b.availableAmount).toFixed(2)} THB`);
        console.log(`      Alert at: ${b.alertThreshold}%`);
    });

    // Summary
    console.log('\n\n' + '='.repeat(50));
    console.log('📋 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`✅ Module: ${module ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Permissions: ${module?.permissions.length || 0}/9`);
    console.log(`✅ Categories: ${categories.length}/5`);
    console.log(`✅ Vendors: ${vendors.length}/2`);
    console.log(`✅ Items: ${items.length}/5`);
    console.log(`✅ Locations: ${locations.length}/2`);
    console.log(`✅ Stock Records: ${stock.length}/7`);
    console.log(`✅ Budgets: ${budgets.length}/2`);
    console.log('='.repeat(50));

    const allPass =
        module !== null &&
        module.permissions.length === 9 &&
        categories.length === 5 &&
        vendors.length === 2 &&
        items.length === 5 &&
        locations.length === 2 &&
        stock.length === 7 &&
        budgets.length === 2;

    if (allPass) {
        console.log('\n🎉 Phase 1: ALL CHECKS PASSED! Ready for Phase 2.');
    } else {
        console.log('\n⚠️  Phase 1: Some checks failed. Please review above.');
    }

    await prisma.$disconnect();
}

checkPhase1().catch(console.error);
