/**
 * Permission Service
 * Story: 01.1 - Org Context + Base RLS
 *
 * Basic permission checks for admin-only operations.
 * Full permission matrix will be tested in Story 01.6.
 *
 * **Usage:** Use these functions to check user permissions before
 * performing operations. Always combine with RLS policies for defense in depth.
 */

import { ADMIN_ROLES, SYSTEM_ROLES } from '@/lib/constants/roles'

/**
 * Checks if user has admin access.
 *
 * Admin roles have full access to organization settings and user management.
 * Admin roles: owner, admin
 *
 * @param roleCode - User's role code (from org context)
 * @returns {boolean} true if user has admin access
 *
 * @example
 * ```typescript
 * const context = await getOrgContext(userId);
 * if (hasAdminAccess(context.role_code)) {
 *   // User can modify organization settings
 * }
 * ```
 */
export function hasAdminAccess(roleCode: string): boolean {
  if (!roleCode) return false
  return ADMIN_ROLES.includes(roleCode as any)
}

/**
 * Checks if user can modify organization settings.
 *
 * Only owner and admin roles can modify organization.
 * All other roles have read-only access to organization data.
 *
 * @param roleCode - User's role code
 * @returns {boolean} true if user can modify organization
 *
 * @example
 * ```typescript
 * if (canModifyOrganization(context.role_code)) {
 *   // Allow organization update
 * } else {
 *   throw new ForbiddenError('Insufficient permissions');
 * }
 * ```
 */
export function canModifyOrganization(roleCode: string): boolean {
  return hasAdminAccess(roleCode)
}

/**
 * Checks if user can modify users (user management).
 *
 * Only owner and admin roles can create, update, or delete users.
 * Regular users cannot modify user records.
 *
 * @param roleCode - User's role code
 * @returns {boolean} true if user can modify users
 *
 * @example
 * ```typescript
 * if (canModifyUsers(context.role_code)) {
 *   // Allow user creation/update/deletion
 * }
 * ```
 */
export function canModifyUsers(roleCode: string): boolean {
  return hasAdminAccess(roleCode)
}

/**
 * Checks if role is a system role.
 *
 * System roles are seeded at installation and cannot be modified or deleted.
 * Custom roles can be created in Story 01.6 but system roles are immutable.
 *
 * @param roleCode - Role code to check
 * @returns {boolean} true if role is a system role
 *
 * @example
 * ```typescript
 * if (isSystemRole(role.code)) {
 *   // Prevent modification of system role
 *   throw new ForbiddenError('Cannot modify system roles');
 * }
 * ```
 */
export function isSystemRole(roleCode: string): boolean {
  if (!roleCode) return false
  return SYSTEM_ROLES.includes(roleCode as any)
}

/**
 * Checks if user has permission for specific module and operation.
 *
 * Full implementation will be completed in Story 01.6.
 * Current implementation provides basic CRUD permission checking.
 *
 * **Permission Format:** Permissions are stored as JSONB in roles table:
 * ```json
 * {
 *   "settings": "CRUD",
 *   "technical": "CRUD",
 *   "planning": "CR",
 *   "production": "-"
 * }
 * ```
 *
 * @param module - Module code (settings, technical, etc.)
 * @param operation - CRUD operation: 'C' (Create), 'R' (Read), 'U' (Update), 'D' (Delete)
 * @param permissions - User's permissions from role (context.permissions)
 * @returns {boolean} true if user has permission
 *
 * @example
 * ```typescript
 * const context = await getOrgContext(userId);
 *
 * if (hasPermission('settings', 'U', context.permissions)) {
 *   // User can update settings
 * }
 *
 * if (hasPermission('production', 'C', context.permissions)) {
 *   // User can create production orders
 * }
 * ```
 *
 * @see {@link docs/1-BASELINE/architecture/decisions/ADR-012-role-permission-storage.md}
 */
export function hasPermission(
  module: string,
  operation: 'C' | 'R' | 'U' | 'D',
  permissions: Record<string, string>
): boolean {
  const modulePermissions = permissions[module]
  if (!modulePermissions) return false
  if (modulePermissions === '-') return false
  return modulePermissions.includes(operation)
}
