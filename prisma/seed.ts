const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create IT Department
    const itDept = await prisma.department.upsert({
        where: { code: 'IT' },
        update: {},
        create: {
            name: 'IT',
            code: 'IT',
            isActive: true,
        },
    });
    console.log('✅ IT Department created');

    // 2. Create Admin Role
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
            permissions: JSON.stringify({ tickets: { view_all: true, create: true, update: true, delete: true, assign: true } }),
            scope: 'GLOBAL',
            isActive: true,
        },
    });
    console.log('✅ Admin Role created');

    // 3. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@school.com' },
        update: {
            roleId: adminRole.id,
        },
        create: {
            email: 'admin@school.com',
            name: 'Admin User',
            password: hashedPassword,
            roleId: adminRole.id,
            departmentId: itDept.id,
        },
    });

    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('👤 Admin credentials:');
    console.log('   📧 Email: admin@school.com');
    console.log('   🔑 Password: admin123');
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
