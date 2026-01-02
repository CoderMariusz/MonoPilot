/**
 * Can Approve Hook
 * Story: 03.5b - PO Approval Workflow
 * Hook to check if current user can approve POs
 */

'use client';

import { useQuery } from '@tanstack/react-query';

interface CanApproveData {
  canApprove: boolean;
  approvalRoles: string[];
  userRole: string;
}

/**
 * Fetch approval permissions for current user
 */
async function fetchCanApprove(): Promise<CanApproveData> {
  const response = await fetch('/api/planning/settings');

  if (!response.ok) {
    // If we can't fetch settings, assume user cannot approve
    return {
      canApprove: false,
      approvalRoles: [],
      userRole: '',
    };
  }

  const data = await response.json();
  const settings = data.data;

  // Get user role from session/auth
  const userResponse = await fetch('/api/auth/session');
  const userData = await userResponse.json();
  const userRole = userData?.user?.role || '';

  const approvalRoles = settings?.po_approval_roles || ['admin', 'manager'];
  const canApprove = approvalRoles.includes(userRole);

  return {
    canApprove,
    approvalRoles,
    userRole,
  };
}

/**
 * Return type for useCanApprove hook
 */
export interface UseCanApproveReturn {
  canApprove: boolean;
  isLoading: boolean;
  approvalRoles: string[];
}

/**
 * Hook to check if current user can approve POs
 */
export function useCanApprove(): UseCanApproveReturn {
  const { data, isLoading } = useQuery({
    queryKey: ['can-approve-po'],
    queryFn: fetchCanApprove,
    staleTime: 60000, // 1 minute
  });

  return {
    canApprove: data?.canApprove ?? false,
    isLoading,
    approvalRoles: data?.approvalRoles ?? [],
  };
}

export default useCanApprove;
