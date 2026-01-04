/**
 * Warehouse Settings Service
 * Story: 05.0 - Warehouse Settings (Module Configuration)
 * Phase: P3 (GREEN - Backend Implementation)
 *
 * Provides CRUD operations for warehouse settings:
 * - get() - Get settings for current org (auto-initialize if missing)
 * - update(data) - Update settings (full replace)
 * - partialUpdate(data) - Partial update (PATCH)
 * - reset() - Reset to default values
 * - getHistory(limit?) - Get audit trail
 *
 * SECURITY (ADR-013 compliance - verified 2026-01-02):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies in migration 087 enforce org_id filtering
 *   at database level. getUserOrgId() gets org_id from authenticated user session.
 * - XSS in Audit Trail: SAFE - React auto-escapes rendered values in components.
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/05-warehouse/05.0.warehouse-settings.md}
 */

import { createServerSupabase } from '@/lib/supabase/server';
import type { WarehouseSettings, UpdateWarehouseSettingsInput } from '@/lib/validation/warehouse-settings';
import { DEFAULT_WAREHOUSE_SETTINGS } from '@/lib/validation/warehouse-settings';

// Re-export types for convenience
export type { WarehouseSettings, UpdateWarehouseSettingsInput } from '@/lib/validation/warehouse-settings';

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

  if (userError || !userData) {
    throw new Error('User not found');
  }

  return { userId: user.id, orgId: userData.org_id };
}

/**
 * Warehouse Settings Audit Record
 */
export interface WarehouseSettingsAudit {
  id: string;
  org_id: string;
  settings_id: string;
  setting_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
}

/**
 * Get warehouse settings for current organization
 * Auto-initializes with defaults if no record exists
 *
 * @returns Promise<WarehouseSettings> - The settings object
 * @throws Error if database operation fails (except PGRST116 which triggers auto-init)
 */
export async function get(): Promise<WarehouseSettings> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Fetch warehouse settings
  const { data, error } = await supabase
    .from('warehouse_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  // PGRST116 = no rows returned - auto-initialize
  if (error && error.code === 'PGRST116') {
    return initialize(orgId, userId);
  }

  if (error) {
    throw error;
  }

  return data as WarehouseSettings;
}

/**
 * Update warehouse settings (full replace)
 *
 * RACE CONDITION NOTE (verified 2026-01-02):
 * This is a single-row-per-org table with unique constraint (org_id).
 * Concurrent updates are handled at DB level via last-write-wins.
 * For this settings use case, optimistic locking is NOT required because:
 * 1. Settings changes are infrequent (admin-only operation)
 * 2. All changes are audited in warehouse_settings_audit table
 * 3. Previous values can be recovered from audit history
 * If stricter concurrency control is needed in future, add:
 *   .eq('updated_at', expectedUpdatedAt) to the update query.
 *
 * @param data - Complete settings to update
 * @returns Promise<WarehouseSettings> - The updated settings object
 * @throws Error if database operation fails or validation fails
 */
export async function update(data: UpdateWarehouseSettingsInput): Promise<WarehouseSettings> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Update settings
  const { data: updated, error } = await supabase
    .from('warehouse_settings')
    .update({ ...data, updated_by: userId })
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return updated as WarehouseSettings;
}

/**
 * Partial update warehouse settings (PATCH)
 * Only updates provided fields
 *
 * @param data - Partial settings to update
 * @returns Promise<WarehouseSettings> - The updated settings object
 * @throws Error if database operation fails or validation fails
 */
export async function partialUpdate(data: Partial<UpdateWarehouseSettingsInput>): Promise<WarehouseSettings> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Partial update
  const { data: updated, error } = await supabase
    .from('warehouse_settings')
    .update({ ...data, updated_by: userId })
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return updated as WarehouseSettings;
}

/**
 * Reset warehouse settings to default values
 * Preserves org_id and updates updated_at
 *
 * @returns Promise<WarehouseSettings> - The reset settings object
 * @throws Error if database operation fails
 */
export async function reset(): Promise<WarehouseSettings> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Reset to defaults
  const { data: resetData, error } = await supabase
    .from('warehouse_settings')
    .update({ ...DEFAULT_WAREHOUSE_SETTINGS, updated_by: userId })
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return resetData as WarehouseSettings;
}

/**
 * Get warehouse settings change history (audit trail)
 * Returns last N changes sorted by newest first
 *
 * @param limit - Number of records to return (default: 50)
 * @returns Promise<WarehouseSettingsAudit[]> - Array of audit records
 * @throws Error if database operation fails
 */
export async function getHistory(limit: number = 50): Promise<WarehouseSettingsAudit[]> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Fetch audit trail
  const { data, error } = await supabase
    .from('warehouse_settings_audit')
    .select('*')
    .eq('org_id', orgId)
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []) as WarehouseSettingsAudit[];
}

/**
 * Initialize warehouse settings for a new organization
 * Creates a new record with default values
 * Internal use only - called by get() when settings don't exist
 *
 * @param orgId - Organization UUID
 * @param userId - User UUID creating the settings
 * @returns Promise<WarehouseSettings> - The newly created settings object
 * @throws Error if database operation fails
 */
async function initialize(orgId: string, userId: string): Promise<WarehouseSettings> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('warehouse_settings')
    .insert({
      org_id: orgId,
      ...DEFAULT_WAREHOUSE_SETTINGS,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as WarehouseSettings;
}

/**
 * Export service functions as default object
 */
export default {
  get,
  update,
  partialUpdate,
  reset,
  getHistory,
};
