/**
 * React Hook: Machines List
 * Story: 01.10 - Machines CRUD
 *
 * Fetches machines list with search, filter, pagination
 * Uses React Query for caching and invalidation
 */

import { useQuery } from '@tanstack/react-query'
import type { Machine, MachineListParams } from '@/lib/types/machine'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

/**
 * Fetches machines with optional filters
 */
export function useMachines(params: MachineListParams = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['machines', params],
    queryFn: async () => {
      // Build query string
      const queryParams = new URLSearchParams()
      if (params.search) queryParams.append('search', params.search)
      if (params.type) queryParams.append('type', params.type)
      if (params.status) queryParams.append('status', params.status)
      if (params.location_id) queryParams.append('location_id', params.location_id)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())

      const url = `/api/v1/settings/machines${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch machines')
      }

      return response.json() as Promise<PaginatedResult<Machine>>
    },
    staleTime: 30000, // Cache for 30 seconds
  })

  return { data, isLoading, error }
}
