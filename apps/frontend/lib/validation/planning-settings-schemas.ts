/**
 * Planning Settings Validation Schemas
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Zod schemas for planning settings validation:
 * - Auto-number format validation (must contain YYYY and NNNNN)
 * - Prefix validation (1-10 chars, alphanumeric + dash only)
 * - Numeric range validation
 * - Enum validation
 */

import { z } from 'zod';

/**
 * Auto-number format must contain both YYYY (year) and NNNNN (sequence)
 * Valid examples: YYYY-NNNNN, PO-YYYY-NNNNN, NNNNN-YYYY
 */
const autoNumberFormatRegex = /YYYY.*NNNNN|NNNNN.*YYYY/;

/**
 * Prefix validation: 1-10 chars, alphanumeric + dash only
 * Valid examples: PO-, TO-, WO-, PUR-
 */
const prefixRegex = /^[A-Za-z0-9-]+$/;

/**
 * Payment terms enum values
 */
export const paymentTermsValues = ['Net 30', 'Net 60', 'Net 90', '2/10 Net 30', 'Due on Receipt'] as const;

/**
 * Currency enum values
 */
export const currencyValues = ['PLN', 'EUR', 'USD', 'GBP'] as const;

/**
 * Base Planning Settings Schema
 * Used for full validation - all fields required
 */
const planningSettingsBaseSchema = z.object({
  // PO Settings (7 fields)
  po_require_approval: z.boolean(),
  po_approval_threshold: z.number().min(0).nullable(),
  po_approval_roles: z.array(z.string()).min(1, 'At least one approval role required'),
  po_auto_number_prefix: z.string()
    .min(1, 'Prefix cannot be empty')
    .max(10, 'Prefix max 10 characters')
    .regex(prefixRegex, 'Prefix must be alphanumeric with dashes only'),
  po_auto_number_format: z.string()
    .regex(autoNumberFormatRegex, 'Format must contain both YYYY (year) and NNNNN (sequence)'),
  po_default_payment_terms: z.enum(paymentTermsValues),
  po_default_currency: z.enum(currencyValues),

  // TO Settings (5 fields)
  to_allow_partial_shipments: z.boolean(),
  to_require_lp_selection: z.boolean(),
  to_auto_number_prefix: z.string()
    .min(1, 'Prefix cannot be empty')
    .max(10, 'Prefix max 10 characters')
    .regex(prefixRegex, 'Prefix must be alphanumeric with dashes only'),
  to_auto_number_format: z.string()
    .regex(autoNumberFormatRegex, 'Format must contain both YYYY (year) and NNNNN (sequence)'),
  to_default_transit_days: z.number().int().min(0).max(365, 'Transit days max 365'),

  // WO Settings (9 fields)
  wo_material_check: z.boolean(),
  wo_copy_routing: z.boolean(),
  wo_auto_select_bom: z.boolean(),
  wo_require_bom: z.boolean(),
  wo_allow_overproduction: z.boolean(),
  wo_overproduction_limit: z.number().min(0).max(100, 'Overproduction limit must be 0-100%'),
  wo_auto_number_prefix: z.string()
    .min(1, 'Prefix cannot be empty')
    .max(10, 'Prefix max 10 characters')
    .regex(prefixRegex, 'Prefix must be alphanumeric with dashes only'),
  wo_auto_number_format: z.string()
    .regex(autoNumberFormatRegex, 'Format must contain both YYYY (year) and NNNNN (sequence)'),
  wo_default_scheduling_buffer_hours: z.number().int().min(0).max(168, 'Buffer max 168 hours (1 week)'),
});

/**
 * Planning Settings Schema - Full validation for form submission
 * All fields required for complete settings
 */
export const planningSettingsSchema = planningSettingsBaseSchema;

/**
 * Update schema - Partial for PATCH updates
 * All fields are optional to support partial updates
 */
export const planningSettingsUpdateSchema = planningSettingsBaseSchema.partial();

/**
 * Input type inferred from full schema (for form)
 */
export type PlanningSettingsInput = z.infer<typeof planningSettingsSchema>;

/**
 * Update input type (partial for API updates)
 */
export type PlanningSettingsUpdateInput = z.infer<typeof planningSettingsUpdateSchema>;
