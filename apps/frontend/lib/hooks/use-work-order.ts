/**
 * React Query Hook: useWorkOrder
 * Story 03.10: Work Order CRUD - Single WO Query
 *
 * Fetches a single work order with all relations
 */

import { useQuery } from '@tanstack/react-query'
import type { WorkOrderWithRelations } from '@/lib/types/work-order'
import { workOrderKeys } from './use-work-orders'

/**
 * Fetch single work order from API
 */
async function fetchWorkOrder(id: string): Promise<WorkOrderWithRelations> {
  const response = await fetch(`/api/planning/work-orders/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Work order not found')
    }
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to fetch work order')
  }

  const data = await response.json()
  return data.data || data.work_order || data
}

/**
 * Hook to fetch a single work order with relations
 */
export function useWorkOrder(id: string | null | undefined) {
  return useQuery({
    queryKey: workOrderKeys.detail(id || ''),
    queryFn: () => fetchWorkOrder(id!),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export default useWorkOrder
