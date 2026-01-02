/**
 * PO Approval History Hook
 * Story: 03.5b - PO Approval Workflow
 * Hook for fetching PO approval history
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { POApprovalHistoryEntry } from '@/lib/types/po-approval';

/**
 * Fetch approval history for a PO
 */
async function fetchApprovalHistory(poId: string): Promise<POApprovalHistoryEntry[]> {
  const response = await fetch(`/api/planning/purchase-orders/${poId}/approval-history`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch approval history');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Hook for fetching PO approval history
 */
export function usePOApprovalHistory(poId: string | undefined) {
  return useQuery({
    queryKey: ['po-approval-history', poId],
    queryFn: () => fetchApprovalHistory(poId!),
    enabled: !!poId,
    staleTime: 30000, // 30 seconds
  });
}

export default usePOApprovalHistory;
