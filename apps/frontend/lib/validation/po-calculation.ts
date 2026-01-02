/**
 * PO Calculation Validation Schemas
 * Story: 03.4 - PO Totals + Tax Calculations
 *
 * Zod schemas for validating:
 * - PO line calculation inputs
 * - PO header calculation inputs
 * - PO totals outputs
 */

import { z } from 'zod'

// ============================================================================
// PO LINE CALCULATION SCHEMA
// ============================================================================

/**
 * Schema for PO line calculation input
 *
 * AC-4: Discount percent validation (0-100%)
 * AC-5: Discount amount validation (non-negative)
 * AC-14: Discount cannot exceed line total (refinement)
 * AC-15: Negative discount validation
 * AC-19: Rounding precision (accepts decimals)
 */
export const poLineCalculationSchema = z
  .object({
    quantity: z.number().positive('Quantity must be greater than 0'),
    unit_price: z.number().min(0, 'Unit price cannot be negative'),
    discount_percent: z
      .number()
      .min(0, 'Discount percent cannot be negative')
      .max(100, 'Discount percent cannot exceed 100%')
      .optional(),
    discount_amount: z
      .number()
      .min(0, 'Discount amount cannot be negative')
      .optional(),
    tax_rate: z
      .number()
      .min(0, 'Tax rate cannot be negative')
      .max(100, 'Tax rate cannot exceed 100%'),
  })
  .refine(
    (data) => {
      if (data.discount_amount !== undefined && data.discount_amount > 0) {
        const line_total = data.quantity * data.unit_price
        return data.discount_amount <= line_total
      }
      return true
    },
    {
      message: 'Discount amount cannot exceed line total',
      path: ['discount_amount'],
    }
  )

export type POLineCalculationInput = z.infer<typeof poLineCalculationSchema>

// ============================================================================
// PO HEADER CALCULATION SCHEMA
// ============================================================================

/**
 * Schema for PO header calculation input
 *
 * AC-16: Shipping cost cannot be negative
 * AC-19: Rounding precision (accepts decimals)
 */
export const poHeaderCalculationSchema = z.object({
  shipping_cost: z
    .number()
    .min(0, 'Shipping cost cannot be negative')
    .default(0),
})

export type POHeaderCalculationInput = z.infer<typeof poHeaderCalculationSchema>

// ============================================================================
// PO TOTALS SCHEMA
// ============================================================================

/**
 * Schema for PO totals output validation
 *
 * All monetary fields must be non-negative
 * AC-19: Rounding precision (accepts decimals)
 */
export const poTotalsSchema = z.object({
  subtotal: z.number().min(0),
  tax_amount: z.number().min(0),
  discount_total: z.number().min(0),
  shipping_cost: z.number().min(0),
  total: z.number().min(0),
})

export type POTotalsOutput = z.infer<typeof poTotalsSchema>
