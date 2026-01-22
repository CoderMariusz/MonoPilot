/**
 * React Hook: Quality Settings
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * Fetches and updates quality settings using React Query.
 * Provides caching with 5-minute staleTime.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QualitySettings, UpdateQualitySettingsInput } from '@/lib/validation/quality-settings';
import { QUALITY_SETTINGS_UPDATE_ROLES } from '@/lib/services/quality-settings-service';

/**
 * Query key for quality settings
 */
export const QUALITY_SETTINGS_QUERY_KEY = ['quality-settings'];

/**
 * Response type for quality settings API
 */
interface QualitySettingsResponse {
  settings: QualitySettings;
  message?: string;
}

/**
 * Hook to fetch quality settings
 * Auto-initializes settings with defaults if none exist
 */
export function useQualitySettings() {
  return useQuery<QualitySettings>({
    queryKey: QUALITY_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/quality/settings');
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to fetch quality settings' }));
        throw new Error(error.error || 'Failed to fetch quality settings');
      }
      const data: QualitySettingsResponse = await res.json();
      return data.settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to update quality settings
 * Invalidates cache on success
 */
export function useUpdateQualitySettings() {
  const queryClient = useQueryClient();

  return useMutation<QualitySettingsResponse, Error, UpdateQualitySettingsInput>({
    mutationFn: async (updates) => {
      const res = await fetch('/api/quality/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update settings' }));
        throw new Error(error.error || 'Failed to update settings');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Update cache with new settings
      queryClient.setQueryData(QUALITY_SETTINGS_QUERY_KEY, data.settings);
    },
  });
}

/**
 * Hook to check if current user can update quality settings
 * Returns true if user has Admin, Owner, or Quality Manager role
 */
export function useCanUpdateQualitySettings() {
  return useQuery<boolean>({
    queryKey: ['can-update-quality-settings'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      const roleCode = data.user?.role?.toLowerCase();
      return QUALITY_SETTINGS_UPDATE_ROLES.includes(roleCode);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
