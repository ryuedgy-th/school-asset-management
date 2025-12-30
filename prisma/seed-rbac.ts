// RBAC Seed Script - Modules and Permissions
// Run after: npx prisma migrate dev

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRBAC() {
    console.log('🔐 Seeding RBAC: Modules and Permissions...');

    // ============================================
    // 1. Seed Modules
    // ============================================
    const modules = [
        // IT Department Modules
        {
            code: 'assets',
            name: 'IT Assets',
            description: 'Manage IT assets (computers, tablets, peripherals)',
            category: 'IT',
            icon: 'Laptop',
            routePath: '/assets',
            sortOrder: 1,
        },
        {
            code: 'inspections',
            name: 'Asset Inspections',
            description: 'Inspect and verify asset conditions',
            category: 'IT',
            icon: 'ClipboardCheck',
            routePath: '/inspections',
            sortOrder: 2,
        },
        {
            code: 'assignments',
            name: 'Asset Assignments',
            description: 'Assign and track asset usage',
            category: 'IT',
            icon: 'UserCheck',
            routePath: '/assignments',
            sortOrder: 3,
        },

        // FM Department Modules
        {
            code: 'fm_assets',
            name: 'FM Assets',
            description: 'Manage facilities and building assets',
            category: 'FM',
            icon: 'Building2',
            routePath: '/fm-assets',
            sortOrder: 10,
        },
        {
            code: 'maintenance',
            name: 'Maintenance Logs',
            description: 'Track maintenance and repairs',
            category: 'FM',
            icon: 'Wrench',
            routePath: '/maintenance-logs',
            sortOrder: 11,
        },
        {
            code: 'pm_schedules',
            name: 'PM Schedules',
            description: 'Preventive maintenance scheduling',
            category: 'FM',
            icon: 'Calendar',
            routePath: '/pm-schedules',
            sortOrder: 12,
        },
        {
            code: 'spare_parts',
            name: 'Spare Parts Inventory',
            description: 'Manage spare parts stock',
            category: 'FM',
            icon: 'Package',
            routePath: '/spare-parts',
            sortOrder: 13,
        },

        // Stationary Department Modules
        {
            code: 'stationary',
            name: 'Stationary',
            description: 'Manage office supplies and stationary',
            category: 'STATIONARY',
            icon: 'PenTool',
            routePath: '/stationary',
            sortOrder: 20,
        },

        // Common Modules
        {
            code: 'tickets',
            name: 'Tickets',
            description: 'Issue tracking and ticketing system',
            category: 'Common',
            icon: 'TicketIcon',
            routePath: '/tickets',
            sortOrder: 30,
        },
        {
            code: 'reports',
            name: 'Reports',
            description: 'Generate and view reports',
            category: 'Common',
            icon: 'FileText',
            routePath: '/reports',
            sortOrder: 40,
        },

        // System Administration Modules
        {
            code: 'users',
            name: 'User Management',
            description: 'Manage system users',
            category: 'System',
            icon: 'Users',
            routePath: '/settings/users',
            sortOrder: 100,
        },
        {
            code: 'roles',
            name: 'Role Management',
            description: 'Manage user roles and permissions',
            category: 'System',
            icon: 'Shield',
            routePath: '/settings/roles',
            sortOrder: 101,
        },
        {
            code: 'departments',
            name: 'Department Management',
            description: 'Manage departments and organizational structure',
            category: 'System',
            icon: 'Building',
            routePath: '/settings/departments',
            sortOrder: 102,
        },
        {
            code: 'settings',
            name: 'System Settings',
            description: 'Configure system-wide settings',
            category: 'System',
            icon: 'Settings',
            routePath: '/settings',
            sortOrder: 103,
        },
    ];

    console.log('📦 Creating modules...');
    for (const moduleData of modules) {
        await prisma.module.upsert({
            where: { code: moduleData.code },
            update: moduleData,
            create: moduleData,
        });
        console.log(`  ✅ ${moduleData.name}`);
    }

    // ============================================
    // 2. Seed Permissions for Each Module
    // ============================================
    console.log('\n🔑 Creating permissions...');

    // Standard permissions for most modules
    const standardPermissions = [
        { action: 'view', name: 'View' },
        { action: 'create', name: 'Create' },
        { action: 'edit', name: 'Edit' },
        { action: 'delete', name: 'Delete' },
    ];

    // Modules with additional permissions
    const permissionsByModule: Record<string, Array<{ action: string; name: string; description?: string }>> = {
        // IT & FM Assets - add approve
        assets: [
            ...standardPermissions,
            { action: 'approve', name: 'Approve', description: 'Approve asset requests and changes' },
        ],
        fm_assets: [
            ...standardPermissions,
            { action: 'approve', name: 'Approve', description: 'Approve asset requests and changes' },
        ],

        // Inspections - add approve
        inspections: [
            ...standardPermissions,
            { action: 'approve', name: 'Approve Inspections', description: 'Approve inspection results' },
        ],

        // PM Schedules - add approve and execute
        pm_schedules: [
            ...standardPermissions,
            { action: 'approve', name: 'Approve Schedules', description: 'Approve PM schedules' },
            { action: 'execute', name: 'Execute PM', description: 'Execute preventive maintenance tasks' },
        ],

        // Tickets - no approve needed
        tickets: standardPermissions,

        // Assignments - no approve needed
        assignments: standardPermissions.filter(p => p.action !== 'delete'), // Can't delete assignments

        // Spare Parts - no approve needed
        spare_parts: standardPermissions,

        // Maintenance - add approve
        maintenance: [
            ...standardPermissions,
            { action: 'approve', name: 'Approve Maintenance', description: 'Approve maintenance work' },
        ],

        // Stationary - comprehensive permissions
        stationary: [
            { action: 'view', name: 'View Stationary', description: 'View items, stock, and requisitions' },
            { action: 'create', name: 'Create Requisition', description: 'Create requisition requests' },
            { action: 'edit', name: 'Edit Items', description: 'Edit stationary items and details' },
            { action: 'delete', name: 'Delete Items', description: 'Delete stationary items' },
            { action: 'approve', name: 'Approve Requisitions', description: 'Approve requisition requests' },
            { action: 'issue', name: 'Issue Items', description: 'Issue items from inventory' },
            { action: 'receive', name: 'Receive Items', description: 'Receive items into inventory' },
            { action: 'manage_budget', name: 'Manage Budgets', description: 'Manage department budgets' },
            { action: 'export', name: 'Export Reports', description: 'Export analytics and reports' },
        ],

        // Reports - view and export only
        reports: [
            { action: 'view', name: 'View Reports' },
            { action: 'export', name: 'Export Reports', description: 'Export reports to Excel/PDF' },
        ],

        // System modules - full CRUD
        users: standardPermissions,
        roles: standardPermissions,
        departments: standardPermissions,

        // Settings - view and edit only (no create/delete)
        settings: [
            { action: 'view', name: 'View Settings' },
            { action: 'edit', name: 'Edit Settings' },
        ],
    };

    // Create permissions for all modules
    const allModules = await prisma.module.findMany();

    for (const module of allModules) {
        const permissions = permissionsByModule[module.code] || standardPermissions;

        for (const perm of permissions) {
            await prisma.modulePermission.upsert({
                where: {
                    moduleId_action: {
                        moduleId: module.id,
                        action: perm.action,
                    },
                },
                update: {
                    name: perm.name,
                    description: perm.description,
                },
                create: {
                    moduleId: module.id,
                    action: perm.action,
                    name: perm.name,
                    description: perm.description,
                },
            });
        }

        console.log(`  ✅ ${module.name} (${permissions.length} permissions)`);
    }

    console.log('\n✅ RBAC seeding completed!');
}

async function main() {
    try {
        await seedRBAC();
    } catch (error) {
        console.error('❌ Error seeding RBAC:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
