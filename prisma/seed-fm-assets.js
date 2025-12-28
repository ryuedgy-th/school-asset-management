const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFMAssets() {
    console.log('🌱 Seeding FM Asset Management data...');

    try {
        // 1. Create FM Asset Categories
        console.log('Creating FM Asset Categories...');

        const hvacCategory = await prisma.fMAssetCategory.upsert({
            where: { name: 'HVAC' },
            update: {},
            create: {
                name: 'HVAC',
                description: 'Heating, Ventilation, and Air Conditioning systems',
                icon: 'Wind',
                color: '#3b82f6', // Blue
            },
        });

        const vehicleCategory = await prisma.fMAssetCategory.upsert({
            where: { name: 'Vehicles' },
            update: {},
            create: {
                name: 'Vehicles',
                description: 'Company vehicles and transportation',
                icon: 'Car',
                color: '#10b981', // Green
            },
        });

        const furnitureCategory = await prisma.fMAssetCategory.upsert({
            where: { name: 'Furniture' },
            update: {},
            create: {
                name: 'Furniture',
                description: 'Office furniture and fixtures',
                icon: 'Armchair',
                color: '#f59e0b', // Amber
            },
        });

        const electricalCategory = await prisma.fMAssetCategory.upsert({
            where: { name: 'Electrical Systems' },
            update: {},
            create: {
                name: 'Electrical Systems',
                description: 'Electrical equipment and systems',
                icon: 'Zap',
                color: '#ef4444', // Red
            },
        });

        console.log('✅ Created 4 FM Asset Categories');

        // 2. Create AC Inspection Template
        console.log('Creating AC Inspection Template...');

        const checklistItems = JSON.stringify([
            {
                id: 1,
                item: 'และตรวจสอบ',
                description: 'ทำความสะอาดตัวเครื่องภายนอก ตรวจสอบสภาพภายนอก ตรวจสอบการทำงานของเครื่อง',
            },
            {
                id: 2,
                item: 'ทำความสะอาดแผง',
                description: 'ปัดฝุ่นทำความสะอาดแผงคอยล์ร้อน',
            },
            {
                id: 3,
                item: 'ตรวจสอบท่อน้ำทิ้งคอนเดนเสท',
                description: 'ตรวจสอบท่อน้ำทิ้ง',
            },
            {
                id: 4,
                item: 'ตรวจสอบท่อน้ำยาเย็น',
                description: 'ตรวจสอบท่อน้ำยาเย็น',
            },
            {
                id: 5,
                item: 'และตรวจสอบตัวกรอง',
                description: 'ถอดทำความสะอาดตัวกรองอากาศ หรือ เปลี่ยนตัวกรองอากาศ',
            },
            {
                id: 6,
                item: 'และตรวจสอบคอยล์',
                description: 'ถอดทำความสะอาดตัวคอยล์เย็น หรือ เปลี่ยนตัวกรองอากาศ',
            },
            {
                id: 7,
                item: 'ทำความสะอาด',
                description: 'ล้างถาดรองน้ำทิ้ง (ถ้ามีน้ำ)',
            },
            {
                id: 8,
                item: 'สำรวจท่อน้ำยาเย็น/ท่อน้ำทิ้ง',
                description: 'ล้างถาดรองน้ำทิ้ง',
            },
        ]);

        const acTemplate = await prisma.aCInspectionTemplate.upsert({
            where: { id: 1 },
            update: {},
            create: {
                name: 'Monthly AC Inspection',
                description: 'รายการตรวจเช็คแอร์ประจำเดือน',
                checklistItems: checklistItems,
                isActive: true,
            },
        });

        console.log('✅ Created AC Inspection Template');

        // 3. Create Sample FM Assets
        console.log('Creating Sample FM Assets...');

        // AC Unit 1
        const ac101 = await prisma.fMAsset.upsert({
            where: { assetCode: 'AC-101' },
            update: {},
            create: {
                assetCode: 'AC-101',
                name: 'แอร์ห้อง 101',
                description: 'เครื่องปรับอากาศห้องเรียน 101',
                categoryId: hvacCategory.id,
                type: 'Air Conditioner',
                brand: 'Daikin',
                model: 'FTKC25TV2S',
                serialNumber: 'DAI-2023-001',
                location: 'อาคาร A ชั้น 1',
                building: 'อาคาร A',
                floor: 'ชั้น 1',
                room: 'ห้อง 101',
                purchaseDate: new Date('2023-01-15'),
                installDate: new Date('2023-01-20'),
                warrantyExpiry: new Date('2026-01-20'),
                specifications: JSON.stringify({
                    capacity: '24000 BTU',
                    voltage: '220V',
                    type: 'Split Type',
                    refrigerant: 'R410A',
                }),
                condition: 'good',
                status: 'active',
                requiresMaintenance: true,
                purchaseCost: 25000,
                currentValue: 20000,
                qrCode: 'FM-AC-101',
            },
        });

        // AC Unit 2
        const ac102 = await prisma.fMAsset.upsert({
            where: { assetCode: 'AC-102' },
            update: {},
            create: {
                assetCode: 'AC-102',
                name: 'แอร์ห้อง 102',
                description: 'เครื่องปรับอากาศห้องเรียน 102',
                categoryId: hvacCategory.id,
                type: 'Air Conditioner',
                brand: 'Mitsubishi',
                model: 'MSY-JP25VF',
                serialNumber: 'MIT-2023-002',
                location: 'อาคาร A ชั้น 1',
                building: 'อาคาร A',
                floor: 'ชั้น 1',
                room: 'ห้อง 102',
                purchaseDate: new Date('2023-01-15'),
                installDate: new Date('2023-01-20'),
                warrantyExpiry: new Date('2026-01-20'),
                specifications: JSON.stringify({
                    capacity: '24000 BTU',
                    voltage: '220V',
                    type: 'Split Type',
                    refrigerant: 'R410A',
                }),
                condition: 'good',
                status: 'active',
                requiresMaintenance: true,
                purchaseCost: 24000,
                currentValue: 19000,
                qrCode: 'FM-AC-102',
            },
        });

        // School Van
        const van001 = await prisma.fMAsset.upsert({
            where: { assetCode: 'VAN-001' },
            update: {},
            create: {
                assetCode: 'VAN-001',
                name: 'รถตู้โรงเรียน กข-1234',
                description: 'รถตู้รับส่งนักเรียน',
                categoryId: vehicleCategory.id,
                type: 'Van',
                brand: 'Toyota',
                model: 'Commuter 3.0',
                serialNumber: 'TOY-VAN-2022-001',
                location: 'ลานจอดรถโรงเรียน',
                building: 'ลานจอดรถ',
                purchaseDate: new Date('2022-06-01'),
                warrantyExpiry: new Date('2025-06-01'),
                specifications: JSON.stringify({
                    licensePlate: 'กข-1234 กรุงเทพฯ',
                    chassisNumber: 'ABC123456789',
                    engineNumber: 'ENG987654',
                    color: 'ขาว',
                    seats: 14,
                    fuelType: 'Diesel',
                    fuelCapacity: '70L',
                    currentMileage: 45000,
                    taxExpiryDate: '2025-06-30',
                    actExpiryDate: '2025-06-30',
                    insuranceExpiryDate: '2025-12-31',
                    insuranceType: 'ประกันชั้น 1',
                    insuranceCompany: 'บริษัท ABC ประกัน',
                }),
                condition: 'good',
                status: 'active',
                requiresMaintenance: true,
                purchaseCost: 1200000,
                currentValue: 900000,
                qrCode: 'FM-VAN-001',
            },
        });

        // Office Desk (No Maintenance)
        const desk101 = await prisma.fMAsset.upsert({
            where: { assetCode: 'DESK-101' },
            update: {},
            create: {
                assetCode: 'DESK-101',
                name: 'โต๊ะทำงานห้องผู้อำนวยการ',
                description: 'โต๊ะทำงานไม้สักทอง',
                categoryId: furnitureCategory.id,
                type: 'Executive Desk',
                brand: 'Index Living Mall',
                model: 'Executive Series',
                location: 'อาคาร A ชั้น 3',
                building: 'อาคาร A',
                floor: 'ชั้น 3',
                room: 'ห้องผู้อำนวยการ',
                purchaseDate: new Date('2022-03-01'),
                specifications: JSON.stringify({
                    material: 'ไม้สักทอง',
                    dimensions: '180x80x75 cm',
                    color: 'น้ำตาลเข้ม',
                }),
                condition: 'excellent',
                status: 'active',
                requiresMaintenance: false, // No PM needed
                purchaseCost: 50000,
                currentValue: 45000,
                qrCode: 'FM-DESK-101',
            },
        });

        console.log('✅ Created 4 Sample FM Assets');

        // 4. Create PM Schedules for AC Units
        console.log('Creating PM Schedules...');

        await prisma.pMSchedule.upsert({
            where: { id: 1 },
            update: {},
            create: {
                assetId: ac101.id,
                name: 'ล้าง Filter ประจำเดือน',
                description: 'ทำความสะอาด Air Filter ทุก 2 สัปดาห์',
                scheduleType: 'time',
                frequency: 'weekly',
                intervalValue: 2,
                intervalUnit: 'weeks',
                nextDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
                checklistItems: JSON.stringify([
                    { task: 'ถอด Air Filter', required: true },
                    { task: 'ล้างด้วยน้ำสะอาด', required: true },
                    { task: 'ตากให้แห้ง', required: true },
                    { task: 'ติดตั้งกลับ', required: true },
                ]),
                autoCreateWO: true,
                leadTimeDays: 3,
                priority: 'medium',
                isActive: true,
            },
        });

        await prisma.pMSchedule.upsert({
            where: { id: 2 },
            update: {},
            create: {
                assetId: ac101.id,
                name: 'ตรวจเช็คระบบประจำไตรมาส',
                description: 'ตรวจสอบระบบทั้งหมดทุก 3 เดือน',
                scheduleType: 'time',
                frequency: 'monthly',
                intervalValue: 3,
                intervalUnit: 'months',
                nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
                checklistItems: JSON.stringify([
                    { task: 'ตรวจสอบ Refrigerant', required: true },
                    { task: 'ทำความสะอาด Coil', required: true },
                    { task: 'เช็คระบบไฟฟ้า', required: true },
                    { task: 'ตรวจสอบเสียงผิดปกติ', required: true },
                ]),
                autoCreateWO: true,
                leadTimeDays: 7,
                priority: 'high',
                isActive: true,
            },
        });

        // PM Schedule for Van
        await prisma.pMSchedule.upsert({
            where: { id: 3 },
            update: {},
            create: {
                assetId: van001.id,
                name: 'เปลี่ยนถ่ายน้ำมันเครื่อง',
                description: 'เปลี่ยนถ่ายน้ำมันเครื่องทุก 5,000 km',
                scheduleType: 'usage',
                usageMetric: 'km',
                usageInterval: 5000,
                nextDueUsage: 50000, // Next at 50,000 km
                checklistItems: JSON.stringify([
                    { task: 'เปลี่ยนน้ำมันเครื่อง', required: true },
                    { task: 'เปลี่ยนกรองน้ำมัน', required: true },
                    { task: 'ตรวจสอบระดับน้ำมันเกียร์', required: true },
                    { task: 'ตรวจสอบเบรก', required: true },
                ]),
                autoCreateWO: true,
                leadTimeDays: 7,
                priority: 'high',
                isActive: true,
            },
        });

        console.log('✅ Created 3 PM Schedules');

        console.log('');
        console.log('🎉 FM Asset Management seed data completed!');
        console.log('');
        console.log('Summary:');
        console.log('- 4 FM Asset Categories');
        console.log('- 1 AC Inspection Template (8 checklist items)');
        console.log('- 4 Sample FM Assets (2 ACs, 1 Van, 1 Desk)');
        console.log('- 3 PM Schedules');
        console.log('');

    } catch (error) {
        console.error('❌ Error seeding FM Asset data:', error);
        throw error;
    }
}

seedFMAssets()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
