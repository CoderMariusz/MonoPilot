/**
 * React Query Hook: useWOOperations
 * Story 03.12: WO Operations - List Query
 *
 * Fetches operations for a Work Order with caching
 */

import { useQuery } from '@tanstack/react-query';
import type { WOOperation } from '@/lib/types/wo-operation';

// Query keys for cache management
export const woOperationKeys = {
  all: ['wo-operations'] as const,
  lists: () => [...woOperationKeys.all, 'list'] as const,
  list: (woId: string) => [...woOperationKeys.lists(), woId] as const,
  details: () => [...woOperationKeys.all, 'detail'] as const,
  detail: (woId: string, opId: string) => [...woOperationKeys.details(), woId, opId] as const,
};

/**
 * Fetch operations for a WO from API
 */
async function fetchOperationsForWO(woId: string): Promise<WOOperation[]> {
  // Try production API first (has more data), fallback to planning API
  let response = await fetch(`/api/production/work-orders/${woId}/operations`);

  if (!response.ok) {
    // Fallback to planning API
    response = await fetch(`/api/planning/work-orders/${woId}/operations`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to fetch operations');
  }

  const data = await response.json();

  // Handle different response formats
  const operations = data.operations || data.data || [];

  return operations.map((op: any) => ({
    id: op.id,
    wo_id: op.wo_id,
    sequence: op.sequence,
    operation_name: op.operation_name,
    description: op.description,
    machine_id: op.machine_id,
    machine_code: op.machine_code || op.machine?.code || op.machines?.code || null,
    machine_name: op.machine_name || op.machine?.name || op.machines?.name || null,
    line_id: op.line_id,
    line_code: op.line_code || op.line?.code || null,
    line_name: op.line_name || op.line?.name || null,
    expected_duration_minutes: op.expected_duration_minutes,
    expected_yield_percent: op.expected_yield_percent,
    actual_duration_minutes: op.actual_duration_minutes,
    actual_yield_percent: op.actual_yield_percent,
    status: op.status,
    started_at: op.started_at,
    completed_at: op.completed_at,
    started_by: op.started_by,
    completed_by: op.completed_by,
    started_by_user: op.started_by_user || null,
    completed_by_user: op.completed_by_user || null,
    skip_reason: op.skip_reason,
    notes: op.notes,
    created_at: op.created_at,
    updated_at: op.updated_at,
  }));
}

/**
 * Hook to fetch operations for a Work Order
 * @param woId - Work Order UUID
 * @returns Query result with operations array
 */
export function useWOOperations(woId: string) {
  return useQuery<WOOperation[]>({
    queryKey: woOperationKeys.list(woId),
    queryFn: () => fetchOperationsForWO(woId),
    enabled: !!woId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export default useWOOperations;
