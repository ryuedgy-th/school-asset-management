import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminRole() {
    try {
        console.log('🔄 Updating Admin role with full permissions...');

        // Full permissions for Admin - all modules, all actions
        const adminPermissions = {
            scope: 'global',
            modules: {
                assets: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                inspections: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                assignments: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                maintenance: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                stationary: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                users: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                reports: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                settings: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                roles: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
                departments: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
                },
            },
        };

        // Update Admin role (ID 1 from Prisma Studio)
        const adminRole = await prisma.role.update({
            where: { id: 1 },
            data: {
                permissions: JSON.stringify(adminPermissions),
                scope: 'global',
            },
        });

        console.log('✅ Admin role updated successfully!');
        console.log('   - Scope:', adminRole.scope);
        console.log('   - Permissions:', JSON.parse(adminRole.permissions));

        // Also update Technician and User roles with proper structure
        console.log('\n🔄 Updating Technician role...');
        const techPermissions = {
            scope: 'department',
            modules: {
                assets: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit'],
                },
                inspections: {
                    enabled: true,
                    permissions: ['view', 'create', 'edit'],
                },
                assignments: {
                    enabled: true,
                    permissions: ['view', 'create'],
                },
                reports: {
                    enabled: true,
                    permissions: ['view'],
                },
            },
        };

        await prisma.role.update({
            where: { id: 2 },
            data: {
                permissions: JSON.stringify(techPermissions),
                scope: 'department',
            },
        });
        console.log('✅ Technician role updated!');

        console.log('\n🔄 Updating User role...');
        const userPermissions = {
            scope: 'department',
            modules: {
                assets: {
                    enabled: true,
                    permissions: ['view'],
                },
                assignments: {
                    enabled: true,
                    permissions: ['view'],
                },
            },
        };

        await prisma.role.update({
            where: { id: 3 },
            data: {
                permissions: JSON.stringify(userPermissions),
                scope: 'department',
            },
        });
        console.log('✅ User role updated!');

        console.log('\n🎉 All roles updated successfully!');
    } catch (error) {
        console.error('❌ Error updating roles:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateAdminRole()
    .then(() => {
        console.log('\n✅ Migration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
