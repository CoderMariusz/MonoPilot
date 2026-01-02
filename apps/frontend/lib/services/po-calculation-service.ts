/**
 * PO Calculation Service
 * Story: 03.4 - PO Totals + Tax Calculations
 *
 * Provides calculation functions for Purchase Order totals:
 * - Line-level calculations (subtotal, discount, tax)
 * - PO-level totals (subtotal, tax, discount, shipping, total)
 * - Tax breakdown by rate
 * - Validation for discounts and shipping
 * - Currency rounding
 */

// ============================================================================
// TYPES
// ============================================================================

export interface POLine {
  quantity: number
  unit_price: number
  discount_percent?: number
  discount_amount?: number
  tax_rate: number
}

export interface POLineCalculation {
  line_total: number
  discount_amount: number
  line_total_after_discount: number
  tax_amount: number
  line_total_with_tax: number
}

export interface TaxBreakdownItem {
  rate: number
  subtotal: number
  tax: number
}

export interface POTotals {
  subtotal: number
  tax_amount: number
  discount_total: number
  shipping_cost: number
  total: number
  tax_breakdown: TaxBreakdownItem[]
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Round to 2 decimal places for currency
 * AC-19: Rounding precision
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

// ============================================================================
// LINE-LEVEL CALCULATIONS
// ============================================================================

/**
 * Calculate line-level totals including discount and tax
 *
 * AC-1: line_total = quantity * unit_price
 * AC-4: discount from percentage
 * AC-5: discount from fixed amount (prioritized if both provided)
 * AC-2: tax calculated on line_total_after_discount
 * AC-18: Zero tax handling
 * AC-19: Rounding precision
 *
 * @param line - PO line with quantity, unit_price, discount, and tax_rate
 * @returns POLineCalculation with all calculated values
 */
export function calculateLineTotals(line: POLine): POLineCalculation {
  // Step 1: Calculate line_total = quantity * unit_price
  const line_total = line.quantity * line.unit_price

  // Step 2: Calculate discount amount
  // AC-5: Prioritize discount_amount over discount_percent if both provided
  let discount_amount: number
  if (line.discount_amount !== undefined && line.discount_amount > 0) {
    discount_amount = line.discount_amount
  } else if (line.discount_percent !== undefined && line.discount_percent > 0) {
    discount_amount = line_total * (line.discount_percent / 100)
  } else {
    discount_amount = 0
  }

  // Step 3: Calculate line_total_after_discount
  const line_total_after_discount = line_total - discount_amount

  // Step 4: Calculate tax on discounted amount (AC-2: tax on line_total - discount)
  const tax_amount = line_total_after_discount * (line.tax_rate / 100)

  // Step 5: Calculate line_total_with_tax
  const line_total_with_tax = line_total_after_discount + tax_amount

  // Apply rounding AFTER all calculations (AC-19)
  return {
    line_total: roundCurrency(line_total),
    discount_amount: roundCurrency(discount_amount),
    line_total_after_discount: roundCurrency(line_total_after_discount),
    tax_amount: roundCurrency(tax_amount),
    line_total_with_tax: roundCurrency(line_total_with_tax),
  }
}

// ============================================================================
// PO-LEVEL CALCULATIONS
// ============================================================================

/**
 * Calculate PO-level totals from all lines
 *
 * AC-1: subtotal = sum of line totals (before discount)
 * AC-3: Mixed tax rate support with breakdown
 * AC-6: Shipping cost inclusion
 * AC-7: total = subtotal + tax + shipping - discount
 * AC-8/9/10: Auto-recalculation on line add/edit/delete
 *
 * @param lines - Array of PO lines
 * @param shipping_cost - Optional shipping cost (defaults to 0)
 * @returns POTotals with all calculated values and tax breakdown
 */
export function calculatePOTotals(
  lines: POLine[],
  shipping_cost: number = 0
): POTotals {
  // Handle empty PO
  if (lines.length === 0) {
    return {
      subtotal: 0,
      tax_amount: 0,
      discount_total: 0,
      shipping_cost: roundCurrency(shipping_cost),
      total: roundCurrency(shipping_cost),
      tax_breakdown: [],
    }
  }

  // Calculate all line totals
  const lineCalculations = lines.map(line => ({
    line,
    calc: calculateLineTotals(line),
  }))

  // AC-1: Subtotal = sum of quantity * unit_price (before discount)
  const subtotal = lineCalculations.reduce(
    (sum, { calc }) => sum + calc.line_total,
    0
  )

  // Sum all discounts
  const discount_total = lineCalculations.reduce(
    (sum, { calc }) => sum + calc.discount_amount,
    0
  )

  // Sum all taxes
  const tax_amount = lineCalculations.reduce(
    (sum, { calc }) => sum + calc.tax_amount,
    0
  )

  // Calculate tax breakdown
  const tax_breakdown = calculateTaxBreakdown(lines)

  // AC-7: total = subtotal + tax + shipping - discount
  const total = subtotal + tax_amount + shipping_cost - discount_total

  return {
    subtotal: roundCurrency(subtotal),
    tax_amount: roundCurrency(tax_amount),
    discount_total: roundCurrency(discount_total),
    shipping_cost: roundCurrency(shipping_cost),
    total: roundCurrency(total),
    tax_breakdown,
  }
}

// ============================================================================
// TAX BREAKDOWN CALCULATION
// ============================================================================

/**
 * Calculate tax breakdown grouped by tax rate
 *
 * AC-3: Group taxes by rate for mixed rate display
 * AC-18: Include 0% tax rate in breakdown
 * Sort order: Descending by rate
 *
 * @param lines - Array of PO lines
 * @returns Array of tax breakdown items sorted by rate descending
 */
export function calculateTaxBreakdown(lines: POLine[]): TaxBreakdownItem[] {
  // Group lines by tax rate
  const rateGroups = new Map<number, { subtotal: number; tax: number }>()

  for (const line of lines) {
    const calc = calculateLineTotals(line)
    const rate = line.tax_rate

    // Use line_total_after_discount for tax breakdown subtotal
    const lineSubtotal = calc.line_total_after_discount
    const lineTax = calc.tax_amount

    const existing = rateGroups.get(rate) || { subtotal: 0, tax: 0 }
    rateGroups.set(rate, {
      subtotal: existing.subtotal + lineSubtotal,
      tax: existing.tax + lineTax,
    })
  }

  // Convert to array and sort descending by rate
  const breakdown: TaxBreakdownItem[] = Array.from(rateGroups.entries())
    .map(([rate, values]) => ({
      rate,
      subtotal: roundCurrency(values.subtotal),
      tax: roundCurrency(values.tax),
    }))
    .sort((a, b) => b.rate - a.rate)

  return breakdown
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate discount on a PO line
 *
 * AC-14: Discount cannot exceed line_total
 * AC-15: Discount cannot be negative
 *
 * @param line - PO line to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateDiscount(line: POLine): ValidationResult {
  const line_total = line.quantity * line.unit_price

  // Check negative discount_percent
  if (line.discount_percent !== undefined && line.discount_percent < 0) {
    return {
      valid: false,
      error: 'Discount percent cannot be negative',
    }
  }

  // Check discount_percent > 100%
  if (line.discount_percent !== undefined && line.discount_percent > 100) {
    return {
      valid: false,
      error: 'Discount percent cannot exceed 100%',
    }
  }

  // Check negative discount_amount
  if (line.discount_amount !== undefined && line.discount_amount < 0) {
    return {
      valid: false,
      error: 'Discount amount cannot be negative',
    }
  }

  // Check discount_amount > line_total
  if (line.discount_amount !== undefined && line.discount_amount > line_total) {
    return {
      valid: false,
      error: 'Discount amount cannot exceed line total',
    }
  }

  return { valid: true }
}

/**
 * Validate shipping cost
 *
 * AC-16: Shipping cost cannot be negative
 *
 * @param shipping_cost - Shipping cost to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateShippingCost(shipping_cost: number): ValidationResult {
  if (shipping_cost < 0) {
    return {
      valid: false,
      error: 'Shipping cost cannot be negative',
    }
  }

  return { valid: true }
}
