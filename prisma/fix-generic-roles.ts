import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixGenericRoles() {
    try {
        console.log('🔄 Fixing generic roles (Admin, User) to have departmentId = null...\n');

        // Update Admin role - should be global, not tied to any department
        console.log('1️⃣ Updating Admin role...');
        const adminRole = await prisma.role.update({
            where: { id: 1 },
            data: {
                departmentId: null,
                scope: 'global',
            },
        });
        console.log('   ✅ Admin role updated:');
        console.log('      - departmentId:', adminRole.departmentId);
        console.log('      - scope:', adminRole.scope);

        // Update User role - should be generic, usable by any department
        console.log('\n2️⃣ Updating User role...');
        const userRole = await prisma.role.update({
            where: { id: 3 },
            data: {
                departmentId: null,
                scope: 'department',
            },
        });
        console.log('   ✅ User role updated:');
        console.log('      - departmentId:', userRole.departmentId);
        console.log('      - scope:', userRole.scope);

        // Keep Technician role tied to IT department
        console.log('\n3️⃣ Technician role (ID: 2) remains tied to IT Department');
        console.log('   ℹ️  You can create FM Technician and Stationary Manager roles separately');

        console.log('\n✅ Generic roles fixed successfully!');
        console.log('\n📋 Summary:');
        console.log('   - Admin: Global access, no department restriction');
        console.log('   - User: Generic role, inherits user\'s department');
        console.log('   - Technician: IT Department specific');

    } catch (error) {
        console.error('❌ Error fixing roles:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixGenericRoles()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error);
        process.exit(1);
    });
