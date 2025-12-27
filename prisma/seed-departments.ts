import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding departments...');

    // Create default departments
    const departments = [
        {
            code: 'IT',
            name: 'IT Department',
            description: 'Information Technology - ครุภัณฑ์ IT, Inspections, การยืม-คืน',
            isActive: true,
        },
        {
            code: 'FM',
            name: 'Facility Management',
            description: 'FM - บำรุงรักษาอาคาร, งานซ่อม, ครุภัณฑ์ FM',
            isActive: true,
        },
        {
            code: 'STATIONARY',
            name: 'Stationary Department',
            description: 'เครื่องเขียน - วัสดุสำนักงาน, การเบิกจ่าย',
            isActive: true,
        },
    ];

    for (const dept of departments) {
        const existing = await prisma.department.findUnique({
            where: { code: dept.code },
        });

        if (!existing) {
            await prisma.department.create({ data: dept });
            console.log(`✅ Created department: ${dept.name}`);
        } else {
            console.log(`⏭️  Department already exists: ${dept.name}`);
        }
    }

    // Get IT department ID
    const itDept = await prisma.department.findUnique({
        where: { code: 'IT' },
    });

    if (itDept) {
        // Migrate existing assets to IT department
        const assetsUpdated = await prisma.asset.updateMany({
            where: { departmentId: null },
            data: { departmentId: itDept.id },
        });
        console.log(`✅ Migrated ${assetsUpdated.count} assets to IT department`);

        // Migrate existing inspections to IT department
        const inspectionsUpdated = await prisma.inspection.updateMany({
            where: { departmentId: null },
            data: { departmentId: itDept.id },
        });
        console.log(`✅ Migrated ${inspectionsUpdated.count} inspections to IT department`);

        // Migrate existing users to IT department (except admins)
        const usersUpdated = await prisma.user.updateMany({
            where: {
                departmentId: null,
                role: { not: 'Admin' }, // Don't assign department to admins
            },
            data: { departmentId: itDept.id },
        });
        console.log(`✅ Migrated ${usersUpdated.count} users to IT department`);

        // Update existing roles to IT department
        const rolesUpdated = await prisma.role.updateMany({
            where: { departmentId: null },
            data: { departmentId: itDept.id, scope: 'department' },
        });
        console.log(`✅ Migrated ${rolesUpdated.count} roles to IT department`);
    }

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
