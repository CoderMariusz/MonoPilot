/**
 * useOrgContext Hook
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Client-side hook to fetch organization context for the current user.
 * Wraps the server-side getOrgContext from Story 01.1.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OrgContext } from '@/lib/types/organization'

/**
 * Hook to fetch organization context for authenticated user
 *
 * @returns Object with org context data, loading state, error, and refetch function
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { data: context, isLoading, error, refetch } = useOrgContext();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorMessage onRetry={refetch} />;
 *   if (!context) return null;
 *
 *   return <div>Welcome, {context.role_name}</div>;
 * }
 * ```
 */
export function useOrgContext() {
  const [data, setData] = useState<OrgContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchContext = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/v1/settings/context')

      if (!response.ok) {
        throw new Error('Failed to fetch organization context')
      }

      const context = await response.json()
      setData(context)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Unknown error occurred')
      )
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContext()
  }, [fetchContext])

  return {
    data,
    isLoading,
    error,
    refetch: fetchContext,
  }
}
