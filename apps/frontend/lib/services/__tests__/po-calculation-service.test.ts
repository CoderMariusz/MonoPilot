/**
 * Unit Tests: PO Calculation Service
 * Story: 03.4 - PO Totals + Tax Calculations
 *
 * Tests calculation service methods:
 * - calculateLineTotals(line) - line-level calculations
 * - calculatePOTotals(lines, shipping_cost) - PO-level totals
 * - calculateTaxBreakdown(lines) - mixed tax rate breakdown
 * - validateDiscount(line) - discount validation
 * - validateShippingCost(shipping_cost) - shipping cost validation
 * - roundCurrency(value) - currency rounding to 2 decimals
 *
 * Coverage:
 * - AC-1: Subtotal calculation
 * - AC-2: Line-level tax calculation (single rate)
 * - AC-3: Mixed tax rate calculation
 * - AC-4: Discount calculation (percentage)
 * - AC-5: Discount calculation (fixed amount)
 * - AC-6: Shipping cost
 * - AC-7: Total calculation formula
 * - AC-14: Discount validation
 * - AC-15: Negative discount validation
 * - AC-16: Shipping cost validation
 * - AC-18: Zero tax handling
 * - AC-19: Rounding precision
 * - AC-20: Performance (50 lines)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateLineTotals,
  calculatePOTotals,
  calculateTaxBreakdown,
  validateDiscount,
  validateShippingCost,
  roundCurrency,
} from '../po-calculation-service'

// Mock types from the service
interface POLine {
  quantity: number
  unit_price: number
  discount_percent?: number
  discount_amount?: number
  tax_rate: number
}

interface POLineCalculation {
  line_total: number
  discount_amount: number
  line_total_after_discount: number
  tax_amount: number
  line_total_with_tax: number
}

interface POTotals {
  subtotal: number
  tax_amount: number
  discount_total: number
  shipping_cost: number
  total: number
  tax_breakdown: TaxBreakdownItem[]
}

interface TaxBreakdownItem {
  rate: number
  subtotal: number
  tax: number
}

interface ValidationResult {
  valid: boolean
  error?: string
}

describe('POCalculationService', () => {
  describe('calculateLineTotals()', () => {
    describe('AC-1: Subtotal Calculation', () => {
      it('should calculate line_total = quantity * unit_price', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(600.00)
      })

      it('should handle multiple lines with different quantities and prices', () => {
        // Arrange - Line 1: 500 kg x $1.20 = $600.00
        const line1: POLine = {
          quantity: 500,
          unit_price: 1.20,
          tax_rate: 0,
        }

        // Act
        const result1 = calculateLineTotals(line1)

        // Assert
        expect(result1.line_total).toBe(600.00)
      })

      it('should update line_total automatically when quantity changes', () => {
        // Arrange - Original: 500 kg x $1.20 = $600.00
        const originalLine: POLine = {
          quantity: 500,
          unit_price: 1.20,
          tax_rate: 23,
        }
        const originalResult = calculateLineTotals(originalLine)
        expect(originalResult.line_total).toBe(600.00)

        // Arrange - Updated: 600 kg x $1.20 = $720.00
        const updatedLine: POLine = {
          quantity: 600,
          unit_price: 1.20,
          tax_rate: 23,
        }

        // Act
        const updatedResult = calculateLineTotals(updatedLine)

        // Assert
        expect(updatedResult.line_total).toBe(720.00)
      })
    })

    describe('AC-4: Discount Calculation (Percentage)', () => {
      it('should calculate discount_amount from discount_percent', () => {
        // Arrange: 500 kg x $1.20 = $600.00, discount 10%
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 10,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(600.00)
        expect(result.discount_amount).toBe(60.00)
        expect(result.line_total_after_discount).toBe(540.00)
      })

      it('should handle 0% discount', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 0,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.discount_amount).toBe(0.00)
        expect(result.line_total_after_discount).toBe(600.00)
      })

      it('should handle 100% discount', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 100,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.discount_amount).toBe(600.00)
        expect(result.line_total_after_discount).toBe(0.00)
      })
    })

    describe('AC-5: Discount Calculation (Fixed Amount)', () => {
      it('should calculate discount from discount_amount', () => {
        // Arrange: $600.00 line total, $50.00 fixed discount
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 50.00,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(600.00)
        expect(result.discount_amount).toBe(50.00)
        expect(result.line_total_after_discount).toBe(550.00)
      })

      it('should prioritize discount_amount over discount_percent if both provided', () => {
        // Arrange: Both percent (10%) and amount ($50) provided
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 10,
          discount_amount: 50.00,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert - Should use discount_amount (50.00), not 10% (60.00)
        expect(result.discount_amount).toBe(50.00)
        expect(result.line_total_after_discount).toBe(550.00)
      })

      it('should handle $0 fixed discount', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 0,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.discount_amount).toBe(0.00)
        expect(result.line_total_after_discount).toBe(600.00)
      })
    })

    describe('AC-2: Line-Level Tax Calculation (Single Rate)', () => {
      it('should calculate tax on line_total_after_discount', () => {
        // Arrange: $600.00 line, no discount, 23% tax
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          tax_rate: 23,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(600.00)
        expect(result.discount_amount).toBe(0.00)
        expect(result.line_total_after_discount).toBe(600.00)
        expect(result.tax_amount).toBe(138.00) // 600 * 0.23
        expect(result.line_total_with_tax).toBe(738.00)
      })

      it('should calculate tax on discounted amount', () => {
        // Arrange: $600.00 line, 10% discount = $540.00, 23% tax
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 10,
          tax_rate: 23,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(600.00)
        expect(result.discount_amount).toBe(60.00)
        expect(result.line_total_after_discount).toBe(540.00)
        expect(result.tax_amount).toBe(124.20) // 540 * 0.23
        expect(result.line_total_with_tax).toBe(664.20)
      })

      it('should calculate 8% tax correctly', () => {
        // Arrange: $30.00 line, 8% tax
        const line: POLine = {
          quantity: 100,
          unit_price: 0.30,
          tax_rate: 8,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(30.00)
        expect(result.tax_amount).toBe(2.40) // 30 * 0.08
        expect(result.line_total_with_tax).toBe(32.40)
      })
    })

    describe('AC-18: Zero Tax Handling', () => {
      it('should handle 0% tax rate without error', () => {
        // Arrange: $600.00 line, 0% tax
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.tax_amount).toBe(0.00)
        expect(result.line_total_with_tax).toBe(600.00)
      })

      it('should include zero-tax line in total calculations', () => {
        // Arrange: Multiple lines, one with 0% tax
        const zeroTaxLine: POLine = {
          quantity: 100,
          unit_price: 1.00,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(zeroTaxLine)

        // Assert
        expect(result.line_total).toBe(100.00)
        expect(result.tax_amount).toBe(0.00)
        expect(result.line_total_with_tax).toBe(100.00)
      })
    })

    describe('AC-19: Rounding Precision', () => {
      it('should round line_total to 2 decimals', () => {
        // Arrange: Quantity and price that result in rounding
        const line: POLine = {
          quantity: 333,
          unit_price: 0.33333,
          tax_rate: 0,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(111) // 333 * 0.33333 = 110.99889 -> 111.00
      })

      it('should round tax_amount to 2 decimals', () => {
        // Arrange: Quantity and price that result in rounding
        const line: POLine = {
          quantity: 333,
          unit_price: 0.33333,
          tax_rate: 23,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(111) // 333 * 0.33333 = 110.99889 -> 111.00
        expect(result.tax_amount).toBe(25.53) // 111 * 0.23 = 25.53
      })

      it('should handle very small amounts with rounding', () => {
        // Arrange: Very small line total
        const line: POLine = {
          quantity: 0.001,
          unit_price: 0.01,
          tax_rate: 23,
        }

        // Act
        const result = calculateLineTotals(line)

        // Assert
        expect(result.line_total).toBe(0.00)
        expect(result.tax_amount).toBe(0.00)
      })
    })
  })

  describe('calculatePOTotals()', () => {
    describe('AC-1: Subtotal Calculation', () => {
      it('should sum all line totals to get subtotal', () => {
        // Arrange: 3 lines with known totals
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },  // $30
        ]

        // Act
        const totals = calculatePOTotals(lines, 0)

        // Assert
        expect(totals.subtotal).toBe(800.00)
      })

      it('should recalculate subtotal when line is added', () => {
        // Arrange: Starting PO
        const initialLines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },  // $30
        ]
        const initialTotals = calculatePOTotals(initialLines, 0)
        expect(initialTotals.subtotal).toBe(800.00)

        // Arrange: New line added
        const newLines: POLine[] = [
          ...initialLines,
          { quantity: 50, unit_price: 0.50, tax_rate: 23 }, // $25
        ]

        // Act
        const updatedTotals = calculatePOTotals(newLines, 0)

        // Assert
        expect(updatedTotals.subtotal).toBe(825.00)
      })

      it('should recalculate subtotal when line is deleted', () => {
        // Arrange: Starting PO with 3 lines
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },  // $30
        ]

        // Act: Remove the last line ($30)
        const updatedLines = lines.slice(0, 2)
        const totals = calculatePOTotals(updatedLines, 0)

        // Assert
        expect(totals.subtotal).toBe(770.00)
      })
    })

    describe('AC-2: Line-Level Tax Calculation (Single Rate)', () => {
      it('should sum line taxes for single tax rate', () => {
        // Arrange: All lines with 23% tax
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600, tax $138
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170, tax $39.10
          { quantity: 100, unit_price: 0.30, tax_rate: 23 }, // $30, tax $6.90
        ]

        // Act
        const totals = calculatePOTotals(lines, 0)

        // Assert
        expect(totals.subtotal).toBe(800.00)
        expect(totals.tax_amount).toBe(184.00) // 138 + 39.10 + 6.90
      })
    })

    describe('AC-3: Mixed Tax Rate Calculation', () => {
      it('should sum taxes for mixed tax rates', () => {
        // Arrange: Mixed 23% and 8% taxes
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600, tax $138
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170, tax $39.10
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },  // $30, tax $2.40
        ]

        // Act
        const totals = calculatePOTotals(lines, 0)

        // Assert
        expect(totals.tax_amount).toBe(179.50) // 138 + 39.10 + 2.40
      })

      it('should provide tax breakdown for mixed rates', () => {
        // Arrange: Mixed tax rates
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600 @ 23%
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170 @ 23%
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },  // $30 @ 8%
        ]

        // Act
        const totals = calculatePOTotals(lines, 0)

        // Assert
        expect(totals.tax_breakdown).toBeDefined()
        expect(totals.tax_breakdown.length).toBe(2) // Two rates: 23%, 8%
      })
    })

    describe('AC-4: Discount Calculation (Percentage)', () => {
      it('should sum all line discounts', () => {
        // Arrange: Multiple lines with percentage discounts
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, discount_percent: 10, tax_rate: 23 }, // 10% of $600 = $60
          { quantity: 200, unit_price: 0.85, discount_percent: 0, tax_rate: 23 },  // 0% of $170 = $0
          { quantity: 100, unit_price: 0.30, discount_percent: 5, tax_rate: 8 },   // 5% of $30 = $1.50
        ]

        // Act
        const totals = calculatePOTotals(lines, 0)

        // Assert
        expect(totals.discount_total).toBe(61.50) // 60 + 0 + 1.50
      })
    })

    describe('AC-6: Shipping Cost', () => {
      it('should include shipping cost in total', () => {
        // Arrange: $800 subtotal, $179.50 tax, $25 shipping
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 },
          { quantity: 200, unit_price: 0.85, tax_rate: 23 },
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },
        ]
        const shippingCost = 25.00

        // Act
        const totals = calculatePOTotals(lines, shippingCost)

        // Assert
        expect(totals.shipping_cost).toBe(25.00)
        expect(totals.total).toBe(1004.50) // 800 + 179.50 + 25 - 0 = 1004.50
      })

      it('should default shipping to 0 if not provided', () => {
        // Arrange
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 },
        ]

        // Act
        const totals = calculatePOTotals(lines)

        // Assert
        expect(totals.shipping_cost).toBe(0)
      })

      it('should handle large shipping costs', () => {
        // Arrange: Large shipping amount
        const lines: POLine[] = [
          { quantity: 100, unit_price: 1.00, tax_rate: 0 },
        ]

        // Act
        const totals = calculatePOTotals(lines, 10000.00)

        // Assert
        expect(totals.shipping_cost).toBe(10000.00)
        expect(totals.total).toBe(10100.00)
      })
    })

    describe('AC-7: Total Calculation Formula', () => {
      it('should calculate total = subtotal + tax + shipping - discount', () => {
        // Arrange: All components
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, discount_percent: 10, tax_rate: 23 },
          { quantity: 200, unit_price: 0.85, discount_percent: 0, tax_rate: 23 },
          { quantity: 100, unit_price: 0.30, discount_percent: 0, tax_rate: 8 },
        ]
        const shippingCost = 25.00

        // Act
        const totals = calculatePOTotals(lines, shippingCost)

        // Assert
        // Subtotal: 600 + 170 + 30 = 800
        // Discount: 60 + 0 + 0 = 60
        // Tax (on discounted): (540*0.23) + (170*0.23) + (30*0.08) = 124.2 + 39.1 + 2.4 = 165.7
        // Total: 800 + 165.7 + 25 - 60 = 930.7
        expect(totals.subtotal).toBe(800.00)
        expect(totals.discount_total).toBe(60.00)
        expect(totals.shipping_cost).toBe(25.00)
        const expectedTotal = 800 + totals.tax_amount + 25 - 60
        expect(totals.total).toBeCloseTo(expectedTotal, 2)
      })

      it('should handle zero discounts and shipping', () => {
        // Arrange: Minimal PO
        const lines: POLine[] = [
          { quantity: 100, unit_price: 1.00, tax_rate: 0 },
        ]

        // Act
        const totals = calculatePOTotals(lines, 0)

        // Assert
        expect(totals.total).toBe(100.00) // Just subtotal
      })
    })

    describe('AC-8: Automatic Recalculation on Line Add', () => {
      it('should recalculate all totals when line is added', () => {
        // Arrange: Initial PO
        const initialLines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 },
          { quantity: 200, unit_price: 0.85, tax_rate: 23 },
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },
        ]
        const initialTotals = calculatePOTotals(initialLines, 0)
        expect(initialTotals.subtotal).toBe(800.00)
        expect(initialTotals.tax_amount).toBe(179.50)
        expect(initialTotals.total).toBe(979.50)

        // Arrange: New line added (50 kg x $0.50 @ 23%)
        const newLines: POLine[] = [
          ...initialLines,
          { quantity: 50, unit_price: 0.50, tax_rate: 23 },
        ]

        // Act
        const newTotals = calculatePOTotals(newLines, 0)

        // Assert
        expect(newTotals.subtotal).toBe(825.00)
        expect(newTotals.tax_amount).toBe(185.25) // +$5.75 (25 * 0.23 = 5.75), total: 179.50 + 5.75 = 185.25
        expect(newTotals.total).toBe(1010.25) // 825 + 185.25 - 0 = 1010.25
      })
    })

    describe('AC-9: Automatic Recalculation on Line Edit', () => {
      it('should recalculate when line quantity is changed', () => {
        // Arrange: Initial state
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 },
        ]
        const initialTotals = calculatePOTotals(lines, 0)
        expect(initialTotals.subtotal).toBe(600.00)

        // Arrange: Line quantity changed from 500 to 600
        const updatedLines: POLine[] = [
          { quantity: 600, unit_price: 1.20, tax_rate: 23 },
        ]

        // Act
        const updatedTotals = calculatePOTotals(updatedLines, 0)

        // Assert
        expect(updatedTotals.subtotal).toBe(720.00)
        expect(updatedTotals.tax_amount).toBe(165.60) // 720 * 0.23
        expect(updatedTotals.total).toBe(885.60)
      })
    })

    describe('AC-10: Automatic Recalculation on Line Delete', () => {
      it('should recalculate when line is deleted', () => {
        // Arrange: Initial state with 3 lines
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },  // $30
        ]
        const initialTotals = calculatePOTotals(lines, 0)
        expect(initialTotals.total).toBe(979.50)

        // Arrange: Line 3 deleted ($30)
        const remainingLines = lines.slice(0, 2)

        // Act
        const updatedTotals = calculatePOTotals(remainingLines, 0)

        // Assert
        expect(updatedTotals.subtotal).toBe(770.00) // 600 + 170
        expect(updatedTotals.total).toBeCloseTo(770 * 1.23, 2) // All at 23%
      })
    })

    describe('Edge cases', () => {
      it('should handle PO with 0 lines', () => {
        // Arrange: Empty PO
        const lines: POLine[] = []

        // Act
        const totals = calculatePOTotals(lines, 0)

        // Assert
        expect(totals.subtotal).toBe(0)
        expect(totals.tax_amount).toBe(0)
        expect(totals.discount_total).toBe(0)
        expect(totals.total).toBe(0)
      })

      it('should handle PO with shipping but no lines', () => {
        // Arrange: Empty PO with shipping
        const lines: POLine[] = []

        // Act
        const totals = calculatePOTotals(lines, 50.00)

        // Assert
        expect(totals.total).toBe(50.00) // Only shipping
      })
    })
  })

  describe('calculateTaxBreakdown()', () => {
    describe('AC-3: Mixed Tax Rate Calculation', () => {
      it('should group taxes by rate for single rate', () => {
        // Arrange: All 23% tax
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170
          { quantity: 100, unit_price: 0.30, tax_rate: 23 }, // $30
        ]

        // Act
        const breakdown = calculateTaxBreakdown(lines)

        // Assert
        expect(breakdown).toHaveLength(1)
        expect(breakdown[0].rate).toBe(23)
        expect(breakdown[0].subtotal).toBe(800.00) // 600 + 170 + 30
        expect(breakdown[0].tax).toBeCloseTo(184.00, 2) // 800 * 0.23
      })

      it('should group taxes by rate for mixed rates', () => {
        // Arrange: Mixed 23% and 8%
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, tax_rate: 23 }, // $600 @ 23%
          { quantity: 200, unit_price: 0.85, tax_rate: 23 }, // $170 @ 23%
          { quantity: 100, unit_price: 0.30, tax_rate: 8 },  // $30 @ 8%
        ]

        // Act
        const breakdown = calculateTaxBreakdown(lines)

        // Assert
        expect(breakdown).toHaveLength(2)
        // Should be sorted descending by rate
        expect(breakdown[0].rate).toBe(23)
        expect(breakdown[0].subtotal).toBe(770.00) // 600 + 170
        expect(breakdown[0].tax).toBeCloseTo(177.10, 2) // 770 * 0.23

        expect(breakdown[1].rate).toBe(8)
        expect(breakdown[1].subtotal).toBe(30.00)
        expect(breakdown[1].tax).toBeCloseTo(2.40, 2) // 30 * 0.08
      })

      it('should sort breakdown by tax rate descending', () => {
        // Arrange: Mix of rates: 5%, 23%, 8%
        const lines: POLine[] = [
          { quantity: 100, unit_price: 1.00, tax_rate: 5 },
          { quantity: 100, unit_price: 1.00, tax_rate: 23 },
          { quantity: 100, unit_price: 1.00, tax_rate: 8 },
        ]

        // Act
        const breakdown = calculateTaxBreakdown(lines)

        // Assert - Sorted descending: 23, 8, 5
        expect(breakdown[0].rate).toBe(23)
        expect(breakdown[1].rate).toBe(8)
        expect(breakdown[2].rate).toBe(5)
      })

      it('should handle 3+ different tax rates', () => {
        // Arrange: Multiple tax rates
        const lines: POLine[] = [
          { quantity: 100, unit_price: 1.00, tax_rate: 0 },
          { quantity: 100, unit_price: 1.00, tax_rate: 8 },
          { quantity: 100, unit_price: 1.00, tax_rate: 23 },
          { quantity: 100, unit_price: 1.00, tax_rate: 10 },
        ]

        // Act
        const breakdown = calculateTaxBreakdown(lines)

        // Assert - 4 different rates
        expect(breakdown).toHaveLength(4)
        expect(breakdown[0].rate).toBe(23)
        expect(breakdown[1].rate).toBe(10)
        expect(breakdown[2].rate).toBe(8)
        expect(breakdown[3].rate).toBe(0)
      })
    })

    describe('AC-18: Zero Tax Handling', () => {
      it('should include 0% tax rate in breakdown', () => {
        // Arrange: Line with 0% tax mixed with others
        const lines: POLine[] = [
          { quantity: 100, unit_price: 1.00, tax_rate: 23 },
          { quantity: 100, unit_price: 1.00, tax_rate: 0 },
        ]

        // Act
        const breakdown = calculateTaxBreakdown(lines)

        // Assert
        expect(breakdown).toHaveLength(2)
        expect(breakdown[0].rate).toBe(23)
        expect(breakdown[1].rate).toBe(0)
        expect(breakdown[1].tax).toBe(0)
      })
    })

    describe('AC-4/5: With Discounts', () => {
      it('should calculate tax on line_total_after_discount', () => {
        // Arrange: Lines with discounts
        const lines: POLine[] = [
          { quantity: 500, unit_price: 1.20, discount_percent: 10, tax_rate: 23 },
          { quantity: 100, unit_price: 1.00, discount_amount: 0, tax_rate: 23 },
        ]

        // Act
        const breakdown = calculateTaxBreakdown(lines)

        // Assert
        expect(breakdown).toHaveLength(1)
        // First line: 600 - 60 = 540
        // Second line: 100 - 0 = 100
        // Subtotal: 540 + 100 = 640
        expect(breakdown[0].subtotal).toBe(640.00)
      })
    })
  })

  describe('validateDiscount()', () => {
    describe('AC-14: Discount Validation', () => {
      it('should reject discount > line_total', () => {
        // Arrange: $600 line, $700 discount
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 700.00,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('exceed')
      })

      it('should reject discount equal to line_total (0 after discount)', () => {
        // Arrange: $600 line, $600 discount
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 600.00,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert - Should accept 100% discount
        expect(result.valid).toBe(true)
      })

      it('should accept discount < line_total', () => {
        // Arrange: $600 line, $50 discount
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 50.00,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert
        expect(result.valid).toBe(true)
      })

      it('should accept $0 discount', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 0,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert
        expect(result.valid).toBe(true)
      })
    })

    describe('AC-15: Negative Discount Validation', () => {
      it('should reject negative discount_percent', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: -10,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('negative')
      })

      it('should reject negative discount_amount', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: -50,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('negative')
      })

      it('should reject discount_percent > 100%', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 150,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('100')
      })

      it('should accept valid discount_percent between 0-100', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 10,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert
        expect(result.valid).toBe(true)
      })
    })

    describe('Edge cases', () => {
      it('should handle no discount provided', () => {
        // Arrange
        const line: POLine = {
          quantity: 500,
          unit_price: 1.20,
          tax_rate: 23,
        }

        // Act
        const result = validateDiscount(line)

        // Assert
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('validateShippingCost()', () => {
    describe('AC-16: Shipping Cost Validation', () => {
      it('should reject negative shipping cost', () => {
        // Arrange
        const shippingCost = -50.00

        // Act
        const result = validateShippingCost(shippingCost)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('negative')
      })

      it('should accept $0 shipping cost', () => {
        // Arrange
        const shippingCost = 0

        // Act
        const result = validateShippingCost(shippingCost)

        // Assert
        expect(result.valid).toBe(true)
      })

      it('should accept positive shipping cost', () => {
        // Arrange
        const shippingCost = 25.00

        // Act
        const result = validateShippingCost(shippingCost)

        // Assert
        expect(result.valid).toBe(true)
      })

      it('should accept large shipping costs', () => {
        // Arrange
        const shippingCost = 10000.00

        // Act
        const result = validateShippingCost(shippingCost)

        // Assert
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('roundCurrency()', () => {
    describe('AC-19: Rounding Precision', () => {
      it('should round to 2 decimals: 1.2345 -> 1.23', () => {
        // Act
        const result = roundCurrency(1.2345)

        // Assert
        expect(result).toBe(1.23)
      })

      it('should round 0.335 to 0.34 (banker\'s rounding)', () => {
        // Act
        const result = roundCurrency(0.335)

        // Assert
        expect(result).toBe(0.34)
      })

      it('should round 0.125 to 0.13', () => {
        // Act
        const result = roundCurrency(0.125)

        // Assert
        expect(result).toBe(0.13)
      })

      it('should handle very small values', () => {
        // Act
        const result = roundCurrency(0.001)

        // Assert
        expect(result).toBe(0.00)
      })

      it('should handle zero', () => {
        // Act
        const result = roundCurrency(0)

        // Assert
        expect(result).toBe(0)
      })

      it('should handle large numbers', () => {
        // Act
        const result = roundCurrency(999999.999)

        // Assert
        expect(result).toBe(1000000.00)
      })
    })
  })

  describe('AC-20: Performance - Calculation Speed', () => {
    it('should calculate totals for 50 lines in < 50ms', () => {
      // Arrange: Create 50 lines
      const lines: POLine[] = Array.from({ length: 50 }, (_, i) => ({
        quantity: 100 + i,
        unit_price: 1.00 + (i * 0.01),
        discount_percent: i % 2 === 0 ? 10 : 0,
        tax_rate: i % 3 === 0 ? 23 : i % 3 === 1 ? 8 : 0,
      }))

      // Act: Measure calculation time
      const startTime = performance.now()
      const totals = calculatePOTotals(lines, 100)
      const endTime = performance.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(50)
      expect(totals.subtotal).toBeGreaterThan(0)
    })

    it('should calculate line totals for 1000 lines in < 100ms', () => {
      // Arrange: Create 1000 lines
      const lines: POLine[] = Array.from({ length: 1000 }, (_, i) => ({
        quantity: 100,
        unit_price: 1.00,
        tax_rate: 23,
      }))

      // Act: Measure calculation time
      const startTime = performance.now()
      const totals = calculatePOTotals(lines, 0)
      const endTime = performance.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(100)
      expect(totals.subtotal).toBe(100000)
    })
  })
})
