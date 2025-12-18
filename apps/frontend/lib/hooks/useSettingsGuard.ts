/**
 * useSettingsGuard Hook
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Reusable hook for role-based access control in settings pages.
 *
 * Returns:
 * - allowed: boolean - whether user has required role
 * - loading: boolean - whether context is loading
 * - role: string | null - user's current role code
 */

'use client'

import { useMemo } from 'react'
import { useOrgContext } from './useOrgContext'
import type { SystemRole } from '@/lib/constants/roles'

export type RoleCode = SystemRole

/**
 * Hook to check if user has required role(s) for route access
 *
 * @param requiredRole - Single role or array of roles required for access
 * @returns Object with allowed, loading, and role properties
 *
 * @example
 * ```typescript
 * // Single role requirement
 * const { allowed, loading, role } = useSettingsGuard('admin');
 *
 * // Multiple roles (user needs one of them)
 * const { allowed, loading, role } = useSettingsGuard(['admin', 'owner']);
 *
 * // No role requirement (public settings route)
 * const { allowed, loading, role } = useSettingsGuard();
 * ```
 */
export function useSettingsGuard(requiredRole?: RoleCode | RoleCode[]) {
  const { data: context, isLoading } = useOrgContext()

  const allowed = useMemo(() => {
    if (!context) return false
    if (!requiredRole) return true

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(context.role_code as RoleCode)
  }, [context, requiredRole])

  return {
    allowed,
    loading: isLoading,
    role: (context?.role_code as RoleCode) || null,
  }
}
