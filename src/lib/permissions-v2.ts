/**
 * Enterprise RBAC Permission System (New)
 * Uses relational tables instead of JSON
 */

import { prisma } from '@/lib/prisma';

// ========================================
// Types
// ========================================

export interface UserPermission {
    module: string;
    action: string;
    scopeFilter?: Record<string, any>;
}

export interface ModuleInfo {
    id: number;
    code: string;
    name: string;
    description?: string;
    category?: string;
    icon?: string;
    routePath?: string;
}

// ========================================
// Permission Check Functions
// ========================================

/**
 * Check if user has specific permission
 * @param userId User ID
 * @param moduleCode Module code (e.g., 'assets', 'tickets')
 * @param action Action (e.g., 'view', 'create', 'edit', 'delete')
 * @returns true if user has permission
 */
export async function hasPermission(
    userId: number,
    moduleCode: string,
    action: string
): Promise<boolean> {
    try {
        const permission = await prisma.rolePermission.findFirst({
            where: {
                role: {
                    users: {
                        some: { id: userId }
                    },
                    isActive: true
                },
                permission: {
                    module: {
                        code: moduleCode,
                        isActive: true
                    },
                    action: action
                }
            }
        });

        return !!permission;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * Check if user has any permission for a module (module access)
 * @param userId User ID
 * @param moduleCode Module code
 * @returns true if user has at least one permission for the module
 */
export async function hasModuleAccess(
    userId: number,
    moduleCode: string
): Promise<boolean> {
    try {
        const permission = await prisma.rolePermission.findFirst({
            where: {
                role: {
                    users: {
                        some: { id: userId }
                    },
                    isActive: true
                },
                permission: {
                    module: {
                        code: moduleCode,
                        isActive: true
                    }
                }
            }
        });

        return !!permission;
    } catch (error) {
        console.error('Error checking module access:', error);
        return false;
    }
}

/**
 * Get all permissions for a user (for caching)
 * @param userId User ID
 * @returns Array of user permissions
 */
export async function getUserPermissions(userId: number): Promise<UserPermission[]> {
    try {
        const rolePermissions = await prisma.rolePermission.findMany({
            where: {
                role: {
                    users: {
                        some: { id: userId }
                    },
                    isActive: true
                }
            },
            include: {
                permission: {
                    include: {
                        module: true
                    }
                }
            }
        });

        return rolePermissions.map(rp => ({
            module: rp.permission.module.code,
            action: rp.permission.action,
            scopeFilter: rp.scopeFilter ? JSON.parse(rp.scopeFilter) : undefined
        }));
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return [];
    }
}

/**
 * Get all modules user can access
 * @param userId User ID
 * @returns Array of module codes
 */
export async function getAccessibleModules(userId: number): Promise<string[]> {
    try {
        const permissions = await getUserPermissions(userId);
        const uniqueModules = new Set(permissions.map(p => p.module));
        return Array.from(uniqueModules);
    } catch (error) {
        console.error('Error getting accessible modules:', error);
        return [];
    }
}

/**
 * Get all active modules with details
 * @returns Array of modules
 */
export async function getAllModules(): Promise<ModuleInfo[]> {
    try {
        return await prisma.module.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                category: true,
                icon: true,
                routePath: true
            }
        });
    } catch (error) {
        console.error('Error getting modules:', error);
        return [];
    }
}

/**
 * Get modules user can access with details
 * @param userId User ID
 * @returns Array of accessible modules with details
 */
export async function getUserModules(userId: number): Promise<ModuleInfo[]> {
    try {
        const accessibleCodes = await getAccessibleModules(userId);
        const allModules = await getAllModules();
        return allModules.filter(m => accessibleCodes.includes(m.code));
    } catch (error) {
        console.error('Error getting user modules:', error);
        return [];
    }
}

/**
 * Get all available permissions for a module
 * @param moduleCode Module code
 * @returns Array of permission actions
 */
export async function getModulePermissions(moduleCode: string): Promise<string[]> {
    try {
        const module = await prisma.module.findUnique({
            where: { code: moduleCode },
            include: {
                permissions: {
                    select: { action: true }
                }
            }
        });

        return module?.permissions.map(p => p.action) || [];
    } catch (error) {
        console.error('Error getting module permissions:', error);
        return [];
    }
}

/**
 * Check if user is admin (has access to system modules)
 * @param userId User ID
 * @returns true if user is admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
    return hasModuleAccess(userId, 'roles') || hasModuleAccess(userId, 'users');
}

/**
 * Get user's role info
 * @param userId User ID
 * @returns Role information
 */
export async function getUserRole(userId: number) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRole: {
                    include: {
                        department: true
                    }
                }
            }
        });

        return user?.userRole || null;
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}

/**
 * Check permissions in bulk (for caching)
 * @param userId User ID
 * @param checks Array of { module, action } to check
 * @returns Map of check results
 */
export async function checkPermissionsBulk(
    userId: number,
    checks: Array<{ module: string; action: string }>
): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const permissions = await getUserPermissions(userId);

    for (const check of checks) {
        const key = `${check.module}:${check.action}`;
        const hasIt = permissions.some(
            p => p.module === check.module && p.action === check.action
        );
        results.set(key, hasIt);
    }

    return results;
}

// ========================================
// Department & Scope Filters (for queries)
// ========================================

/**
 * Get department filter for user (for data isolation)
 * @param userId User ID
 * @returns Department filter object for Prisma queries
 */
export async function getDepartmentFilter(userId: number) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRole: true,
                userDepartment: true
            }
        });

        if (!user) return { departmentId: -1 }; // No access

        // Check if user has cross-department access
        const role = user.userRole;
        if (role?.scope === 'global' || role?.scope === 'cross-department') {
            return {}; // No filter = see all
        }

        // Department-scoped user
        if (user.departmentId) {
            return { departmentId: user.departmentId };
        }

        return { departmentId: -1 }; // No access
    } catch (error) {
        console.error('Error getting department filter:', error);
        return { departmentId: -1 };
    }
}

/**
 * Check if user can access cross-department data
 * @param userId User ID
 * @returns true if user has cross-department or global scope
 */
export async function canAccessCrossDepartment(userId: number): Promise<boolean> {
    try {
        const role = await getUserRole(userId);
        return role?.scope === 'global' || role?.scope === 'cross-department';
    } catch (error) {
        console.error('Error checking cross-department access:', error);
        return false;
    }
}
