/**
 * usePermissions Hook
 * Story: 01.6 - Role-Based Permissions (10 Roles)
 *
 * React hook for permission checks in components.
 * Provides can() function to check if user has specific module/action permission.
 */

import { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import { useOrgContext } from './useOrgContext'
import { PERMISSION_MATRIX, ROLES, canAccess, hasAction, type Module, type Action, type SystemRole } from '@/lib/constants/permissions'

// Permission actions
export type PermissionAction = 'C' | 'R' | 'U' | 'D'

// Module names
export type ModuleName =
  | 'settings'
  | 'users'
  | 'technical'
  | 'planning'
  | 'production'
  | 'quality'
  | 'warehouse'
  | 'shipping'
  | 'npd'
  | 'finance'
  | 'oee'
  | 'integrations'

export interface UsePermissionsResult {
  /**
   * Check if user has permission for action on module
   */
  can: (module: ModuleName | string, action: PermissionAction) => boolean
  /**
   * Check if user has any permission on module
   */
  canAny: (module: ModuleName | string) => boolean
  /**
   * Check if module is read-only (no create/update/delete)
   */
  isReadOnly: (module: ModuleName | string) => boolean
  /**
   * Current user role code
   */
  role: SystemRole | null
  /**
   * Role display name
   */
  roleName: string | null
  /**
   * Loading state
   */
  loading: boolean
}

/**
 * Hook for checking user permissions
 *
 * @example
 * const { can, role } = usePermissions()
 * if (can('production', 'C')) {
 *   // Show create button
 * }
 */
export function usePermissions(options?: {
  onPermissionChange?: (data: {
    type: 'upgrade' | 'downgrade'
    oldRole: SystemRole
    newRole: SystemRole
    message: string
  }) => void
}): UsePermissionsResult {
  // Get user from context or mock for testing
  let user: any = null

  // First, try to get from OrgContext
  try {
    const orgContext = useOrgContext()
    user = orgContext?.user
  } catch (e) {
    // useOrgContext not available or threw error
    // This is expected in tests
  }

  // If still no user, check global mock (for tests)
  if (!user) {
    if (typeof globalThis !== 'undefined' && (globalThis as any).__MOCK_USER__) {
      user = (globalThis as any).__MOCK_USER__
    }
  }

  // Use ref for cache to avoid state updates in callbacks
  const permissionCacheRef = useRef<Map<string, boolean>>(new Map())

  const userRole = (user?.role as SystemRole) || null

  // Listen for real-time permission updates
  useEffect(() => {
    const handlePermissionUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      const { newRole, oldRole } = customEvent.detail

      if (oldRole && newRole && oldRole !== newRole) {
        const oldRoleObj = ROLES[oldRole]
        const newRoleObj = ROLES[newRole]

        // Determine if it's an upgrade or downgrade based on display order
        const isUpgrade = newRoleObj.display_order < oldRoleObj.display_order

        options?.onPermissionChange?.({
          type: isUpgrade ? 'upgrade' : 'downgrade',
          oldRole,
          newRole,
          message: `Permissions updated to ${newRoleObj.name}`,
        })
      }

      // Clear cache on permission update
      permissionCacheRef.current.clear()
    }

    window.addEventListener('permissions-updated', handlePermissionUpdate)
    return () => {
      window.removeEventListener('permissions-updated', handlePermissionUpdate)
    }
  }, [options])

  // Clear cache when role changes
  useEffect(() => {
    permissionCacheRef.current.clear()
  }, [userRole])

  const can = useCallback(
    (module: ModuleName | string, action: PermissionAction): boolean => {
      if (!userRole) return false

      // Validate inputs
      if (!isValidModule(module) || !isValidAction(action)) {
        return false
      }

      // Check cache
      const cacheKey = `${userRole}:${module}:${action}`
      if (permissionCacheRef.current.has(cacheKey)) {
        return permissionCacheRef.current.get(cacheKey) || false
      }

      // Check permission
      const hasPermission = canAccess(userRole, module as Module, action as Action)

      // Update cache
      permissionCacheRef.current.set(cacheKey, hasPermission)

      return hasPermission
    },
    [userRole]
  )

  const canAny = useCallback(
    (module: ModuleName | string): boolean => {
      if (!userRole) return false

      if (!isValidModule(module)) {
        return false
      }

      const rolePerms = PERMISSION_MATRIX[userRole]
      if (!rolePerms) return false

      const permSet = rolePerms.modules[module as Module]
      return permSet && permSet !== '-'
    },
    [userRole]
  )

  const isReadOnly = useCallback(
    (module: ModuleName | string): boolean => {
      if (!userRole) return true

      if (!isValidModule(module)) {
        return true
      }

      // Check if user can modify existing items (Update)
      // Create is for new items, Update is for existing items
      const canModifyExisting = can(module, 'U')
      return !canModifyExisting
    },
    [userRole, can]
  )

  const roleName = useMemo(() => {
    if (!userRole) return null
    return ROLES[userRole]?.name || null
  }, [userRole])

  const result = useMemo<UsePermissionsResult>(
    () => ({
      can,
      canAny,
      isReadOnly,
      role: userRole,
      roleName,
      loading: false,
    }),
    [can, canAny, isReadOnly, userRole, roleName]
  )

  return result
}

/**
 * Validate that module is a known module
 */
function isValidModule(module: string | ModuleName): boolean {
  const validModules: Module[] = [
    'settings',
    'users',
    'technical',
    'planning',
    'production',
    'quality',
    'warehouse',
    'shipping',
    'npd',
    'finance',
    'oee',
    'integrations',
  ]
  return validModules.includes(module as Module)
}

/**
 * Validate that action is a known action
 */
function isValidAction(action: string | Action): boolean {
  return ['C', 'R', 'U', 'D'].includes(action)
}
