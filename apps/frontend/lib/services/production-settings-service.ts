/**
 * Production Settings Service
 * Story: 04.5 - Production Settings
 *
 * Handles CRUD operations for production settings with org isolation.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Accept any UUID format (not just v4) - supports test UUIDs like a0000000-0000-0000-0000-000000000001
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Production Settings type (15 settings + metadata)
 */
export interface ProductionSettings {
  id: string;
  org_id: string;
  // WO Execution (Phase 0)
  allow_pause_wo: boolean;
  auto_complete_wo: boolean;
  require_operation_sequence: boolean;
  // Material Consumption (Phase 1)
  allow_over_consumption: boolean;
  allow_partial_lp_consumption: boolean;
  // Output (Phase 1)
  require_qa_on_output: boolean;
  auto_create_by_product_lp: boolean;
  // Reservations (Phase 1)
  enable_material_reservations: boolean;
  // Dashboard (Phase 0)
  dashboard_refresh_seconds: number;
  show_material_alerts: boolean;
  show_delay_alerts: boolean;
  show_quality_alerts: boolean;
  // OEE (Phase 2)
  enable_oee_tracking: boolean;
  target_oee_percent: number;
  enable_downtime_tracking: boolean;
  // Metadata
  created_at?: string;
  updated_at?: string;
}

export type ProductionSettingsUpdate = Partial<Omit<ProductionSettings, 'id' | 'org_id' | 'created_at' | 'updated_at'>>;

const TABLE_NAME = 'production_settings';

const DEFAULT_SETTINGS: Omit<ProductionSettings, 'id' | 'org_id' | 'created_at' | 'updated_at'> = {
  allow_pause_wo: false,
  auto_complete_wo: false,
  require_operation_sequence: true,
  allow_over_consumption: false,
  allow_partial_lp_consumption: true,
  require_qa_on_output: true,
  auto_create_by_product_lp: true,
  enable_material_reservations: true,
  dashboard_refresh_seconds: 30,
  show_material_alerts: true,
  show_delay_alerts: true,
  show_quality_alerts: true,
  enable_oee_tracking: false,
  target_oee_percent: 85,
  enable_downtime_tracking: false,
};

/**
 * Validates UUID format
 */
function validateOrgId(orgId: string): void {
  if (!orgId || !UUID_REGEX.test(orgId)) {
    throw new Error('Invalid organization ID');
  }
}

/**
 * Validates update payload
 */
function validateUpdate(updates: ProductionSettingsUpdate): void {
  if (Object.keys(updates).length === 0) {
    throw new Error('No fields to update');
  }

  if (updates.dashboard_refresh_seconds !== undefined) {
    if (updates.dashboard_refresh_seconds < 5) {
      throw new Error('Refresh interval must be at least 5 seconds');
    }
    if (updates.dashboard_refresh_seconds > 300) {
      throw new Error('Refresh interval cannot exceed 300 seconds');
    }
  }

  if (updates.target_oee_percent !== undefined) {
    if (updates.target_oee_percent < 0 || updates.target_oee_percent > 100) {
      throw new Error('Target OEE must be between 0 and 100');
    }
  }
}

/**
 * Production Settings Service Class
 * All methods are static and accept supabase client and org_id.
 */
export class ProductionSettingsService {
  /**
   * Get production settings for org (with upsert for new orgs)
   * AC-12, AC-13
   */
  static async getProductionSettings(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<ProductionSettings> {
    validateOrgId(orgId);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error) {
      // No settings exist - upsert defaults
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: upsertError } = await supabase
          .from(TABLE_NAME)
          .upsert({
            org_id: orgId,
            ...DEFAULT_SETTINGS,
          })
          .select()
          .single();

        if (upsertError) {
          throw new Error(`Failed to create default settings: ${upsertError.message}`);
        }

        return newSettings as ProductionSettings;
      }

      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    return data as ProductionSettings;
  }

  /**
   * Update production settings (partial update)
   * AC-14
   */
  static async updateProductionSettings(
    supabase: SupabaseClient,
    orgId: string,
    updates: ProductionSettingsUpdate
  ): Promise<ProductionSettings> {
    validateOrgId(orgId);
    validateUpdate(updates);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    return data as ProductionSettings;
  }

  /**
   * Check if WO pause is allowed
   */
  static async isWoPauseAllowed(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<boolean> {
    const settings = await this.getProductionSettings(supabase, orgId);
    return settings.allow_pause_wo;
  }

  /**
   * Get dashboard refresh interval
   */
  static async getDashboardRefreshInterval(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<number> {
    const settings = await this.getProductionSettings(supabase, orgId);
    return settings.dashboard_refresh_seconds;
  }

  /**
   * Check if auto-complete is enabled
   */
  static async isAutoCompleteEnabled(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<boolean> {
    const settings = await this.getProductionSettings(supabase, orgId);
    return settings.auto_complete_wo;
  }

  /**
   * Check if operation sequence is required
   */
  static async isOperationSequenceRequired(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<boolean> {
    const settings = await this.getProductionSettings(supabase, orgId);
    return settings.require_operation_sequence;
  }

  /**
   * Get all dashboard alert settings
   */
  static async getDashboardAlertSettings(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<{
    show_material_alerts: boolean;
    show_delay_alerts: boolean;
    show_quality_alerts: boolean;
  }> {
    const settings = await this.getProductionSettings(supabase, orgId);
    return {
      show_material_alerts: settings.show_material_alerts,
      show_delay_alerts: settings.show_delay_alerts,
      show_quality_alerts: settings.show_quality_alerts,
    };
  }

  /**
   * Get OEE-related settings
   */
  static async getOeeSettings(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<{
    enable_oee_tracking: boolean;
    target_oee_percent: number;
    enable_downtime_tracking: boolean;
  }> {
    const settings = await this.getProductionSettings(supabase, orgId);
    return {
      enable_oee_tracking: settings.enable_oee_tracking,
      target_oee_percent: settings.target_oee_percent,
      enable_downtime_tracking: settings.enable_downtime_tracking,
    };
  }
}
