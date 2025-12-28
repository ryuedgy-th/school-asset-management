/**
 * Permission System for Multi-Department Asset Management
 * Supports module-based permissions with department isolation
 */

import { User, Role, Department } from '@prisma/client';

// ========================================
// Types & Interfaces
// ========================================

export type ModuleName =
    | 'assets'
    | 'inspections'
    | 'assignments'
    | 'maintenance'  // FM only
    | 'stationary'   // Stationary only
    | 'users'
    | 'reports'
    | 'settings'
    | 'roles'
    | 'departments'
    | 'fm_assets'
    | 'tickets'      // IT & FM tickets
    | 'pm_schedules' // FM PM schedules
    | 'spare_parts'; // FM spare parts inventory

export type PermissionAction =
    | 'view'
    | 'create'
    | 'edit'
    | 'delete'
    | 'approve'
    | 'export';

export type PermissionScope = 'department' | 'cross-department' | 'global';

export interface ModulePermission {
    enabled: boolean;
    permissions?: PermissionAction[];
    filters?: {
        ownDepartmentOnly?: boolean;
        crossDepartment?: boolean;
        categories?: string[];
    };
}

export interface PermissionConfig {
    scope: PermissionScope;
    department?: string;  // Department code (IT, FM, STATIONARY)
    modules: Partial<Record<ModuleName, ModulePermission>>;
}

export interface UserWithRole extends User {
    userRole?: Role | null;
    userDepartment?: Department | null;
}

// ========================================
// Default Permission Configs
// ========================================

export const DEFAULT_PERMISSIONS: Record<string, PermissionConfig> = {
    // IT Department Roles
    IT_ADMIN: {
        scope: 'department',
        department: 'IT',
        modules: {
            assets: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { ownDepartmentOnly: true },
            },
            inspections: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete', 'approve'],
                filters: { ownDepartmentOnly: true },
            },
            assignments: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
            },
            users: {
                enabled: true,
                permissions: ['view', 'create', 'edit'],
            },
            reports: {
                enabled: true,
                permissions: ['view', 'export'],
                filters: { ownDepartmentOnly: true },
            },
            settings: {
                enabled: true,
                permissions: ['view', 'edit'],
            },
            tickets: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { ownDepartmentOnly: true },
            },
            maintenance: { enabled: false },
            stationary: { enabled: false },
        },
    },

    IT_TECHNICIAN: {
        scope: 'department',
        department: 'IT',
        modules: {
            assets: {
                enabled: true,
                permissions: ['view', 'create', 'edit'],
                filters: { ownDepartmentOnly: true },
            },
            inspections: {
                enabled: true,
                permissions: ['view', 'create', 'edit'],
                filters: { ownDepartmentOnly: true },
            },
            assignments: {
                enabled: true,
                permissions: ['view', 'create', 'edit'],
            },
            reports: {
                enabled: true,
                permissions: ['view'],
                filters: { ownDepartmentOnly: true },
            },
            tickets: {
                enabled: true,
                permissions: ['view', 'create', 'edit'],
                filters: { ownDepartmentOnly: true },
            },
            maintenance: { enabled: false },
            stationary: { enabled: false },
        },
    },

    // FM Department Roles
    FM_MANAGER: {
        scope: 'department',
        department: 'FM',
        modules: {
            assets: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { ownDepartmentOnly: true },
            },
            maintenance: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete', 'approve'],
                filters: { ownDepartmentOnly: true },
            },
            reports: {
                enabled: true,
                permissions: ['view', 'export'],
                filters: { ownDepartmentOnly: true },
            },
            inspections: { enabled: false },
            stationary: { enabled: false },
            fm_assets: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { ownDepartmentOnly: true },
            },
            tickets: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { ownDepartmentOnly: true },
            },
            pm_schedules: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete', 'approve'],
                filters: { ownDepartmentOnly: true },
            },
            spare_parts: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { ownDepartmentOnly: true },
            },
        },
    },

    // Stationary Department Roles
    STATIONARY_MANAGER: {
        scope: 'department',
        department: 'STATIONARY',
        modules: {
            stationary: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete', 'approve'],
                filters: { ownDepartmentOnly: true },
            },
            reports: {
                enabled: true,
                permissions: ['view', 'export'],
                filters: { ownDepartmentOnly: true },
            },
            assets: { enabled: false },
            inspections: { enabled: false },
            maintenance: { enabled: false },
        },
    },

    // Cross-Department Roles
    EXECUTIVE: {
        scope: 'cross-department',
        modules: {
            assets: {
                enabled: true,
                permissions: ['view'],
                filters: { crossDepartment: true },
            },
            inspections: {
                enabled: true,
                permissions: ['view'],
                filters: { crossDepartment: true },
            },
            maintenance: {
                enabled: true,
                permissions: ['view'],
                filters: { crossDepartment: true },
            },
            stationary: {
                enabled: true,
                permissions: ['view'],
                filters: { crossDepartment: true },
            },
            reports: {
                enabled: true,
                permissions: ['view', 'export'],
                filters: { crossDepartment: true },
            },
            users: {
                enabled: true,
                permissions: ['view'],
            },
        },
    },

    SUPER_ADMIN: {
        scope: 'global',
        modules: {
            assets: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { crossDepartment: true },
            },
            inspections: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete', 'approve'],
                filters: { crossDepartment: true },
            },
            assignments: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
            },
            maintenance: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { crossDepartment: true },
            },
            fm_assets: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { crossDepartment: true },
            },
            pm_schedules: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete', 'approve'],
                filters: { crossDepartment: true },
            },
            spare_parts: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { crossDepartment: true },
            },
            tickets: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { crossDepartment: true },
            },
            stationary: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
                filters: { crossDepartment: true },
            },
            users: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
            },
            roles: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
            },
            departments: {
                enabled: true,
                permissions: ['view', 'create', 'edit', 'delete'],
            },
            reports: {
                enabled: true,
                permissions: ['view', 'export'],
                filters: { crossDepartment: true },
            },
            settings: {
                enabled: true,
                permissions: ['view', 'edit'],
            },
        },
    },

    // General User Roles
    TEACHER: {
        scope: 'department',
        modules: {
            assignments: {
                enabled: true,
                permissions: ['view'],
            },
            assets: {
                enabled: true,
                permissions: ['view'],
            },
        },
    },

    USER: {
        scope: 'department',
        modules: {
            assets: {
                enabled: true,
                permissions: ['view'],
            },
        },
    },
};

