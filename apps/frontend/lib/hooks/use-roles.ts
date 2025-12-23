/**
 * React Hook: Roles List
 * Story: 01.5a - User Management CRUD
 *
 * Fetches system roles for user role selection
 */

import { useState, useEffect } from 'react'
import type { Role } from '@/lib/types/user'

/**
 * Fetches all system roles
 */
export function useRoles() {
  const [data, setData] = useState<Role[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/settings/roles')

        if (!response.ok) {
          throw new Error('Failed to fetch roles')
        }

        const roles = await response.json()
        setData(roles)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  return { data, isLoading, error }
}
