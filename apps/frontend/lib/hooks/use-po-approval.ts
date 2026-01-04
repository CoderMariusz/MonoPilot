/**
 * PO Approval Hook
 * Story: 03.5b - PO Approval Workflow
 * Hook for managing PO approval workflow actions
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApprovePoInput,
  RejectPoInput,
  SubmitPoInput,
  POApproveResponse,
  PORejectResponse,
  POSubmitResponse,
} from '@/lib/types/po-approval';

/**
 * Submit a PO for approval
 */
async function submitPO(input: SubmitPoInput): Promise<POSubmitResponse> {
  const response = await fetch(`/api/planning/purchase-orders/${input.poId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit PO for approval');
  }

  return response.json();
}

/**
 * Approve a PO
 */
async function approvePO(input: ApprovePoInput): Promise<POApproveResponse> {
  const response = await fetch(`/api/planning/purchase-orders/${input.poId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes: input.notes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to approve PO');
  }

  return response.json();
}

/**
 * Reject a PO
 */
async function rejectPO(input: RejectPoInput): Promise<PORejectResponse> {
  const response = await fetch(`/api/planning/purchase-orders/${input.poId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rejection_reason: input.rejectionReason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reject PO');
  }

  return response.json();
}

/**
 * Return type for usePOApproval hook
 */
export interface UsePOApprovalReturn {
  submitPO: ReturnType<typeof useMutation<POSubmitResponse, Error, SubmitPoInput>>;
  approvePO: ReturnType<typeof useMutation<POApproveResponse, Error, ApprovePoInput>>;
  rejectPO: ReturnType<typeof useMutation<PORejectResponse, Error, RejectPoInput>>;
  isSubmitting: boolean;
  isApproving: boolean;
  isRejecting: boolean;
}

/**
 * Hook for PO approval workflow actions
 */
export function usePOApproval(): UsePOApprovalReturn {
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: submitPO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: approvePO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectPO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
    },
  });

  return {
    submitPO: submitMutation,
    approvePO: approveMutation,
    rejectPO: rejectMutation,
    isSubmitting: submitMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

export default usePOApproval;
