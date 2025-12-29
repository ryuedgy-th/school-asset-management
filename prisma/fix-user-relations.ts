
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Verifying User Relations...');

    // 1. Ensure Default Department (General)
    let generalDept = await prisma.department.findFirst({ where: { code: 'GEN' } });
    if (!generalDept) {
        console.log('Creating General Department...');
        generalDept = await prisma.department.create({
            data: { name: 'General', code: 'GEN', description: 'General Department' },
        });
    }

    // 2. Ensure Roles
    const roles = [
        { name: 'Admin', scope: 'global' },
        { name: 'User', scope: 'department' },
        { name: 'Department Head', scope: 'department' },
        { name: 'Inspector', scope: 'department' }
    ];

    const roleMap: Record<string, number> = {};

    for (const r of roles) {
        let role = await prisma.role.findFirst({ where: { name: r.name } });
        if (!role) {
            console.log(`Creating Role: ${r.name}`);
            role = await prisma.role.create({
                data: {
                    name: r.name,
                    scope: r.scope,
                    isActive: true,
                    departmentId: r.scope === 'global' ? null : generalDept.id
                }
            });
        }
        roleMap[r.name] = role.id;
    }

    // 3. Check Users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        let updates: any = {};

        // Verify Role
        // If roleId is missing or points to non-existent role?
        // Prisma would throw on fetch if strict relation, but verifying here.
        // We can't easily check if ID is valid without query, but we can assume if it's 0 or null (if allowed).
        // Since schema has roleId Int, it's a number.

        const userRole = await prisma.role.findUnique({ where: { id: user.roleId } });
        if (!userRole) {
            console.log(`User ${user.email} has invalid roleId ${user.roleId}. Setting to User role.`);
            updates.roleId = roleMap['User'];
        }

        // Verify Department
        const userDept = await prisma.department.findUnique({ where: { id: user.departmentId } });
        if (!userDept) {
            console.log(`User ${user.email} has invalid departmentId ${user.departmentId}. Setting to General.`);
            updates.departmentId = generalDept.id;
        }

        // Special Case: Promote specific emails to Admin if needed
        // If user was previously Admin but lost it (roleId=User), we can fix it here if we know the email.
        // I'll leave this manual unless user specifies.

        if (Object.keys(updates).length > 0) {
            await prisma.user.update({
                where: { id: user.id },
                data: updates
            });
            console.log(`Updated User ${user.email}`);
        }
    }

    console.log('✅ Verification complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
