/**
 * Seed Default Role Permissions
 * Creates standard permission sets for common roles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRolePermissions() {
    console.log('🔐 Seeding default role permissions...\n');

    // ============================================
    // Define Permission Sets
    // ============================================

    const permissionSets = {
        // Admin - Full access to everything
        Admin: {
            scope: 'global',
            modules: [
                { code: 'assets', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
                { code: 'inspections', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
                { code: 'assignments', actions: ['view', 'create', 'edit'] },
                { code: 'fm_assets', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
                { code: 'maintenance', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
                { code: 'pm_schedules', actions: ['view', 'create', 'edit', 'delete', 'approve', 'execute'] },
                { code: 'spare_parts', actions: ['view', 'create', 'edit', 'delete'] },
                { code: 'stationary', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
                { code: 'tickets', actions: ['view', 'create', 'edit', 'delete'] },
                { code: 'reports', actions: ['view', 'export'] },
                { code: 'users', actions: ['view', 'create', 'edit', 'delete'] },
                { code: 'roles', actions: ['view', 'create', 'edit', 'delete'] },
                { code: 'departments', actions: ['view', 'create', 'edit', 'delete'] },
                { code: 'settings', actions: ['view', 'edit'] },
            ],
        },

        // Technician - Can work on repairs and maintenance
        Technician: {
            scope: 'department',
            modules: [
                { code: 'assets', actions: ['view'] },
                { code: 'tickets', actions: ['view', 'create', 'edit'] },
                { code: 'maintenance', actions: ['view', 'create', 'edit'] },
                { code: 'spare_parts', actions: ['view'] },
                { code: 'reports', actions: ['view'] },
            ],
        },

        // Inspector - Can inspect and create tickets
        Inspector: {
            scope: 'department',
            modules: [
                { code: 'assets', actions: ['view'] },
                { code: 'inspections', actions: ['view', 'create', 'edit'] },
                { code: 'tickets', actions: ['view', 'create'] },
                { code: 'reports', actions: ['view'] },
            ],
        },
    };

    // ============================================
    // Assign Permissions to Roles
    // ============================================

    for (const [roleName, permSet] of Object.entries(permissionSets)) {
        console.log(`\n📦 Processing role: ${roleName}`);

        // Find role
        const role = await prisma.role.findFirst({
            where: {
                name: roleName
            }
        });

        if (!role) {
            console.warn(`  ⚠️  Role not found: ${roleName}`);
            continue;
        }

        // Update role scope
        await prisma.role.update({
            where: { id: role.id },
            data: { scope: permSet.scope }
        });

        let permCount = 0;

        for (const moduleConfig of permSet.modules) {
            // Find module
            const module = await prisma.module.findUnique({
                where: { code: moduleConfig.code }
            });

            if (!module) {
                console.warn(`  ⚠️  Module not found: ${moduleConfig.code}`);
                continue;
            }

            // Assign each action
            for (const action of moduleConfig.actions) {
                // Find permission
                const permission = await prisma.modulePermission.findUnique({
                    where: {
                        moduleId_action: {
                            moduleId: module.id,
                            action: action
                        }
                    }
                });

                if (!permission) {
                    console.warn(`  ⚠️  Permission not found: ${moduleConfig.code}.${action}`);
                    continue;
                }

                // Create role permission (upsert to avoid duplicates)
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: {
                            roleId: role.id,
                            permissionId: permission.id
                        }
                    },
                    update: {},
                    create: {
                        roleId: role.id,
                        permissionId: permission.id,
                        scopeFilter: permSet.scope === 'department'
                            ? JSON.stringify({ ownDepartmentOnly: true })
                            : null
                    }
                });

                permCount++;
            }
        }

        console.log(`  ✅ Assigned ${permCount} permissions to ${roleName}`);
    }

    // ============================================
    // Summary
    // ============================================

    console.log('\n\n📊 Permission Summary:');

    const roles = await prisma.role.findMany({
        include: {
            _count: {
                select: { rolePermissions: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    for (const role of roles) {
        console.log(`  ${role.name}: ${role._count.rolePermissions} permissions (${role.scope})`);
    }

    const totalPerms = await prisma.rolePermission.count();
    console.log(`\n  Total RolePermissions: ${totalPerms}`);

    console.log('\n✅ Role permissions seeded successfully!');
}

async function main() {
    try {
        await seedRolePermissions();
    } catch (error) {
        console.error('❌ Error seeding role permissions:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
