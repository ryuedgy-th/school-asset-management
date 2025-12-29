import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRBAC() {
    console.log('🔍 Checking RBAC System...\n');

    // Check Modules
    const modules = await prisma.module.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
    });
    console.log(`📦 Active Modules: ${modules.length}`);
    modules.forEach(m => console.log(`   - ${m.code}: ${m.name}`));

    // Check Permissions
    await prisma.$connect();
    const permissions = await prisma.modulePermission.findMany({
        include: { module: true }
    });
    console.log(`\n🔑 Total Permissions: ${permissions.length}`);

    // Check Roles
    const roles = await prisma.role.findMany({
        where: { isActive: true },
        include: {
            department: true,
            _count: {
                select: { users: true, rolePermissions: true }
            }
        }
    });
    console.log(`\n👥 Active Roles: ${roles.length}`);
    roles.forEach(r => {
        console.log(`   - ${r.name} (${r.scope})`);
        console.log(`     Department: ${r.department?.name || 'N/A'}`);
        console.log(`     Users: ${r._count.users}, Permissions: ${r._count.rolePermissions}`);
    });

    // Check Users with Roles
    const users = await prisma.user.findMany({
        include: {
            userRole: true,
            userDepartment: true
        },
        take: 10
    });
    console.log(`\n👤 Sample Users (first 10):`);
    users.forEach(u => {
        console.log(`   - ${u.name || u.email}`);
        console.log(`     Role: ${u.userRole?.name || 'NO ROLE'}`);
        console.log(`     Department: ${u.userDepartment?.name || 'NO DEPARTMENT'}`);
    });

    // Check Role Permissions
    const rolePerms = await prisma.rolePermission.findMany({
        include: {
            role: true,
            permission: {
                include: { module: true }
            }
        },
        take: 20
    });
    console.log(`\n🔐 Sample Role Permissions (first 20):`);
    rolePerms.forEach(rp => {
        console.log(`   - ${rp.role.name} → ${rp.permission.module.code}.${rp.permission.action}`);
    });

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   ✓ Modules: ${modules.length}`);
    console.log(`   ✓ Permissions: ${permissions.length}`);
    console.log(`   ✓ Roles: ${roles.length}`);
    console.log(`   ✓ Users: ${users.length} (showing sample)`);
    console.log(`   ✓ Role-Permission mappings: ${rolePerms.length} (showing sample)`);

    await prisma.$disconnect();
}

checkRBAC().catch(console.error);
