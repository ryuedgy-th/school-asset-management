const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive seed...');

    // ============================================================
    // 1. DEPARTMENTS
    // ============================================================
    console.log('\n📁 Creating Departments...');
    const itDept = await prisma.department.upsert({
        where: { code: 'IT' },
        update: {},
        create: {
            name: 'IT Department',
            code: 'IT',
            isActive: true,
        },
    });

    const fmDept = await prisma.department.upsert({
        where: { code: 'FM' },
        update: {},
        create: {
            name: 'Facilities Management',
            code: 'FM',
            isActive: true,
        },
    });

    const maintenanceDept = await prisma.department.upsert({
        where: { code: 'MAINT' },
        update: {},
        create: {
            name: 'Maintenance Department',
            code: 'MAINT',
            isActive: true,
        },
    });

    console.log('✅ Departments created');

    // ============================================================
    // 2. ROLES
    // ============================================================
    console.log('\n👥 Creating Roles...');
    const adminRole = await prisma.role.upsert({
        where: {
            name_departmentId: {
                name: 'Admin',
                departmentId: itDept.id
            }
        },
        update: {},
        create: {
            name: 'Admin',
            departmentId: itDept.id,
            permissions: JSON.stringify({
                tickets: { view_all: true, create: true, update: true, delete: true, assign: true },
                assets: { view_all: true, create: true, update: true, delete: true },
                inspections: { view_all: true, create: true, update: true, delete: true }
            }),
            scope: 'GLOBAL',
            isActive: true,
        },
    });

    const technicianRole = await prisma.role.upsert({
        where: {
            name_departmentId: {
                name: 'Technician',
                departmentId: maintenanceDept.id
            }
        },
        update: {},
        create: {
            name: 'Technician',
            departmentId: maintenanceDept.id,
            permissions: JSON.stringify({
                tickets: { view_all: true, create: true, update: true },
                assets: { view_all: true }
            }),
            scope: 'DEPARTMENT',
            isActive: true,
        },
    });

    const inspectorRole = await prisma.role.upsert({
        where: {
            name_departmentId: {
                name: 'Inspector',
                departmentId: itDept.id
            }
        },
        update: {},
        create: {
            name: 'Inspector',
            departmentId: itDept.id,
            permissions: JSON.stringify({
                inspections: { view_all: true, create: true, update: true },
                assets: { view_all: true }
            }),
            scope: 'DEPARTMENT',
            isActive: true,
        },
    });

    console.log('✅ Roles created');

    // ============================================================
    // 3. USERS
    // ============================================================
    console.log('\n👤 Creating Users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@school.com' },
        update: {
            role: 'admin',
            roleId: adminRole.id,
        },
        create: {
            email: 'admin@school.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'admin',
            roleId: adminRole.id,
            departmentId: itDept.id,
        },
    });

    const inspector1 = await prisma.user.upsert({
        where: { email: 'inspector1@school.com' },
        update: {},
        create: {
            email: 'inspector1@school.com',
            name: 'Somchai Inspector',
            password: hashedPassword,
            role: 'user',
            roleId: inspectorRole.id,
            departmentId: itDept.id,
        },
    });

    const inspector2 = await prisma.user.upsert({
        where: { email: 'inspector2@school.com' },
        update: {},
        create: {
            email: 'inspector2@school.com',
            name: 'Siriwan Inspector',
            password: hashedPassword,
            role: 'user',
            roleId: inspectorRole.id,
            departmentId: itDept.id,
        },
    });

    const technician1 = await prisma.user.upsert({
        where: { email: 'tech1@school.com' },
        update: {},
        create: {
            email: 'tech1@school.com',
            name: 'Manop Technician',
            password: hashedPassword,
            role: 'user',
            roleId: technicianRole.id,
            departmentId: maintenanceDept.id,
        },
    });

    const technician2 = await prisma.user.upsert({
        where: { email: 'tech2@school.com' },
        update: {},
        create: {
            email: 'tech2@school.com',
            name: 'Wichai Technician',
            password: hashedPassword,
            role: 'user',
            roleId: technicianRole.id,
            departmentId: maintenanceDept.id,
        },
    });

    console.log('✅ Users created');

    // ============================================================
    // 4. ASSETS (using legacy Asset model)
    // ============================================================
    console.log('\n💻 Creating Assets...');
    const laptop1 = await prisma.asset.create({
        data: {
            name: 'MacBook Pro 14" (2023)',
            category: 'Laptop',
            assetCode: 'LAP-001',
            brand: 'Apple',
            model: 'MacBook Pro 14"',
            serialNumber: 'SN-MBP-001',
            purchaseDate: new Date('2023-01-15'),
            cost: 65000,
            location: 'Building 1, Floor 1, Room 101',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    const laptop2 = await prisma.asset.create({
        data: {
            name: 'Dell Latitude 5420',
            category: 'Laptop',
            assetCode: 'LAP-002',
            brand: 'Dell',
            model: 'Latitude 5420',
            serialNumber: 'SN-DELL-002',
            purchaseDate: new Date('2023-03-20'),
            cost: 35000,
            location: 'Building 1, Floor 1, Computer Lab',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    const laptop3 = await prisma.asset.create({
        data: {
            name: 'HP ProBook 450 G9',
            category: 'Laptop',
            assetCode: 'LAP-003',
            brand: 'HP',
            model: 'ProBook 450 G9',
            serialNumber: 'SN-HP-003',
            purchaseDate: new Date('2022-11-10'),
            cost: 28000,
            location: 'Building 1, Floor 1, Computer Lab',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    const tablet1 = await prisma.asset.create({
        data: {
            name: 'iPad Air (5th Gen)',
            category: 'Tablet',
            assetCode: 'TAB-001',
            brand: 'Apple',
            model: 'iPad Air',
            serialNumber: 'SN-IPAD-001',
            purchaseDate: new Date('2023-05-15'),
            cost: 25000,
            location: 'Building 1, Floor 1, Room 102',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    const camera1 = await prisma.asset.create({
        data: {
            name: 'Canon EOS R6',
            category: 'Camera',
            assetCode: 'CAM-001',
            brand: 'Canon',
            model: 'EOS R6',
            serialNumber: 'SN-CANON-CAM-001',
            purchaseDate: new Date('2023-02-10'),
            cost: 95000,
            location: 'Building 1, AV Room',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    console.log('✅ Assets created');

    // ============================================================
    // 5. INSPECTIONS
    // ============================================================
    console.log('\n🔍 Creating Inspections...');

    // Inspection 1: Damage found (will create ticket)
    const inspection1 = await prisma.inspection.create({
        data: {
            inspectionNumber: 'INS-2024-001',
            assetId: laptop2.id,
            inspectorId: inspector1.id,
            inspectionDate: new Date('2024-12-15'),
            inspectionType: 'periodic',
            overallCondition: 'fair',
            damageFound: true,
            damageStatus: 'pending_review',
            damageSeverity: 'moderate',
            damageDescription: 'Laptop screen has noticeable scratches and one small crack in corner. Keyboard shows wear with 2 sticky keys (E and R). Battery health declining.',
            estimatedCost: 8500,
            canContinueUse: true,
            exteriorCondition: 'moderate_wear',
            exteriorNotes: 'Multiple scratches on lid and bottom panel',
            screenCondition: 'cracked',
            screenNotes: 'Small crack in top-right corner, multiple scratches visible',
            buttonPortCondition: 'all_functional',
            keyboardCondition: 'sticking_keys',
            keyboardNotes: 'E and R keys are sticky and require extra pressure',
            touchpadCondition: 'fully_functional',
            batteryHealth: 'replace_soon',
            notes: 'Asset still usable but needs repair before next term. Screen replacement recommended.',
        },
    });

    // Inspection 2: No damage (clean inspection)
    const inspection2 = await prisma.inspection.create({
        data: {
            inspectionNumber: 'INS-2024-002',
            assetId: laptop1.id,
            inspectorId: inspector2.id,
            inspectionDate: new Date('2024-12-16'),
            inspectionType: 'periodic',
            overallCondition: 'excellent',
            damageFound: false,
            exteriorCondition: 'no_damage',
            screenCondition: 'perfect',
            buttonPortCondition: 'all_functional',
            keyboardCondition: 'fully_functional',
            touchpadCondition: 'fully_functional',
            batteryHealth: 'normal',
            notes: 'Asset in excellent condition. No issues found.',
        },
    });

    // Inspection 3: Severe damage (will create urgent ticket)
    const inspection3 = await prisma.inspection.create({
        data: {
            inspectionNumber: 'INS-2024-003',
            assetId: laptop3.id,
            inspectorId: inspector1.id,
            inspectionDate: new Date('2024-12-20'),
            inspectionType: 'incident',
            overallCondition: 'broken',
            damageFound: true,
            damageStatus: 'pending_review',
            damageSeverity: 'severe',
            damageDescription: 'Laptop was dropped. Screen is completely shattered and non-functional. Bottom case is dented. Will not power on. Suspected motherboard damage.',
            estimatedCost: 25000,
            canContinueUse: false,
            exteriorCondition: 'structural_damage',
            exteriorNotes: 'Significant dent on bottom case, cracked corner',
            screenCondition: 'cracked',
            screenNotes: 'Screen completely shattered, non-functional',
            buttonPortCondition: 'all_functional',
            keyboardCondition: 'fully_functional',
            touchpadCondition: 'fully_functional',
            batteryHealth: 'not_applicable',
            notes: 'CRITICAL: Asset is non-functional. Reported drop incident. May not be economical to repair.',
        },
    });

    // Inspection 4: Minor damage (will create low priority ticket)
    const inspection4 = await prisma.inspection.create({
        data: {
            inspectionNumber: 'INS-2024-004',
            assetId: tablet1.id,
            inspectorId: inspector2.id,
            inspectionDate: new Date('2024-12-21'),
            inspectionType: 'periodic',
            overallCondition: 'good',
            damageFound: true,
            damageStatus: 'pending_review',
            damageSeverity: 'minor',
            damageDescription: 'Minor cosmetic scratches on screen. Fully functional.',
            estimatedCost: 1500,
            canContinueUse: true,
            exteriorCondition: 'minor_wear',
            exteriorNotes: 'Light scratches on back panel',
            screenCondition: 'minor_scratches',
            screenNotes: 'A few minor scratches, not affecting visibility',
            buttonPortCondition: 'all_functional',
            batteryHealth: 'normal',
            notes: 'Minor cosmetic wear only. Still very usable.',
        },
    });

    // Inspection 5: Scheduled for future (will NOT create ticket yet)
    const inspection5 = await prisma.inspection.create({
        data: {
            inspectionNumber: 'INS-2024-005',
            assetId: camera1.id,
            inspectorId: inspector2.id,
            inspectionDate: new Date('2024-12-28'),
            inspectionType: 'preventive',
            overallCondition: 'excellent',
            damageFound: false,
            notes: 'Scheduled preventive inspection',
        },
    });

    console.log('✅ Inspections created');

    console.log('\n✨ Demo data seed completed!');
    console.log('\n' + '='.repeat(60));
    console.log('📊 Data Summary:');
    console.log('   • Departments: 3 (IT, FM, Maintenance)');
    console.log('   • Roles: 3 (Admin, Technician, Inspector)');
    console.log('   • Users: 5');
    console.log('   • Assets: 5 (Laptops, Tablets, Cameras)');
    console.log('   • Inspections: 5');
    console.log('      - 3 with damage (will auto-create tickets)');
    console.log('      - 2 without damage');

    console.log('\n👥 User Credentials (all passwords: admin123):');
    console.log('   ┌─────────────────────────────────────────────────────┐');
    console.log('   │ 🔐 Admin (Full Access)                             │');
    console.log('   │ 📧 admin@school.com                                │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ 🔍 Inspectors                                       │');
    console.log('   │ 📧 inspector1@school.com (Somchai)                 │');
    console.log('   │ 📧 inspector2@school.com (Siriwan)                 │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ 🔧 Technicians                                      │');
    console.log('   │ 📧 tech1@school.com (Manop)                        │');
    console.log('   │ 📧 tech2@school.com (Wichai)                       │');
    console.log('   └─────────────────────────────────────────────────────┘');

    console.log('\n🔗 Inspection-Ticket Integration:');
    console.log('   ⚠️  Tickets will be AUTO-CREATED when you:');
    console.log('      1. Run the app and the inspection-ticket action triggers');
    console.log('      2. Or manually create tickets from inspection detail pages');

    console.log('\n🎯 Test Scenarios Available:');
    console.log('   1. View inspections list');
    console.log('   2. View inspection details with damage');
    console.log('   3. Manually create tickets from inspections');
    console.log('   4. Update ticket status and verify sync to inspection');
    console.log('   5. Test different damage severity levels');
    console.log('   6. Test SLA tracking based on priority');

    console.log('\n✨ Ready for testing!');
    console.log('');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