// ========================================
// Permission Functions
// ========================================

/**
 * Parse permissions JSON from database
 */
export function parsePermissions(permissionsJson: string): PermissionConfig {
    try {
        return JSON.parse(permissionsJson) as PermissionConfig;
    } catch (error) {
        console.error('Failed to parse permissions:', error);
        return DEFAULT_PERMISSIONS.USER;
    }
}

/**
 * Get user's permission configuration
 */
export function getUserPermissions(user: UserWithRole): PermissionConfig {
    // Super admin check (legacy role field)
    if (user.role === 'Admin') {
        return DEFAULT_PERMISSIONS.SUPER_ADMIN;
    }

    // Get from role
    if (user.userRole?.permissions) {
        return parsePermissions(user.userRole.permissions);
    }

    // Default to basic user
    return DEFAULT_PERMISSIONS.USER;
}

/**
 * Check if user has access to a specific module
 */
export function hasModuleAccess(
    user: UserWithRole,
    module: ModuleName
): boolean {
    const permissions = getUserPermissions(user);
    const moduleConfig = permissions.modules[module];
    return moduleConfig?.enabled ?? false;
}

/**
 * Check if user has specific permission for a module
 */
export function hasPermission(
    user: UserWithRole,
    module: ModuleName,
    action: PermissionAction
): boolean {
    const permissions = getUserPermissions(user);
    const moduleConfig = permissions.modules[module];

    if (!moduleConfig?.enabled) {
        return false;
    }

    return moduleConfig.permissions?.includes(action) ?? false;
}

/**
 * Check if user can access cross-department data
 */
export function canAccessCrossDepartment(user: UserWithRole): boolean {
    const permissions = getUserPermissions(user);
    return permissions.scope === 'cross-department' || permissions.scope === 'global';
}

/**
 * Get user's department code
 */
export function getUserDepartmentCode(user: UserWithRole): string | null {
    return user.userDepartment?.code ?? null;
}

/**
 * Check if user belongs to specific department
 */
export function isInDepartment(
    user: UserWithRole,
    departmentCode: string
): boolean {
    return getUserDepartmentCode(user) === departmentCode;
}

/**
 * Filter data by department (for queries)
 */
export function getDepartmentFilter(user: UserWithRole) {
    const permissions = getUserPermissions(user);

    // Global scope - no filter
    if (permissions.scope === 'global') {
        return {};
    }

    // Cross-department - no filter
    if (permissions.scope === 'cross-department') {
        return {};
    }

    // Department scope - filter by user's department
    if (user.departmentId) {
        return { departmentId: user.departmentId };
    }

    // Fallback - no data
    return { departmentId: -1 };
}

/**
 * Get list of modules user can access
 */
export function getAccessibleModules(user: UserWithRole): ModuleName[] {
    const permissions = getUserPermissions(user);
    return Object.entries(permissions.modules)
        .filter(([_, config]) => config.enabled)
        .map(([module]) => module as ModuleName);
}

/**
 * Check if user is admin (any level)
 */
export function isAdmin(user: UserWithRole): boolean {
    return user.role === 'Admin' || user.userRole?.name === 'SUPER_ADMIN';
}

/**
 * Check if user is department admin
 */
export function isDepartmentAdmin(user: UserWithRole): boolean {
    const roleName = user.userRole?.name;
    return roleName === 'IT_ADMIN' || roleName === 'FM_MANAGER' || roleName === 'STATIONARY_MANAGER';
}
