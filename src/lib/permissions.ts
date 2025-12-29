/**
 * Permission Helper - Backward Compatibility Wrapper
 * This provides sync-like interface for Server Components and API routes
 * while using the new async permission system
 */

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as PermissionsV2 from './permissions-v2';

// ========================================
// Helper: Get Current User ID
// ========================================

async function getCurrentUserId(): Promise<number | null> {
    const session = await auth();
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    });

    return user?.id || null;
}

// ========================================
// Server Component Helpers
// ========================================

/**
 * Check permission for current logged-in user (Server Component)
 */
export async function checkPermission(
    moduleCode: string,
    action: string
): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    return PermissionsV2.hasPermission(userId, moduleCode, action);
}

/**
 * Check module access for current logged-in user (Server Component)
 */
export async function checkModuleAccess(moduleCode: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    return PermissionsV2.hasModuleAccess(userId, moduleCode);
}

/**
 * Require permission - throws or redirects if not authorized (Server Component)
 */
export async function requirePermission(
    moduleCode: string,
    action: string
): Promise<void> {
    const hasIt = await checkPermission(moduleCode, action);
    if (!hasIt) {
        throw new Error('Forbidden: Insufficient permissions');
    }
}

/**
 * Require module access - throws or redirects if not authorized (Server Component)
 */
export async function requireModuleAccess(moduleCode: string): Promise<void> {
    const hasIt = await checkModuleAccess(moduleCode);
    if (!hasIt) {
        throw new Error('Forbidden: No access to this module');
    }
}

// ========================================
// API Route Helpers (with user object)
// ========================================

/**
 * Check if user has permission (API Route)
 */
export async function hasPermissionForUser(
    userId: number,
    moduleCode: string,
    action: string
): Promise<boolean> {
    return PermissionsV2.hasPermission(userId, moduleCode, action);
}

/**
 * Check if user has module access (API Route)  
 */
export async function hasModuleAccessForUser(
    userId: number,
    moduleCode: string
): Promise<boolean> {
    return PermissionsV2.hasModuleAccess(userId, moduleCode);
}

/**
 * Get department filter for user (for data isolation)
 */
export async function getDepartmentFilterForUser(userId: number) {
    return PermissionsV2.getDepartmentFilter(userId);
}

// ========================================
// Re-export V2 Functions
// ========================================

export {
    getUserPermissions,
    getAccessibleModules,
    type ModuleName,
    type PermissionAction,
    getAllModules,
    getUserModules,
    getModulePermissions,
    isAdmin,
    getUserRole,
    canAccessCrossDepartment,
    getDepartmentFilter,  // Added for backward compatibility
} from './permissions-v2';

// ========================================
// Legacy Compatibility Layer
// ========================================

/**
 * @deprecated Use checkModuleAccess() instead
 * Legacy sync-style wrapper for backward compatibility
 * WARNING: This is async now! Update call sites.
 */
export async function hasModuleAccess(
    user: { id: number },
    moduleCode: string
): Promise<boolean> {
    console.warn(`⚠️ hasModuleAccess() called with user object - use checkModuleAccess() or hasModuleAccessForUser() instead`);
    return PermissionsV2.hasModuleAccess(user.id, moduleCode);
}

/**
 * @deprecated Use checkPermission() instead
 */
export async function hasPermission(
    user: { id: number },
    moduleCode: string,
    action: string
): Promise<boolean> {
    console.warn(`⚠️ hasPermission() called with user object - use checkPermission() or hasPermissionForUser() instead`);
    return PermissionsV2.hasPermission(user.id, moduleCode, action);
}
