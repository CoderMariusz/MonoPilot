import { z } from 'zod'

/**
 * Production Settings Schema (Story 4.17)
 * Validates production module configuration
 */
export const productionSettingsSchema = z.object({
  allow_pause_wo: z.boolean(),
  auto_complete_wo: z.boolean(),
  require_operation_sequence: z.boolean(),
  require_qa_on_output: z.boolean(),
  auto_create_by_product_lp: z.boolean(),
  dashboard_refresh_seconds: z
    .number()
    .int()
    .min(30, 'Minimum 30 seconds to prevent server overload')
    .max(300, 'Maximum 300 seconds'),
  // Story 4.11: Over-Consumption Control
  allow_over_consumption: z.boolean().optional(),
})

export type ProductionSettingsInput = z.infer<typeof productionSettingsSchema>
