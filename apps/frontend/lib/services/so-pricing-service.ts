/**
 * SO Pricing Service (Story 07.4)
 * Business logic for sales order line pricing calculations.
 *
 * Handles:
 * - Line total calculation (qty * price - discount)
 * - Order total calculation (sum of all line totals)
 * - Product price lookup from master
 * - Unit price and discount validation
 *
 * Security: All DB queries enforce org_id isolation via RLS.
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Discount type for SO lines
 */
export interface Discount {
  type: 'percent' | 'fixed'
  value: number
}

/**
 * SO line with line_total for order calculations
 */
export interface SOLine {
  line_total: number | null
}

/**
 * Validation result for price and discount checks
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Round a number to 2 decimal places using banker's rounding
 */
function roundTo2Decimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Calculate line_total = quantity * unit_price - discount
 * Rounds result to 2 decimal places (DECIMAL(15,2))
 *
 * AC2: Calculate line_total on quantity/price change
 * AC3: Apply percentage discount to line
 * AC4: Apply fixed discount to line
 *
 * @param quantity - Order quantity (DECIMAL(15,4))
 * @param unitPrice - Unit price (DECIMAL(15,4))
 * @param discount - Optional discount {type: 'percent'|'fixed', value: number}
 * @returns Calculated line total, rounded to 2 decimals
 */
export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discount: Discount | null | undefined
): number {
  let subtotal = quantity * unitPrice

  if (!discount) {
    return roundTo2Decimals(subtotal)
  }

  if (discount.type === 'percent') {
    subtotal = subtotal * (1 - discount.value / 100)
  } else if (discount.type === 'fixed') {
    subtotal = Math.max(0, subtotal - discount.value)
  }

  return roundTo2Decimals(subtotal)
}

/**
 * Calculate order total from all line totals
 * Rounds result to 2 decimal places (DECIMAL(15,2))
 *
 * AC5: Calculate SO total_amount from all lines
 * AC6: Recalculate totals on line edit
 * AC7: Recalculate totals on line delete
 *
 * @param lines - Array of SO lines with line_total
 * @returns Sum of all line_total values, treating null as 0
 */
export function calculateOrderTotal(lines: SOLine[]): number {
  const total = lines.reduce((sum, line) => sum + (line.line_total || 0), 0)
  return roundTo2Decimals(total)
}

/**
 * Get product's standard price from master data
 *
 * AC1: Auto-populate unit_price from product master
 * AC11: Handle products without std_price
 *
 * @param productId - Product UUID
 * @returns std_price or null if not found/has no price
 */
export async function getProductPrice(productId: string): Promise<number | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('std_price')
    .eq('id', productId)
    .single()

  if (error || !data) {
    return null
  }

  // Handle null std_price
  if (data.std_price === null) {
    return null
  }

  return data.std_price
}

/**
 * Validate unit price is positive
 *
 * AC8: Validate positive unit_price
 *
 * @param price - Unit price to validate
 * @returns ValidationResult with valid=true or error message
 */
export function validateUnitPrice(price: number): ValidationResult {
  if (price <= 0) {
    return {
      valid: false,
      error: 'Unit price must be greater than zero',
    }
  }

  return { valid: true }
}

/**
 * Validate discount is non-negative and percentage <= 100%
 *
 * AC9: Validate non-negative discount
 * AC10: Validate percentage discount <= 100%
 *
 * @param discount - Discount to validate (can be null/undefined)
 * @returns ValidationResult with valid=true or error message
 */
export function validateDiscount(discount: Discount | null | undefined): ValidationResult {
  // Null/undefined discount is valid (no discount)
  if (!discount) {
    return { valid: true }
  }

  // Check for negative value
  if (discount.value < 0) {
    return {
      valid: false,
      error: 'Discount cannot be negative',
    }
  }

  // Percentage discount cannot exceed 100%
  if (discount.type === 'percent' && discount.value > 100) {
    return {
      valid: false,
      error: 'Percentage discount cannot exceed 100%',
    }
  }

  return { valid: true }
}

/**
 * Update SO total_amount in database
 *
 * @param soId - Sales order UUID
 * @param orgId - Organization UUID for RLS
 * @returns Updated total amount or null on error
 */
export async function updateOrderTotal(soId: string, orgId: string): Promise<number | null> {
  const supabase = await createClient()

  // Get all lines for this SO
  const { data: lines, error: linesError } = await supabase
    .from('sales_order_lines')
    .select('line_total')
    .eq('sales_order_id', soId)
    .eq('org_id', orgId)

  if (linesError) {
    return null
  }

  // Calculate new total
  const total = calculateOrderTotal(lines || [])

  // Update SO
  const { data, error } = await supabase
    .from('sales_orders')
    .update({ total_amount: total })
    .eq('id', soId)
    .eq('org_id', orgId)
    .select('total_amount')
    .single()

  if (error) {
    return null
  }

  return data?.total_amount ?? null
}

// Export service as default object for easier testing and consistent API
export const SOPricingService = {
  calculateLineTotal,
  calculateOrderTotal,
  getProductPrice,
  validateUnitPrice,
  validateDiscount,
  updateOrderTotal,
}
