/**
 * useSettingsPermissions Hook
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Hook to check user's CRUD permissions for settings module.
 *
 * Returns:
 * - canRead: boolean
 * - canWrite: boolean (Create + Update)
 * - canDelete: boolean
 * - loading: boolean
 */

'use client'

import { useMemo } from 'react'
import { useOrgContext } from './useOrgContext'
import { hasPermission } from '@/lib/services/permission-service'

/**
 * Hook to get user's settings permissions
 *
 * @returns Object with canRead, canWrite, canDelete, and loading properties
 *
 * @example
 * ```typescript
 * function SettingsPage() {
 *   const { canRead, canWrite, canDelete, loading } = useSettingsPermissions();
 *
 *   if (loading) return <Skeleton />;
 *   if (!canRead) return <Forbidden />;
 *
 *   return (
 *     <div>
 *       {canWrite && <Button>Edit</Button>}
 *       {canDelete && <Button>Delete</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSettingsPermissions() {
  const { data: context, isLoading } = useOrgContext()

  return useMemo(() => {
    if (!context?.role_code) {
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        loading: isLoading,
      }
    }

    const roleCode = context.role_code

    return {
      canRead: hasPermission(roleCode, 'settings', 'read'),
      canWrite:
        hasPermission(roleCode, 'settings', 'update') ||
        hasPermission(roleCode, 'settings', 'create'),
      canDelete: hasPermission(roleCode, 'settings', 'delete'),
      loading: isLoading,
    }
  }, [context, isLoading])
}
