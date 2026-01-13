/**
 * React Query Hook: useCheckAvailability
 * Story 03.15: WO Gantt Chart View - Pre-drop Validation
 *
 * Mutation hook for checking line availability before drop
 */

import { useMutation } from '@tanstack/react-query';
import { checkLineAvailability } from '@/lib/services/gantt-service';
import { createClient } from '@/lib/supabase/client';
import type { AvailabilityCheckParams, AvailabilityCheckResponse } from '@/lib/types/gantt';

/**
 * Hook to check line availability for scheduling
 *
 * Used during drag-and-drop to validate target time slot
 *
 * @returns UseMutationResult for availability check
 */
export function useCheckAvailability() {
  return useMutation<AvailabilityCheckResponse, Error, AvailabilityCheckParams>({
    mutationFn: async (params) => {
      const supabase = createClient();
      return checkLineAvailability(supabase, params);
    },
    // No toast on error - handled by UI (ghost bar color)
  });
}

export default useCheckAvailability;
