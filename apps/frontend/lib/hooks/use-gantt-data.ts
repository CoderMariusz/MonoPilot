/**
 * React Query Hook: useGanttData
 * Story 03.15: WO Gantt Chart View
 *
 * Fetches Gantt chart data with filtering and caching
 */

import { useQuery } from '@tanstack/react-query';
import { getGanttData } from '@/lib/services/gantt-service';
import { createClient } from '@/lib/supabase/client';
import type { GanttFilters, GanttDataResponse } from '@/lib/types/gantt';

// Query keys for cache management
export const ganttKeys = {
  all: ['gantt'] as const,
  data: (filters: GanttFilters) => [...ganttKeys.all, 'data', filters] as const,
};

/**
 * Hook to fetch Gantt chart data with filters
 *
 * @param filters - Gantt filters (view_by, status, date range, etc.)
 * @returns UseQueryResult with Gantt data
 */
export function useGanttData(filters: GanttFilters) {
  return useQuery<GanttDataResponse, Error>({
    queryKey: ganttKeys.data(filters),
    queryFn: () => {
      const supabase = createClient();
      return getGanttData(supabase, filters);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (per spec)
    refetchOnWindowFocus: true,
    refetchInterval: false, // Manual refresh only
  });
}

export default useGanttData;
