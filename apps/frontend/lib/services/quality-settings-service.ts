/**
 * Quality Settings Service
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Provides CRUD operations for quality settings:
 * - get() - Get settings for current org (auto-initialize if missing)
 * - update(data) - Update settings (partial update)
 * - getDefaultSettings() - Returns default values
 * - canUpdateQualitySettings(roleCode) - Check if role can update settings
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies in migration 079 enforce org_id filtering
 *   at database level. getUserOrgId() gets org_id from authenticated user session.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.0.quality-settings.md}
 */

import { createServerSupabase } from '@/lib/supabase/server';
import type { QualitySettings, UpdateQualitySettingsInput } from '@/lib/validation/quality-settings';
import { DEFAULT_QUALITY_SETTINGS } from '@/lib/validation/quality-settings';

// Re-export types for convenience
export type { QualitySettings, UpdateQualitySettingsInput } from '@/lib/validation/quality-settings';

/**
 * Roles that are allowed to update quality settings
 */
export const QUALITY_SETTINGS_UPDATE_ROLES = ['admin', 'owner', 'quality_manager'];

/**
 * Helper to get authenticated user's org_id
 * Extracts common auth+org pattern used across all service methods
 */
async function getUserOrgId(): Promise<{ userId: string; orgId: string }> {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (userError && userError.code === 'PGRST116') {
    throw new Error('User not found');
  }

  if (userError || !userData) {
    throw new Error('User not found');
  }

  return { userId: user.id, orgId: userData.org_id };
}

/**
 * Get quality settings for current organization
 * Auto-initializes with defaults if no record exists
 *
 * @returns Promise<QualitySettings> - The settings object
 * @throws Error if database operation fails (except PGRST116 which triggers auto-init)
 */
export async function get(): Promise<QualitySettings> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Fetch quality settings
  const { data, error } = await supabase
    .from('quality_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  // PGRST116 = no rows returned - auto-initialize
  if (error && error.code === 'PGRST116') {
    return initialize(orgId);
  }

  if (error) {
    throw error;
  }

  return data as QualitySettings;
}

/**
 * Update quality settings (partial update)
 * Only updates provided fields
 *
 * @param data - Partial settings to update
 * @returns Promise<QualitySettings> - The updated settings object
 * @throws Error if database operation fails or validation fails
 */
export async function update(data: UpdateQualitySettingsInput): Promise<QualitySettings> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Update settings
  const { data: updated, error } = await supabase
    .from('quality_settings')
    .update(data)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return updated as QualitySettings;
}

/**
 * Get default quality settings values
 * Used for displaying defaults when no settings exist
 *
 * @returns Default settings object (without id, org_id, timestamps)
 */
export function getDefaultSettings(): typeof DEFAULT_QUALITY_SETTINGS {
  return { ...DEFAULT_QUALITY_SETTINGS };
}

/**
 * Check if a role can update quality settings
 * Only Admin, Owner, and Quality Manager roles can update settings
 *
 * @param roleCode - The role code to check (e.g., 'admin', 'owner', 'quality_manager')
 * @returns boolean - Whether the role can update settings
 */
export function canUpdateQualitySettings(roleCode: string | undefined | null): boolean {
  if (!roleCode) {
    return false;
  }
  return QUALITY_SETTINGS_UPDATE_ROLES.includes(roleCode.toLowerCase());
}

/**
 * Initialize quality settings for a new organization
 * Creates a new record with default values
 * Internal use only - called by get() when settings don't exist
 *
 * @param orgId - Organization UUID
 * @returns Promise<QualitySettings> - The newly created settings object
 * @throws Error if database operation fails
 */
async function initialize(orgId: string): Promise<QualitySettings> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('quality_settings')
    .insert({
      org_id: orgId,
      ...DEFAULT_QUALITY_SETTINGS,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as QualitySettings;
}

/**
 * Export service functions as default object
 */
export default {
  get,
  update,
  getDefaultSettings,
  canUpdateQualitySettings,
};
