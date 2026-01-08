import { z } from 'zod';

/**
 * Zod schemas for Production Settings validation.
 * Used by API routes and Services to ensure data integrity.
 */

export const productionSettingsSchema = z.object({
  // WO Execution
  allow_pause_wo: z.boolean().default(false),
  auto_complete_wo: z.boolean().default(false),
  require_operation_sequence: z.boolean().default(true),

  // Material Consumption
  allow_over_consumption: z.boolean().default(false),
  allow_partial_lp_consumption: z.boolean().default(true),

  // Output
  require_qa_on_output: z.boolean().default(true),
  auto_create_by_product_lp: z.boolean().default(true),

  // Reservations
  enable_material_reservations: z.boolean().default(true),

  // Dashboard
  dashboard_refresh_seconds: z
    .number()
    .int()
    .min(5, "Refresh interval must be at least 5 seconds")
    .max(300, "Refresh interval must not exceed 300 seconds")
    .default(30),
  show_material_alerts: z.boolean().default(true),
  show_delay_alerts: z.boolean().default(true),
  show_quality_alerts: z.boolean().default(true),

  // OEE
  enable_oee_tracking: z.boolean().default(false),
  target_oee_percent: z
    .number()
    .min(0, "Target OEE must be between 0 and 100")
    .max(100, "Target OEE must be between 0 and 100")
    .default(85),
  enable_downtime_tracking: z.boolean().default(false),
});

// Schema for partial updates (all fields optional)
export const updateProductionSettingsSchema = productionSettingsSchema.partial();

export type ProductionSettingsInput = z.infer<typeof productionSettingsSchema>;
export type UpdateProductionSettingsInput = z.infer<typeof updateProductionSettingsSchema>;
