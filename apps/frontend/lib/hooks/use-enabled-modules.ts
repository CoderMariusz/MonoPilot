/**
 * useEnabledModules Hook
 * Story: 01.7 - Module Toggles
 * Epic: 01-settings
 *
 * Client-side hook to fetch enabled modules for the current organization.
 * Used for navigation filtering to hide disabled modules.
 *
 * @returns Object with enabled modules array, loading state, and refresh function
 *
 * @example
 * ```typescript
 * function NavigationSidebar() {
 *   const { enabledModules, loading, refresh } = useEnabledModules();
 *
 *   if (loading) return <Skeleton />;
 *
 *   return <nav>
 *     {allModules.filter(m => enabledModules.includes(m.code)).map(...)}
 *   </nav>;
 * }
 * ```
 */

'use client'

import { useEffect, useState } from 'react'

export interface UseEnabledModulesReturn {
  /** Array of enabled module codes (e.g., ['settings', 'technical', 'planning']) */
  enabledModules: string[]
  /** Loading state - true during initial fetch and refresh */
  loading: boolean
  /** Refresh enabled modules list (call after toggling a module) */
  refresh: () => Promise<void>
}

/**
 * Hook to fetch and track enabled modules for current organization
 *
 * Settings module is ALWAYS included in the enabled list since it cannot be disabled.
 * Loading state starts as true and becomes false after first fetch completes.
 *
 * @returns {UseEnabledModulesReturn} Enabled modules, loading state, and refresh function
 */
export function useEnabledModules(): UseEnabledModulesReturn {
  // Settings is always enabled (required for configuration)
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchModules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/modules')

      if (!response.ok) {
        throw new Error('Failed to fetch modules')
      }

      const data = await response.json()

      // Extract enabled module codes
      if (data.modules && Array.isArray(data.modules)) {
        const enabled = data.modules
          .filter((m: any) => m.enabled)
          .map((m: any) => m.code)

        setEnabledModules(enabled)
      } else {
        // Fallback: settings always enabled
        setEnabledModules(['settings'])
      }
    } catch (error) {
      console.error('Failed to fetch enabled modules:', error)
      // Fallback: settings always enabled on error
      setEnabledModules(['settings'])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
  }, [])

  return {
    enabledModules,
    loading,
    refresh: fetchModules,
  }
}
