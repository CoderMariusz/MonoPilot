/**
 * React Hook: Warehouses List
 * Story: 01.8 - Warehouses CRUD
 *
 * Fetches warehouses list with search, filter, pagination
 * Uses React Query for caching and invalidation
 */

import { useQuery } from '@tanstack/react-query'
import type { Warehouse, WarehouseListParams, PaginatedResult } from '@/lib/types/warehouse'

/**
 * Fetches warehouses with optional filters
 */
export function useWarehouses(params: WarehouseListParams = {}) {
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: async () => {
      // Build query string
      const queryParams = new URLSearchParams()
      if (params.search) queryParams.append('search', params.search)
      if (params.type) queryParams.append('type', params.type)
      if (params.status) queryParams.append('status', params.status)
      if (params.sort) queryParams.append('sort', params.sort)
      if (params.order) queryParams.append('order', params.order)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())

      const url = `/api/v1/settings/warehouses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch warehouses')
      }

      return response.json() as Promise<PaginatedResult<Warehouse>>
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  })
}
