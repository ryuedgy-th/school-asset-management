/**
 * Migration Script: JSON Permissions → RolePermission Tables
 * 
 * This script:
 * 1. Reads old JSON permissions from Role.permissions
 * 2. Creates RolePermission records for each permission
 * 3. Validates migration success
 * 4. Can be run safely multiple times (idempotent)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Legacy permission structure (from old system)
interface LegacyPermissionConfig {
    scope: string;
    department?: string;
    modules: Record<string, {
        enabled: boolean;
        permissions?: string[];
        filters?: Record<string, any>;
    }>;
}

async function migrateRolePermissions() {
    console.log('🔄 Starting permission migration...\n');

    try {
        // Get all roles
        const roles = await prisma.role.findMany({
            include: {
                rolePermissions: true
            }
        });

        console.log(`📋 Found ${roles.length} roles to migrate\n`);

        let totalMigrated = 0;
        let totalSkipped = 0;

        for (const role of roles) {
            console.log(`\n🔧 Processing role: ${role.name}`);

            // Skip if already migrated (has rolePermissions)
            if (role.rolePermissions.length > 0) {
                console.log(`  ⏭️  Already migrated (${role.rolePermissions.length} permissions)`);
                totalSkipped += role.rolePermissions.length;
                continue;
            }

            // Parse old JSON permissions
            let legacyPerms: LegacyPermissionConfig;
            try {
                legacyPerms = JSON.parse(role.permissions) as LegacyPermissionConfig;
            } catch (error) {
                console.error(`  ❌ Failed to parse JSON for ${role.name}`);
                continue;
            }

            console.log(`  📦 Found ${Object.keys(legacyPerms.modules || {}).length} modules in JSON`);

            // Migrate each module's permissions
            let rolePermCount = 0;
            for (const [moduleCode, moduleConfig] of Object.entries(legacyPerms.modules || {})) {
                if (!moduleConfig.enabled) {
                    console.log(`  ⏭️  Skipping disabled module: ${moduleCode}`);
                    continue;
                }

                // Find module in database
                const module = await prisma.module.findUnique({
                    where: { code: moduleCode }
                });

                if (!module) {
                    console.warn(`  ⚠️  Module not found: ${moduleCode}`);
                    continue;
                }

                // Get permissions for this module
                const permissions = moduleConfig.permissions || ['view'];

                for (const action of permissions) {
                    // Find permission in database
                    const permission = await prisma.modulePermission.findUnique({
                        where: {
                            moduleId_action: {
                                moduleId: module.id,
                                action: action
                            }
                        }
                    });

                    if (!permission) {
                        console.warn(`  ⚠️  Permission not found: ${moduleCode}.${action}`);
                        continue;
                    }

                    // Create role permission
                    try {
                        await prisma.rolePermission.create({
                            data: {
                                roleId: role.id,
                                permissionId: permission.id,
                                scopeFilter: moduleConfig.filters
                                    ? JSON.stringify(moduleConfig.filters)
                                    : null
                            }
                        });

                        rolePermCount++;
                    } catch (error) {
                        // Ignore duplicate errors (already exists)
                        if (!(error as any).code === 'P2002') {
                            console.error(`  ❌ Error creating permission: ${moduleCode}.${action}`, error);
                        }
                    }
                }
            }

            console.log(`  ✅ Migrated ${rolePermCount} permissions for ${role.name}`);
            totalMigrated += rolePermCount;
        }

        console.log(`\n\n📊 Migration Summary:`);
        console.log(`  ✅ Total migrated: ${totalMigrated}`);
        console.log(`  ⏭️  Total skipped: ${totalSkipped}`);
        console.log(`\n✅ Migration completed successfully!`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    }
}

async function validateMigration() {
    console.log('\n\n🔍 Validating migration...\n');

    try {
        // Check all roles have permissions
        const roles = await prisma.role.findMany({
            include: {
                _count: {
                    select: { rolePermissions: true }
                }
            }
        });

        let allValid = true;
        for (const role of roles) {
            const count = role._count.rolePermissions;
            if (count === 0) {
                console.warn(`  ⚠️  Role "${role.name}" has 0 permissions!`);
                allValid = false;
            } else {
                console.log(`  ✅ ${role.name}: ${count} permissions`);
            }
        }

        // Count total permissions
        const totalPerms = await prisma.rolePermission.count();
        console.log(`\n  📊 Total RolePermissions: ${totalPerms}`);

        if (allValid) {
            console.log('\n✅ Validation passed!');
        } else {
            console.warn('\n⚠️  Validation found issues - some roles have no permissions');
        }

    } catch (error) {
        console.error('\n❌ Validation failed:', error);
    }
}

async function main() {
    try {
        console.log('╔════════════════════════════════════════╗');
        console.log('║  Permission Migration Script          ║');
        console.log('║  JSON → RolePermission Tables          ║');
        console.log('╚════════════════════════════════════════╝\n');

        await migrateRolePermissions();
        await validateMigration();

        console.log('\n🎉 All done! You can now:');
        console.log('  1. Test the new permission system');
        console.log('  2. Remove the old Role.permissions field (after verification)');
        console.log('  3. Update all code to use new permission functions\n');

    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
