/**
 * React Query Hook: useWOOperationDetail
 * Story 03.12: WO Operations - Single Operation Detail Query
 *
 * Fetches a single operation with full details and variances
 */

import { useQuery } from '@tanstack/react-query';
import type { WOOperationDetail } from '@/lib/types/wo-operation';
import { woOperationKeys } from './use-wo-operations';

/**
 * Fetch single operation detail from API
 */
async function fetchOperationDetail(
  woId: string,
  opId: string
): Promise<WOOperationDetail | null> {
  const response = await fetch(
    `/api/planning/work-orders/${woId}/operations/${opId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to fetch operation');
  }

  const op = await response.json();

  return {
    id: op.id,
    wo_id: op.wo_id,
    sequence: op.sequence,
    operation_name: op.operation_name,
    description: op.description,
    instructions: op.instructions || null,
    machine_id: op.machine_id,
    machine_code: op.machine?.code || op.machine_code || null,
    machine_name: op.machine?.name || op.machine_name || null,
    machine: op.machine || null,
    line_id: op.line_id,
    line_code: op.line?.code || op.line_code || null,
    line_name: op.line?.name || op.line_name || null,
    line: op.line || null,
    expected_duration_minutes: op.expected_duration_minutes,
    expected_yield_percent: op.expected_yield_percent,
    actual_duration_minutes: op.actual_duration_minutes,
    actual_yield_percent: op.actual_yield_percent,
    duration_variance_minutes: op.duration_variance_minutes || null,
    yield_variance_percent: op.yield_variance_percent || null,
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
  };
}

/**
 * Hook to fetch a single operation with full details
 * @param woId - Work Order UUID
 * @param opId - Operation UUID
 * @returns Query result with operation detail
 */
export function useWOOperationDetail(woId: string, opId: string) {
  return useQuery<WOOperationDetail | null>({
    queryKey: woOperationKeys.detail(woId, opId),
    queryFn: () => fetchOperationDetail(woId, opId),
    enabled: !!woId && !!opId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export default useWOOperationDetail;
