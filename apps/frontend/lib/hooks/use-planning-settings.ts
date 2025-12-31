/**
 * React Hook: Planning Settings
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Fetches and updates planning settings using React Query.
 * Provides caching with 5-minute staleTime.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlanningSettings, PlanningSettingsResponse } from '@/lib/types/planning-settings';
import type { PlanningSettingsUpdateInput } from '@/lib/validation/planning-settings-schemas';

/**
 * Query key for planning settings
 */
export const PLANNING_SETTINGS_QUERY_KEY = ['planning-settings'];

/**
 * Hook to fetch planning settings
 * Auto-initializes settings with defaults if none exist
 */
export function usePlanningSettings() {
  return useQuery<PlanningSettings>({
    queryKey: PLANNING_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/settings/planning');
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to fetch planning settings' }));
        throw new Error(error.message || 'Failed to fetch planning settings');
      }
      const data = await res.json();
      return data.settings || data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to update planning settings
 * Invalidates cache on success
 */
export function useUpdatePlanningSettings() {
  const queryClient = useQueryClient();

  return useMutation<PlanningSettingsResponse, Error, Partial<PlanningSettingsUpdateInput>>({
    mutationFn: async (updates) => {
      const res = await fetch('/api/settings/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to update settings' }));
        throw new Error(error.message || 'Failed to update settings');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Update cache with new settings
      queryClient.setQueryData(PLANNING_SETTINGS_QUERY_KEY, data.settings);
    },
  });
}
