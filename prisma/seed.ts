const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive seed...');

    // ============================================================
    // 1. DEPARTMENTS
    // ============================================================
    console.log('\n📁 Creating Departments...');
    const itDept = await prisma.department.upsert({
        where: { code: 'IT' },
        update: {},
        create: {
            name: 'IT Department',
            code: 'IT',
            isActive: true,
        },
    });

    const fmDept = await prisma.department.upsert({
        where: { code: 'FM' },
        update: {},
        create: {
            name: 'Facilities Management',
            code: 'FM',
            isActive: true,
        },
    });

    const maintenanceDept = await prisma.department.upsert({
        where: { code: 'MAINT' },
        update: {},
        create: {
            name: 'Maintenance Department',
            code: 'MAINT',
            isActive: true,
        },
    });

    console.log('✅ Departments created');

    // ============================================================
    // 2. RBAC SYSTEM: MODULES & PERMISSIONS
    // ============================================================
    console.log('\n📦 Creating RBAC Modules...');

    const modules = [
        // IT Department Modules
        { code: 'assets', name: 'IT Assets', description: 'Manage IT assets (computers, tablets, peripherals)', category: 'IT', icon: 'Laptop', routePath: '/assets', sortOrder: 1 },
        { code: 'inspections', name: 'Asset Inspections', description: 'Inspect and verify asset conditions', category: 'IT', icon: 'ClipboardCheck', routePath: '/inspections', sortOrder: 2 },
        { code: 'assignments', name: 'Asset Assignments', description: 'Assign and track asset usage', category: 'IT', icon: 'UserCheck', routePath: '/assignments', sortOrder: 3 },

        // FM Department Modules
        { code: 'fm_assets', name: 'FM Assets', description: 'Manage facilities and building assets', category: 'FM', icon: 'Building2', routePath: '/fm-assets', sortOrder: 10 },
        { code: 'maintenance', name: 'Maintenance Logs', description: 'Track maintenance and repairs', category: 'FM', icon: 'Wrench', routePath: '/maintenance-logs', sortOrder: 11 },
        { code: 'pm_schedules', name: 'PM Schedules', description: 'Preventive maintenance scheduling', category: 'FM', icon: 'Calendar', routePath: '/pm-schedules', sortOrder: 12 },
        { code: 'spare_parts', name: 'Spare Parts Inventory', description: 'Manage spare parts stock', category: 'FM', icon: 'Package', routePath: '/spare-parts', sortOrder: 13 },

        // Stationary Department Modules
        { code: 'stationary', name: 'Stationary', description: 'Manage office supplies and stationary', category: 'STATIONARY', icon: 'PenTool', routePath: '/stationary', sortOrder: 20 },

        // Common Modules
        { code: 'tickets', name: 'Tickets', description: 'Issue tracking and ticketing system', category: 'Common', icon: 'TicketIcon', routePath: '/tickets', sortOrder: 30 },
        { code: 'reports', name: 'Reports', description: 'Generate and view reports', category: 'Common', icon: 'FileText', routePath: '/reports', sortOrder: 40 },

        // System Administration Modules
        { code: 'users', name: 'User Management', description: 'Manage system users', category: 'System', icon: 'Users', routePath: '/settings/users', sortOrder: 100 },
        { code: 'roles', name: 'Role Management', description: 'Manage user roles and permissions', category: 'System', icon: 'Shield', routePath: '/settings/organization', sortOrder: 101 },
        { code: 'departments', name: 'Department Management', description: 'Manage departments and organizational structure', category: 'System', icon: 'Building', routePath: '/settings/organization', sortOrder: 102 },
        { code: 'settings', name: 'System Settings', description: 'Configure system-wide settings', category: 'System', icon: 'Settings', routePath: '/settings', sortOrder: 103 },
    ];

    for (const moduleData of modules) {
        await prisma.module.upsert({
            where: { code: moduleData.code },
            update: moduleData,
            create: moduleData,
        });
    }
    console.log(`✅ Created ${modules.length} modules`);

    // Create permissions for each module
    console.log('\n🔑 Creating Module Permissions...');

    const standardPermissions = [
        { action: 'view', name: 'View' },
        { action: 'create', name: 'Create' },
        { action: 'edit', name: 'Edit' },
        { action: 'delete', name: 'Delete' },
    ];

    const permissionsByModule = {
        // IT & FM Assets - add approve
        assets: [...standardPermissions, { action: 'approve', name: 'Approve', description: 'Approve asset requests and changes' }],
        fm_assets: [...standardPermissions, { action: 'approve', name: 'Approve', description: 'Approve asset requests and changes' }],

        // Inspections - add approve
        inspections: [...standardPermissions, { action: 'approve', name: 'Approve Inspections', description: 'Approve inspection results' }],

        // PM Schedules - add approve and execute
        pm_schedules: [
            ...standardPermissions,
            { action: 'approve', name: 'Approve Schedules', description: 'Approve PM schedules' },
            { action: 'execute', name: 'Execute PM', description: 'Execute preventive maintenance tasks' },
        ],

        // Tickets, Spare Parts - standard
        tickets: standardPermissions,
        spare_parts: standardPermissions,

        // Assignments - no delete
        assignments: standardPermissions.filter(p => p.action !== 'delete'),

        // Maintenance - add approve
        maintenance: [...standardPermissions, { action: 'approve', name: 'Approve Maintenance', description: 'Approve maintenance work' }],

        // Stationary - add approve
        stationary: [...standardPermissions, { action: 'approve', name: 'Approve Requests', description: 'Approve stationary requests' }],

        // Reports - view and export only
        reports: [
            { action: 'view', name: 'View Reports' },
            { action: 'export', name: 'Export Reports', description: 'Export reports to Excel/PDF' },
        ],

        // System modules
        users: standardPermissions,
        roles: standardPermissions,
        departments: standardPermissions,

        // Settings - view and edit only
        settings: [
            { action: 'view', name: 'View Settings' },
            { action: 'edit', name: 'Edit Settings' },
        ],
    };

    const allModules = await prisma.module.findMany();
    let totalPermissions = 0;

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
            totalPermissions++;
        }
    }
    console.log(`✅ Created ${totalPermissions} permissions across all modules`);

    // ============================================================
    // 3. ROLES
    // ============================================================
    console.log('\n👥 Creating Roles...');
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
            scope: 'global',
            isActive: true,
            isSystem: true,
        },
    });

    const technicianRole = await prisma.role.upsert({
        where: {
            name_departmentId: {
                name: 'Technician',
                departmentId: maintenanceDept.id
            }
        },
        update: {},
        create: {
            name: 'Technician',
            departmentId: maintenanceDept.id,
            scope: 'department',
            isActive: true,
            isSystem: true,
        },
    });

    const inspectorRole = await prisma.role.upsert({
        where: {
            name_departmentId: {
                name: 'Inspector',
                departmentId: itDept.id
            }
        },
        update: {},
        create: {
            name: 'Inspector',
            departmentId: itDept.id,
            scope: 'department',
            isActive: true,
            isSystem: true,
        },
    });

    const userRole = await prisma.role.upsert({
        where: {
            name_departmentId: {
                name: 'User',
                departmentId: itDept.id
            }
        },
        update: {},
        create: {
            name: 'User',
            departmentId: itDept.id,
            scope: 'self', // Can only view/manage their own data
            isActive: true,
            isSystem: true,
        },
    });

    console.log('✅ Roles created (Admin, Technician, Inspector, User)');

    // ============================================================
    // 3. USERS
    // ============================================================
    console.log('\n👤 Creating Users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
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

    const inspector1 = await prisma.user.upsert({
        where: { email: 'inspector1@school.com' },
        update: {},
        create: {
            email: 'inspector1@school.com',
            name: 'Somchai Inspector',
            password: hashedPassword,
            roleId: inspectorRole.id,
            departmentId: itDept.id,
        },
    });

    const inspector2 = await prisma.user.upsert({
        where: { email: 'inspector2@school.com' },
        update: {},
        create: {
            email: 'inspector2@school.com',
            name: 'Siriwan Inspector',
            password: hashedPassword,
            roleId: inspectorRole.id,
            departmentId: itDept.id,
        },
    });

    const technician1 = await prisma.user.upsert({
        where: { email: 'tech1@school.com' },
        update: {},
        create: {
            email: 'tech1@school.com',
            name: 'Manop Technician',
            password: hashedPassword,
            roleId: technicianRole.id,
            departmentId: maintenanceDept.id,
        },
    });

    const technician2 = await prisma.user.upsert({
        where: { email: 'tech2@school.com' },
        update: {},
        create: {
            email: 'tech2@school.com',
            name: 'Wichai Technician',
            password: hashedPassword,
            roleId: technicianRole.id,
            departmentId: maintenanceDept.id,
        },
    });

    console.log('✅ Users created');

    // ============================================================
    // 4. EMAIL TEMPLATES
    // ============================================================
    console.log('\n📧 Creating Email Templates...');

    // Create default email account if needed
    let defaultAccount = await prisma.emailAccount.findFirst({
        where: { isDefault: true }
    });

    if (!defaultAccount) {
        defaultAccount = await prisma.emailAccount.create({
            data: {
                name: 'Default Account',
                email: process.env.EMAIL_FROM || 'it@school.edu',
                type: 'SMTP',
                isDefault: true,
                isActive: false,
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpSecure: false,
            }
        });
    }

    // Template 1: Signature Request
    await prisma.emailTemplate.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Asset Assignment Signature Request',
            subject: 'Action Required: Sign Asset Assignment',
            category: 'borrowing',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{teacherName}', '{signatureUrl}', '{date}']),
            body: `Dear {teacherName},

You have been assigned new equipment or assets. As part of our school's asset policy, we require your digital signature to acknowledge the receipt and condition of these items.

Please click the link below to review and sign your assignment:

{signatureUrl}

This link is secure and valid for 7 days.

---
This is an automated message from the School Asset Management System.
If you did not request this or believe it is an error, please contact the IT Department immediately.`,
        }
    });

    // Template 2: Inspection Report
    await prisma.emailTemplate.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Equipment Inspection Report',
            subject: 'Equipment Inspection Report - {assetName} ({assetCode})',
            category: 'inspection',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{userName}', '{assetName}', '{assetCode}', '{overallCondition}', '{inspectorName}', '{inspectionDate}']),
            body: `Dear {userName},

This is the periodic inspection report for your assigned equipment.

EQUIPMENT INFORMATION:
- Asset Name: {assetName}
- Asset Code: {assetCode}

INSPECTION RESULTS:
- Overall Condition: {overallCondition}

Inspected by: {inspectorName}
Inspection Date: {inspectionDate}

---
This is an automated inspection report from the School Asset Management System.`,
        }
    });

    // Template 3: Damage Approval
    await prisma.emailTemplate.upsert({
        where: { id: 3 },
        update: {},
        create: {
            name: 'Damage Claim Approved',
            subject: 'Damage Claim Approved - {assetName} ({assetCode})',
            category: 'inspection',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{userName}', '{assetName}', '{assetCode}', '{damageDescription}', '{estimatedCost}', '{approverName}']),
            body: `Dear {userName},

Your equipment damage claim has been APPROVED by {approverName}.

EQUIPMENT INFORMATION:
- Equipment: {assetName}
- Asset Code: {assetCode}
- Damage: {damageDescription}
- Repair Cost: ฿{estimatedCost}

---
This is an automated message from the School Asset Management System.`,
        }
    });

    // Template 4: Damage Waiver
    await prisma.emailTemplate.upsert({
        where: { id: 4 },
        update: {},
        create: {
            name: 'Damage Charges Waived',
            subject: 'Damage Charges Waived - {assetName} ({assetCode})',
            category: 'inspection',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{userName}', '{assetName}', '{assetCode}', '{damageDescription}', '{estimatedCost}', '{approverName}', '{waiverReason}']),
            body: `Dear {userName},

Good news! The damage charges for your equipment have been WAIVED by {approverName}.

EQUIPMENT INFORMATION:
- Equipment: {assetName}
- Asset Code: {assetCode}
- Damage: {damageDescription}
- Original Cost: ฿{estimatedCost} (WAIVED)

REASON FOR WAIVER:
{waiverReason}

✅ No further action is required from you.

---
This is an automated message from the School Asset Management System.`,
        }
    });

    // Template 5: Ticket Created/Assigned
    await prisma.emailTemplate.upsert({
        where: { id: 5 },
        update: {},
        create: {
            name: 'Ticket Created & Assigned',
            subject: 'New Ticket Assigned: #{ticketNumber} - {title}',
            category: 'tickets',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{assigneeName}', '{ticketNumber}', '{title}', '{description}', '{priority}', '{category}', '{createdBy}', '{dueDate}', '{ticketUrl}']),
            body: `Hello {assigneeName},

A new support ticket has been assigned to you.

TICKET DETAILS:
- Ticket #: {ticketNumber}
- Title: {title}
- Priority: {priority}
- Category: {category}
- Reported By: {createdBy}
- Due Date: {dueDate}

DESCRIPTION:
{description}

View and update ticket: {ticketUrl}

---
This is an automated message from the School Asset Management System.`,
        }
    });

    // Template 6: Ticket Status Update
    await prisma.emailTemplate.upsert({
        where: { id: 6 },
        update: {},
        create: {
            name: 'Ticket Status Updated',
            subject: 'Ticket #{ticketNumber} Status Changed to {newStatus}',
            category: 'tickets',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{reporterName}', '{ticketNumber}', '{title}', '{oldStatus}', '{newStatus}', '{updatedBy}', '{comments}', '{ticketUrl}']),
            body: `Hello {reporterName},

Your support ticket status has been updated.

TICKET: #{ticketNumber} - {title}
Status Changed: {oldStatus} → {newStatus}
Updated By: {updatedBy}

{comments}

View ticket: {ticketUrl}

---
This is an automated message from the School Asset Management System.`,
        }
    });

    // Template 7: Ticket Completed
    await prisma.emailTemplate.upsert({
        where: { id: 7 },
        update: {},
        create: {
            name: 'Ticket Resolved',
            subject: 'Ticket #{ticketNumber} has been Resolved',
            category: 'tickets',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{reporterName}', '{ticketNumber}', '{title}', '{resolvedBy}', '{resolution}', '{ticketUrl}']),
            body: `Hello {reporterName},

Good news! Your support ticket has been resolved.

TICKET: #{ticketNumber} - {title}
Resolved By: {resolvedBy}

RESOLUTION:
{resolution}

If you have any questions or the issue persists, please reply to this email or reopen the ticket.

View ticket: {ticketUrl}

---
This is an automated message from the School Asset Management System.`,
        }
    });

    // Template 8: Maintenance Request
    await prisma.emailTemplate.upsert({
        where: { id: 8 },
        update: {},
        create: {
            name: 'Maintenance Request Created',
            subject: 'Maintenance Request: {assetName} - {issueType}',
            category: 'maintenance',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{technicianName}', '{assetName}', '{assetCode}', '{issueType}', '{description}', '{priority}', '{requestedBy}', '{location}']),
            body: `Hello {technicianName},

A new maintenance request has been submitted for your attention.

ASSET INFORMATION:
- Asset: {assetName}
- Code: {assetCode}
- Location: {location}

ISSUE:
- Type: {issueType}
- Priority: {priority}
- Requested By: {requestedBy}

DESCRIPTION:
{description}

Please schedule and complete the maintenance as soon as possible.

---
This is an automated message from the School Asset Management System.`,
        }
    });

    // Template 9: PM Schedule Reminder
    await prisma.emailTemplate.upsert({
        where: { id: 9 },
        update: {},
        create: {
            name: 'Preventive Maintenance Reminder',
            subject: 'PM Due: {assetName} - Scheduled for {scheduledDate}',
            category: 'maintenance',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{technicianName}', '{assetName}', '{assetCode}', '{scheduledDate}', '{taskType}', '{instructions}']),
            body: `Hello {technicianName},

This is a reminder that preventive maintenance is due for the following asset:

ASSET: {assetName} ({assetCode})
SCHEDULED DATE: {scheduledDate}
TASK TYPE: {taskType}

INSTRUCTIONS:
{instructions}

Please complete this maintenance task by the scheduled date.

---
This is an automated message from the School Asset Management System.`,
        }
    });

    // Template 10: PM Completed
    await prisma.emailTemplate.upsert({
        where: { id: 10 },
        update: {},
        create: {
            name: 'PM Task Completed',
            subject: 'PM Completed: {assetName}',
            category: 'maintenance',
            emailAccountId: defaultAccount.id,
            variables: JSON.stringify(['{managerName}', '{assetName}', '{assetCode}', '{completedBy}', '{completedDate}', '{findings}', '{nextScheduledDate}']),
            body: `Hello {managerName},

Preventive maintenance has been completed for:

ASSET: {assetName} ({assetCode})
Completed By: {completedBy}
Completed Date: {completedDate}

FINDINGS:
{findings}

Next PM Scheduled: {nextScheduledDate}

---
This is an automated message from the School Asset Management System.`,
        }
    });

    console.log('✅ Created 10 email templates (Borrowing, Inspections, Tickets, Maintenance, PM)');


    // ============================================================
    // 5. ROLE-PERMISSION ASSIGNMENTS
    // ============================================================
    console.log('\n🔐 Assigning Permissions to Roles...');

    const permissionSets = {
        Admin: {
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
        Technician: {
            modules: [
                { code: 'assets', actions: ['view'] },
                { code: 'tickets', actions: ['view', 'create', 'edit'] },
                { code: 'maintenance', actions: ['view', 'create', 'edit'] },
                { code: 'spare_parts', actions: ['view'] },
                { code: 'reports', actions: ['view'] },
            ],
        },
        Inspector: {
            modules: [
                { code: 'assets', actions: ['view'] },
                { code: 'inspections', actions: ['view', 'create', 'edit'] },
                { code: 'tickets', actions: ['view', 'create'] },
                { code: 'reports', actions: ['view'] },
            ],
        },
    };

    for (const [roleName, permSet] of Object.entries(permissionSets)) {
        const role = await prisma.role.findFirst({ where: { name: roleName } });
        if (!role) continue;

        let permCount = 0;
        for (const moduleConfig of permSet.modules) {
            const module = await prisma.module.findUnique({ where: { code: moduleConfig.code } });
            if (!module) continue;

            for (const action of moduleConfig.actions) {
                const permission = await prisma.modulePermission.findUnique({
                    where: {
                        moduleId_action: {
                            moduleId: module.id,
                            action: action
                        }
                    }
                });

                if (permission) {
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
                        }
                    });
                    permCount++;
                }
            }
        }
        console.log(`  ✅ ${roleName}: ${permCount} permissions`);
    }

    // ============================================================
    // 6. ASSETS (using legacy Asset model)
    // ============================================================
    console.log('\n💻 Creating Assets...');
    const laptop1 = await prisma.asset.upsert({
        where: { assetCode: 'LAP-001' },
        update: {},
        create: {
            name: 'MacBook Pro 14" (2023)',
            category: 'Laptop',
            assetCode: 'LAP-001',
            brand: 'Apple',
            model: 'MacBook Pro 14"',
            serialNumber: 'SN-MBP-001',
            purchaseDate: new Date('2023-01-15'),
            cost: 65000,
            location: 'Building 1, Floor 1, Room 101',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    const laptop2 = await prisma.asset.upsert({
        where: { assetCode: 'LAP-002' },
        update: {},
        create: {
            name: 'Dell Latitude 5420',
            category: 'Laptop',
            assetCode: 'LAP-002',
            brand: 'Dell',
            model: 'Latitude 5420',
            serialNumber: 'SN-DELL-002',
            purchaseDate: new Date('2023-03-20'),
            cost: 35000,
            location: 'Building 1, Floor 1, Computer Lab',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    const laptop3 = await prisma.asset.upsert({
        where: { assetCode: 'LAP-003' },
        update: {},
        create: {
            name: 'HP ProBook 450 G9',
            category: 'Laptop',
            assetCode: 'LAP-003',
            brand: 'HP',
            model: 'ProBook 450 G9',
            serialNumber: 'SN-HP-003',
            purchaseDate: new Date('2022-11-10'),
            cost: 28000,
            location: 'Building 1, Floor 1, Computer Lab',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    const tablet1 = await prisma.asset.upsert({
        where: { assetCode: 'TAB-001' },
        update: {},
        create: {
            name: 'iPad Air (5th Gen)',
            category: 'Tablet',
            assetCode: 'TAB-001',
            brand: 'Apple',
            model: 'iPad Air',
            serialNumber: 'SN-IPAD-001',
            purchaseDate: new Date('2023-05-15'),
            cost: 25000,
            location: 'Building 1, Floor 1, Room 102',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    const camera1 = await prisma.asset.upsert({
        where: { assetCode: 'CAM-001' },
        update: {},
        create: {
            name: 'Canon EOS R6',
            category: 'Camera',
            assetCode: 'CAM-001',
            brand: 'Canon',
            model: 'EOS R6',
            serialNumber: 'SN-CANON-CAM-001',
            purchaseDate: new Date('2023-02-10'),
            cost: 95000,
            location: 'Building 1, AV Room',
            status: 'Available',
            departmentId: itDept.id,
        },
    });

    console.log('✅ Assets created');

    // ============================================================
    // 5. INSPECTIONS
    // ============================================================
    console.log('\n🔍 Creating Inspections...');

    // Inspection 1: Damage found (will create ticket)
    const inspection1 = await prisma.inspection.upsert({
        where: { inspectionNumber: 'INS-2024-001' },
        update: {},
        create: {
            inspectionNumber: 'INS-2024-001',
            assetId: laptop2.id,
            inspectorId: inspector1.id,
            inspectionDate: new Date('2024-12-15'),
            inspectionType: 'periodic',
            overallCondition: 'fair',
            damageFound: true,
            damageStatus: 'pending_review',
            damageSeverity: 'moderate',
            damageDescription: 'Laptop screen has noticeable scratches and one small crack in corner. Keyboard shows wear with 2 sticky keys (E and R). Battery health declining.',
            estimatedCost: 8500,
            canContinueUse: true,
            exteriorCondition: 'moderate_wear',
            exteriorNotes: 'Multiple scratches on lid and bottom panel',
            screenCondition: 'cracked',
            screenNotes: 'Small crack in top-right corner, multiple scratches visible',
            buttonPortCondition: 'all_functional',
            keyboardCondition: 'sticking_keys',
            keyboardNotes: 'E and R keys are sticky and require extra pressure',
            touchpadCondition: 'fully_functional',
            batteryHealth: 'replace_soon',
            notes: 'Asset still usable but needs repair before next term. Screen replacement recommended.',
        },
    });

    // Inspection 2: No damage (clean inspection)
    const inspection2 = await prisma.inspection.upsert({
        where: { inspectionNumber: 'INS-2024-002' },
        update: {},
        create: {
            inspectionNumber: 'INS-2024-002',
            assetId: laptop1.id,
            inspectorId: inspector2.id,
            inspectionDate: new Date('2024-12-16'),
            inspectionType: 'periodic',
            overallCondition: 'excellent',
            damageFound: false,
            exteriorCondition: 'no_damage',
            screenCondition: 'perfect',
            buttonPortCondition: 'all_functional',
            keyboardCondition: 'fully_functional',
            touchpadCondition: 'fully_functional',
            batteryHealth: 'normal',
            notes: 'Asset in excellent condition. No issues found.',
        },
    });

    // Inspection 3: Severe damage (will create urgent ticket)
    const inspection3 = await prisma.inspection.upsert({
        where: { inspectionNumber: 'INS-2024-003' },
        update: {},
        create: {
            inspectionNumber: 'INS-2024-003',
            assetId: laptop3.id,
            inspectorId: inspector1.id,
            inspectionDate: new Date('2024-12-20'),
            inspectionType: 'incident',
            overallCondition: 'broken',
            damageFound: true,
            damageStatus: 'pending_review',
            damageSeverity: 'severe',
            damageDescription: 'Laptop was dropped. Screen is completely shattered and non-functional. Bottom case is dented. Will not power on. Suspected motherboard damage.',
            estimatedCost: 25000,
            canContinueUse: false,
            exteriorCondition: 'structural_damage',
            exteriorNotes: 'Significant dent on bottom case, cracked corner',
            screenCondition: 'cracked',
            screenNotes: 'Screen completely shattered, non-functional',
            buttonPortCondition: 'all_functional',
            keyboardCondition: 'fully_functional',
            touchpadCondition: 'fully_functional',
            batteryHealth: 'not_applicable',
            notes: 'CRITICAL: Asset is non-functional. Reported drop incident. May not be economical to repair.',
        },
    });

    // Inspection 4: Minor damage (will create low priority ticket)
    const inspection4 = await prisma.inspection.upsert({
        where: { inspectionNumber: 'INS-2024-004' },
        update: {},
        create: {
            inspectionNumber: 'INS-2024-004',
            assetId: tablet1.id,
            inspectorId: inspector2.id,
            inspectionDate: new Date('2024-12-21'),
            inspectionType: 'periodic',
            overallCondition: 'good',
            damageFound: true,
            damageStatus: 'pending_review',
            damageSeverity: 'minor',
            damageDescription: 'Minor cosmetic scratches on screen. Fully functional.',
            estimatedCost: 1500,
            canContinueUse: true,
            exteriorCondition: 'minor_wear',
            exteriorNotes: 'Light scratches on back panel',
            screenCondition: 'minor_scratches',
            screenNotes: 'A few minor scratches, not affecting visibility',
            buttonPortCondition: 'all_functional',
            batteryHealth: 'normal',
            notes: 'Minor cosmetic wear only. Still very usable.',
        },
    });

    // Inspection 5: Scheduled for future (will NOT create ticket yet)
    const inspection5 = await prisma.inspection.upsert({
        where: { inspectionNumber: 'INS-2024-005' },
        update: {},
        create: {
            inspectionNumber: 'INS-2024-005',
            assetId: camera1.id,
            inspectorId: inspector2.id,
            inspectionDate: new Date('2024-12-28'),
            inspectionType: 'preventive',
            overallCondition: 'excellent',
            damageFound: false,
            notes: 'Scheduled preventive inspection',
        },
    });


    console.log('✅ Inspections created');

    console.log('\n✨ Demo data seed completed!');
    console.log('\n' + '='.repeat(60));
    console.log('📊 Data Summary:');
    console.log('   • Departments: 3 (IT, FM, Maintenance)');
    console.log('   • Roles: 3 (Admin, Technician, Inspector)');
    console.log('   • Users: 5');
    console.log('   • Assets: 5 (Laptops, Tablets, Cameras)');
    console.log('   • Inspections: 5');
    console.log('      - 3 with damage (will auto-create tickets)');
    console.log('      - 2 without damage');

    console.log('\n👥 User Credentials (all passwords: admin123):');
    console.log('   ┌─────────────────────────────────────────────────────┐');
    console.log('   │ 🔐 Admin (Full Access)                             │');
    console.log('   │ 📧 admin@school.com                                │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ 🔍 Inspectors                                       │');
    console.log('   │ 📧 inspector1@school.com (Somchai)                 │');
    console.log('   │ 📧 inspector2@school.com (Siriwan)                 │');
    console.log('   ├─────────────────────────────────────────────────────┤');
    console.log('   │ 🔧 Technicians                                      │');
    console.log('   │ 📧 tech1@school.com (Manop)                        │');
    console.log('   │ 📧 tech2@school.com (Wichai)                       │');
    console.log('   └─────────────────────────────────────────────────────┘');

    console.log('\n🔗 Inspection-Ticket Integration:');
    console.log('   ⚠️  Tickets will be AUTO-CREATED when you:');
    console.log('      1. Run the app and the inspection-ticket action triggers');
    console.log('      2. Or manually create tickets from inspection detail pages');

    console.log('\n🎯 Test Scenarios Available:');
    console.log('   1. View inspections list');
    console.log('   2. View inspection details with damage');
    console.log('   3. Manually create tickets from inspections');
    console.log('   4. Update ticket status and verify sync to inspection');
    console.log('   5. Test different damage severity levels');
    console.log('   6. Test SLA tracking based on priority');

    // ============================================================
    // FM ASSETS - CATEGORIES & DEMO DATA
    // ============================================================
    console.log('\n🏢 Creating FM Asset Categories...');

    const hvacCategory = await prisma.fMAssetCategory.upsert({
        where: { name: 'HVAC System' },
        update: {},
        create: {
            name: 'HVAC System',
            description: 'Heating, Ventilation, and Air Conditioning systems',
        },
    });

    const safetyCategory = await prisma.fMAssetCategory.upsert({
        where: { name: 'Safety Equipment' },
        update: {},
        create: {
            name: 'Safety Equipment',
            description: 'Fire safety and emergency equipment',
        },
    });

    const electricalCategory = await prisma.fMAssetCategory.upsert({
        where: { name: 'Electrical System' },
        update: {},
        create: {
            name: 'Electrical System',
            description: 'Electrical infrastructure and power systems',
        },
    });

    const plumbingCategory = await prisma.fMAssetCategory.upsert({
        where: { name: 'Plumbing System' },
        update: {},
        create: {
            name: 'Plumbing System',
            description: 'Water supply and drainage systems',
        },
    });

    console.log('✅ FM Asset Categories created');

    console.log('\n🏗️ Creating Demo FM Assets...');

    await prisma.fMAsset.upsert({
        where: { assetCode: 'FM-0001' },
        update: {},
        create: {
            assetCode: 'FM-0001',
            name: 'Central Air Conditioning Unit - Building A',
            categoryId: hvacCategory.id,
            type: 'Central HVAC',
            brand: 'Daikin',
            model: 'VRV-X Series',
            serialNumber: 'DKN-2024-A1-001',
            description: 'Main air conditioning system for Building A',
            specifications: '{"capacity":"50 tons","coverage":"10,000 sq.ft","refrigerant":"R-410A"}',
            building: 'Main Building',
            floor: 'Rooftop',
            room: 'Mechanical Room',
            location: 'Main Building, Rooftop, Mechanical Room',
            purchaseDate: new Date('2023-01-15'),
            installDate: new Date('2023-02-01'),
            warrantyExpiry: new Date('2028-02-01'),
            purchaseCost: 850000,
            currentValue: 700000,
            condition: 'good',
            status: 'active',
        },
    });

    await prisma.fMAsset.upsert({
        where: { assetCode: 'FM-0002' },
        update: {},
        create: {
            assetCode: 'FM-0002',
            name: 'Fire Extinguisher - Floor 1',
            categoryId: safetyCategory.id,
            type: 'CO2 Fire Extinguisher',
            brand: 'Safe-T',
            model: 'CO2-10',
            serialNumber: 'SAFE-2024-001',
            description: '10kg CO2 fire extinguisher for electrical fires',
            specifications: '{"weight":"10 kg","type":"CO2","class":"B, C (Electrical)"}',
            building: 'Main Building',
            floor: '1st Floor',
            room: 'Hallway',
            location: 'Main Building, 1st Floor, Hallway',
            purchaseDate: new Date('2024-01-10'),
            warrantyExpiry: new Date('2025-01-10'),
            purchaseCost: 3500,
            currentValue: 3200,
            condition: 'excellent',
            status: 'active',
        },
    });

    await prisma.fMAsset.upsert({
        where: { assetCode: 'FM-0003' },
        update: {},
        create: {
            assetCode: 'FM-0003',
            name: 'Emergency Backup Generator',
            categoryId: electricalCategory.id,
            type: 'Diesel Generator',
            brand: 'Cummins',
            model: 'C200D5',
            serialNumber: 'CUM-2022-GEN-001',
            description: 'Main backup power generator for entire campus',
            specifications: '{"power":"200 kVA","fuel":"Diesel","runtime":"12 hours"}',
            building: 'Generator House',
            floor: 'Ground',
            location: 'Generator House, Ground',
            purchaseDate: new Date('2022-06-01'),
            installDate: new Date('2022-07-15'),
            warrantyExpiry: new Date('2025-07-15'),
            purchaseCost: 1500000,
            currentValue: 1200000,
            condition: 'good',
            status: 'active',
            requiresMaintenance: true,
        },
    });

    await prisma.fMAsset.upsert({
        where: { assetCode: 'FM-0004' },
        update: {},
        create: {
            assetCode: 'FM-0004',
            name: 'Main Distribution Board - Building A',
            categoryId: electricalCategory.id,
            type: 'Distribution Panel',
            brand: 'Schneider Electric',
            model: 'Prisma Plus P',
            serialNumber: 'SCH-2023-MDB-A1',
            description: 'Main electrical distribution panel for Building A',
            specifications: '{"rating":"1000A","voltage":"380V","circuits":"48"}',
            building: 'Main Building',
            floor: 'Ground',
            room: 'Electrical Room',
            location: 'Main Building, Ground, Electrical Room',
            purchaseDate: new Date('2023-03-01'),
            installDate: new Date('2023-03-20'),
            warrantyExpiry: new Date('2028-03-20'),
            purchaseCost: 250000,
            currentValue: 220000,
            condition: 'excellent',
            status: 'active',
        },
    });

    await prisma.fMAsset.upsert({
        where: { assetCode: 'FM-0005' },
        update: {},
        create: {
            assetCode: 'FM-0005',
            name: 'Water Circulation Pump',
            categoryId: plumbingCategory.id,
            type: 'Centrifugal Pump',
            brand: 'Grundfos',
            model: 'CR 32-4',
            serialNumber: 'GRF-2023-PUMP-001',
            description: 'Main water circulation pump for building water supply',
            specifications: '{"flowRate":"32 m³/hr","power":"11 kW","material":"Stainless Steel"}',
            building: 'Main Building',
            floor: 'Basement',
            room: 'Pump Room',
            location: 'Main Building, Basement, Pump Room',
            purchaseDate: new Date('2023-05-10'),
            installDate: new Date('2023-05-25'),
            warrantyExpiry: new Date('2026-05-25'),
            purchaseCost: 180000,
            currentValue: 160000,
            condition: 'good',
            status: 'active',
        },
    });

    console.log('✅ Created 5 demo FM Assets');

    console.log('\n✨ Ready for testing!');
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
