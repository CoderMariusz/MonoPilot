/**
 * useLocations Hook
 * Story: 01.10 - Machines CRUD, WH-INV-001 - Inventory Browser
 *
 * Fetches locations from the API with optional warehouse filter.
 */

import { useQuery } from '@tanstack/react-query'
import type { Location } from '@/lib/types/location'

export interface LocationData {
  id: string
  code: string
  name: string
  full_path: string
  warehouse_id: string
}

export interface UseLocationsResult {
  locations: Location[]
  data: { locations: Location[] } | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Fetches locations for the current organization
 * @param warehouseId - Optional warehouse ID to filter locations
 * @returns locations data with loading state
 */
export function useLocations(warehouseId?: string): UseLocationsResult {
  const query = useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (warehouseId) {
        params.append('warehouse_id', warehouseId)
      }
      params.append('view', 'flat')

      const response = await fetch(`/api/settings/warehouses/locations?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }
      const result = await response.json()
      return { locations: result.data || [] }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    locations: query.data?.locations || [],
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
