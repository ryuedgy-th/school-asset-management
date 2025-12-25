const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // 1. Create Roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            permissions: JSON.stringify(['*']),
        },
    });

    const technicianRole = await prisma.role.upsert({
        where: { name: 'Technician' },
        update: {},
        create: {
            name: 'Technician',
            permissions: JSON.stringify(['/assets', '/borrow', '/pm', '/scan']),
        },
    });

    const userRole = await prisma.role.upsert({
        where: { name: 'User' },
        update: {},
        create: {
            name: 'User',
            permissions: JSON.stringify(['/assets', '/borrow']),
        },
    });

    // 2. Create/Update Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@school.com' },
        update: {
            // Update to link to role
            roleId: adminRole.id,
            role: 'Admin'
        },
        create: {
            email: 'admin@school.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'Admin',
            roleId: adminRole.id,
            department: 'IT'
        },
    });

    console.log({ user, adminRole });
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
