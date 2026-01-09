/**
 * Planning Settings Validation Schemas - PO Approval
 * Story: 03.5a - PO Approval Setup
 *
 * Zod schemas for PO approval settings validation:
 * - poApprovalSettingsSchema: Complete PO approval section
 * - planningSettingsUpdateSchema: Partial update schema
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/03-planning/03.5a.po-approval-setup.md}
 */

import { z } from 'zod';

/**
 * Custom refinement to check decimal places
 * Returns true if the number has at most 4 decimal places
 * Exported for reuse in component form schemas
 */
export function hasMaxFourDecimalPlaces(value: number): boolean {
  // Handle edge cases
  if (!Number.isFinite(value)) return false;

  // Convert to string and check decimal places
  const str = value.toString();
  const decimalIndex = str.indexOf('.');

  if (decimalIndex === -1) return true; // No decimals

  const decimalPlaces = str.length - decimalIndex - 1;
  return decimalPlaces <= 4;
}

/**
 * PO Approval threshold schema with custom validation
 * - Must be positive (> 0)
 * - Must have at most 4 decimal places
 * - Can be null (approval applies to all POs)
 */
const thresholdSchema = z
  .number()
  .refine((val) => val > 0, {
    message: 'Threshold must be a positive number. Threshold must be greater than zero',
  })
  .refine(hasMaxFourDecimalPlaces, {
    message: 'Threshold can have at most 4 decimal places',
  })
  .nullable()
  .optional();

/**
 * PO Approval roles schema
 * - Must be a non-empty array of strings
 * - Each role must be a non-empty string
 * Exported for reuse in component form schemas
 */
export const rolesSchema = z
  .array(z.string().min(1, 'Roles cannot be empty strings'))
  .min(1, 'At least one approval role must be selected');

/**
 * PO Approval Settings Schema
 * Complete schema for PO approval section validation
 *
 * Used for validating the complete PO approval settings object:
 * - po_require_approval: boolean - Whether approval is required
 * - po_approval_threshold: number | null - Amount threshold for approval
 * - po_approval_roles: string[] - Roles that can approve POs
 */
export const poApprovalSettingsSchema = z.object({
  po_require_approval: z.boolean(),
  po_approval_threshold: thresholdSchema,
  po_approval_roles: rolesSchema,
});

/**
 * Planning Settings Update Schema
 * Partial schema for updating planning settings via API
 *
 * All fields are optional to support partial updates.
 * When provided, fields must pass validation.
 */
export const planningSettingsUpdateSchema = z.object({
  // PO Approval fields (optional for partial updates)
  po_require_approval: z.boolean().optional(),
  po_approval_threshold: thresholdSchema,
  po_approval_roles: rolesSchema.optional(),
});

/**
 * Type inferred from poApprovalSettingsSchema
 */
export type POApprovalSettings = z.infer<typeof poApprovalSettingsSchema>;

/**
 * Type inferred from planningSettingsUpdateSchema
 */
export type PlanningSettingsUpdate = z.infer<typeof planningSettingsUpdateSchema>;
