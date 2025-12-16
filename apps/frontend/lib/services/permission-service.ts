/**
 * Permission Service
 * Story: 01.1 - Org Context + Base RLS
 *
 * Basic permission checks for admin-only operations
 * Full permission matrix tested in Story 01.6
 */

import { ADMIN_ROLES, SYSTEM_ROLES } from '@/lib/constants/roles'

/**
 * Check if user has admin access
 * Admin roles: owner, admin
 *
 * @param roleCode - User's role code
 * @returns true if user has admin access
 */
export function hasAdminAccess(roleCode: string): boolean {
  if (!roleCode) return false
  return ADMIN_ROLES.includes(roleCode as any)
}

/**
 * Check if user can modify organization settings
 * Only owner and admin roles can modify organization
 *
 * @param roleCode - User's role code
 * @returns true if user can modify organization
 */
export function canModifyOrganization(roleCode: string): boolean {
  return hasAdminAccess(roleCode)
}

/**
 * Check if user can modify users (user management)
 * Only owner and admin roles can modify users
 *
 * @param roleCode - User's role code
 * @returns true if user can modify users
 */
export function canModifyUsers(roleCode: string): boolean {
  return hasAdminAccess(roleCode)
}

/**
 * Check if role is a system role
 * System roles are seeded and immutable
 *
 * @param roleCode - Role code to check
 * @returns true if role is a system role
 */
export function isSystemRole(roleCode: string): boolean {
  if (!roleCode) return false
  return SYSTEM_ROLES.includes(roleCode as any)
}

/**
 * Check if user has permission for specific module and operation
 * Full implementation in Story 01.6
 *
 * @param module - Module code (settings, technical, etc.)
 * @param operation - CRUD operation (C, R, U, D)
 * @param permissions - User's permissions from role
 * @returns true if user has permission
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
