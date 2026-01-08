import { z } from 'zod';

/**
 * Type definitions for Production Settings (Story 04.5)
 * Matches the database schema and Zod validation output.
 */

// Base interface representing the database row
export interface ProductionSettings {
  id: string;
  org_id: string;

  // WO Execution (Phase 0 - Enforced)
  allow_pause_wo: boolean;
  auto_complete_wo: boolean;
  require_operation_sequence: boolean;

  // Material Consumption (Phase 1 - Stored only)
  allow_over_consumption: boolean;
  allow_partial_lp_consumption: boolean;

  // Output (Phase 1 - Stored only)
  require_qa_on_output: boolean;
  auto_create_by_product_lp: boolean;

  // Reservations (Phase 1 - Stored only)
  enable_material_reservations: boolean;

  // Dashboard (Phase 0 - Enforced)
  dashboard_refresh_seconds: number;
  show_material_alerts: boolean;
  show_delay_alerts: boolean;
  show_quality_alerts: boolean;

  // OEE (Phase 2 - Stored only)
  enable_oee_tracking: boolean;
  target_oee_percent: number;
  enable_downtime_tracking: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Input type for creating/updating settings (matches Zod schema)
export type ProductionSettingsInput = z.infer<typeof import('../validation/production-settings').productionSettingsSchema>;

// Input type for partial updates
export type ProductionSettingsUpdate = z.infer<typeof import('../validation/production-settings').updateProductionSettingsSchema>;
