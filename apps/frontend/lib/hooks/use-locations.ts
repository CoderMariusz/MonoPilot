/**
 * useLocations Hook Stub
 * Story: 01.10 - Machines CRUD
 *
 * Placeholder hook for fetching locations.
 * Will be implemented in warehouse module stories.
 */

import { useQuery } from '@tanstack/react-query'

export interface LocationData {
  id: string
  code: string
  full_path: string
}

export interface UseLocationsResult {
  data: { locations: LocationData[] } | undefined
  isLoading: boolean
  error: Error | null
}

/**
 * Fetches locations for the current organization
 * @returns locations data with loading state
 */
export function useLocations(): UseLocationsResult {
  const query = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      // Placeholder - will be implemented in warehouse module
      return { locations: [] as LocationData[] }
    },
    enabled: false, // Disabled until implemented
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
