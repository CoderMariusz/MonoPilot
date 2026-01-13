/**
 * React Query Hook: useRescheduleWO
 * Story 03.15: WO Gantt Chart View - Reschedule Mutation
 *
 * Mutation hook for rescheduling work orders via drag-and-drop
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rescheduleWOClient as rescheduleWO } from '@/lib/services/gantt-service';
import { ganttKeys } from './use-gantt-data';
import { workOrderKeys } from './use-work-orders';
import { toast } from 'sonner';
import type { RescheduleParams, RescheduleResponse } from '@/lib/types/gantt';

interface RescheduleInput {
  woId: string;
  params: RescheduleParams;
}

/**
 * Hook to reschedule a work order
 *
 * @returns UseMutationResult for reschedule operation
 */
export function useRescheduleWO() {
  const queryClient = useQueryClient();

  return useMutation<RescheduleResponse, Error, RescheduleInput>({
    mutationFn: ({ woId, params }) => rescheduleWO(woId, params),
    onSuccess: (data) => {
      // Invalidate Gantt data cache
      queryClient.invalidateQueries({ queryKey: ganttKeys.all });
      // Invalidate work orders cache
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all });

      // Show success toast
      toast.success(`${data.data.wo_number} rescheduled to ${data.data.scheduled_date}`);

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning) => {
          toast.warning(warning);
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reschedule work order');
    },
  });
}

export default useRescheduleWO;
