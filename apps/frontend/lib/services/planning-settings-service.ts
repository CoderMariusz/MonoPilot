/**
 * Planning Settings Service
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Provides CRUD operations for planning settings:
 * - getPlanningSettings(orgId) - Get settings, auto-initialize if missing
 * - updatePlanningSettings(orgId, updates) - Update settings
 * - initializePlanningSettings(orgId) - Create with defaults
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/03-planning/context/03.17/api.yaml}
 */

import { createServerSupabase } from '@/lib/supabase/server';
import type { PlanningSettings } from '@/lib/types/planning-settings';
import { PLANNING_SETTINGS_DEFAULTS } from '@/lib/types/planning-settings';
import type { PlanningSettingsInput } from '@/lib/validation/planning-settings-schemas';

// Re-export types for convenience
export type { PlanningSettings } from '@/lib/types/planning-settings';
export type { PlanningSettingsInput } from '@/lib/validation/planning-settings-schemas';

/**
 * Default settings values for new organizations
 * Applied when initializing planning_settings for the first time
 * @deprecated Use PLANNING_SETTINGS_DEFAULTS from @/lib/types/planning-settings directly
 */
export const DEFAULT_SETTINGS = PLANNING_SETTINGS_DEFAULTS;

/**
 * Get planning settings for an organization
 * Auto-initializes with defaults if no record exists
 *
 * @param orgId - Organization UUID
 * @returns Promise<PlanningSettings> - The settings object
 * @throws Error if database operation fails (except PGRST116 which triggers auto-init)
 */
export async function getPlanningSettings(orgId: string): Promise<PlanningSettings> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('planning_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  // PGRST116 = no rows returned - auto-initialize
  if (error && error.code === 'PGRST116') {
    return initializePlanningSettings(orgId);
  }

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update planning settings for an organization
 * Supports partial updates (only changed fields)
 *
 * @param orgId - Organization UUID
 * @param updates - Partial settings to update
 * @returns Promise<PlanningSettings> - The updated settings object
 * @throws Error if database operation fails
 */
export async function updatePlanningSettings(
  orgId: string,
  updates: Partial<PlanningSettingsInput>
): Promise<PlanningSettings> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('planning_settings')
    .update(updates)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Initialize planning settings for a new organization
 * Creates a new record with default values
 *
 * @param orgId - Organization UUID
 * @returns Promise<PlanningSettings> - The newly created settings object
 * @throws Error if database operation fails
 */
export async function initializePlanningSettings(orgId: string): Promise<PlanningSettings> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('planning_settings')
    .insert({ org_id: orgId, ...DEFAULT_SETTINGS })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Default PO Approval Settings
 * Used for fresh organizations and UI defaults
 */
export interface POApprovalDefaults {
  po_require_approval: boolean;
  po_approval_threshold: number | null;
  po_approval_roles: string[];
}

/**
 * Get default planning settings values
 * Returns a new object each time to prevent mutation
 *
 * @returns POApprovalDefaults - Default values for PO approval settings
 */
export function getDefaultPlanningSettings(): POApprovalDefaults {
  return {
    po_require_approval: false,
    po_approval_threshold: null,
    po_approval_roles: ['admin', 'manager'],
  };
}
