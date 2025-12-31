/**
 * WO Materials Hooks - Story 03.11a
 *
 * React Query hooks for WO materials management:
 * - useWOMaterials: Fetch materials for a Work Order
 * - useRefreshSnapshot: Mutation to refresh BOM snapshot
 *
 * @module lib/hooks/use-wo-materials
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWOMaterials,
  refreshSnapshot,
} from '@/lib/services/wo-materials-service'
import type {
  WOMaterialsListResponse,
  CreateSnapshotResponse,
} from '@/lib/types/wo-materials'

/**
 * Query key factory for WO materials
 */
export const woMaterialsKeys = {
  all: ['wo-materials'] as const,
  list: (woId: string) => [...woMaterialsKeys.all, woId] as const,
}

/**
 * Hook to fetch WO materials
 *
 * @param woId - UUID of the Work Order
 * @param options - React Query options
 * @returns Query result with materials data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWOMaterials(woId)
 *
 * if (isLoading) return <Skeleton />
 * if (error) return <Error message={error.message} />
 * if (!data?.materials.length) return <EmptyState />
 *
 * return <MaterialsTable materials={data.materials} />
 * ```
 */
export function useWOMaterials(woId: string, options?: { enabled?: boolean }) {
  return useQuery<WOMaterialsListResponse, Error>({
    queryKey: woMaterialsKeys.list(woId),
    queryFn: () => getWOMaterials(woId),
    enabled: options?.enabled !== false && !!woId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to refresh BOM snapshot
 *
 * @returns Mutation for refreshing snapshot
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useRefreshSnapshot()
 *
 * const handleRefresh = () => {
 *   mutate(woId, {
 *     onSuccess: () => toast({ title: 'Materials refreshed' }),
 *     onError: (error) => toast({ title: 'Error', description: error.message }),
 *   })
 * }
 * ```
 */
export function useRefreshSnapshot() {
  const queryClient = useQueryClient()

  return useMutation<CreateSnapshotResponse, Error, string>({
    mutationFn: (woId: string) => refreshSnapshot(woId),
    onSuccess: (_, woId) => {
      // Invalidate the materials query to refetch
      queryClient.invalidateQueries({ queryKey: woMaterialsKeys.list(woId) })
    },
  })
}
