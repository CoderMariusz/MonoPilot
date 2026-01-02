/**
 * Unit Tests: PO Calculation Validation Schemas
 * Story: 03.4 - PO Totals + Tax Calculations
 *
 * Tests Zod validation schemas for PO calculations:
 * - poLineCalculationSchema
 * - poHeaderCalculationSchema
 * - poTotalsSchema
 *
 * Coverage:
 * - AC-4: Discount validation (percentage)
 * - AC-5: Discount validation (fixed amount)
 * - AC-14: Discount cannot exceed line total
 * - AC-15: Negative discount validation
 * - AC-16: Shipping cost validation
 * - AC-19: Rounding precision constraints
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  poLineCalculationSchema,
  poHeaderCalculationSchema,
  poTotalsSchema,
} from '../po-calculation'

describe('PO Calculation Validation Schemas', () => {
  describe('poLineCalculationSchema', () => {
    describe('Basic field validation', () => {
      it('should accept valid line data with all fields', () => {
        // Arrange
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 10,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.quantity).toBe(500)
          expect(result.data.unit_price).toBe(1.20)
          expect(result.data.discount_percent).toBe(10)
          expect(result.data.tax_rate).toBe(23)
        }
      })

      it('should accept valid line data with minimum fields', () => {
        // Arrange
        const validLine = {
          quantity: 100,
          unit_price: 2.50,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should reject missing quantity', () => {
        // Arrange
        const invalidLine = {
          unit_price: 1.20,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject missing unit_price', () => {
        // Arrange
        const invalidLine = {
          quantity: 500,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject missing tax_rate', () => {
        // Arrange
        const invalidLine = {
          quantity: 500,
          unit_price: 1.20,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
      })
    })

    describe('Quantity validation', () => {
      it('should accept positive quantity', () => {
        // Arrange
        const validLine = {
          quantity: 0.001,
          unit_price: 1.00,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should reject zero quantity', () => {
        // Arrange
        const invalidLine = {
          quantity: 0,
          unit_price: 1.00,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('greater than 0')
        }
      })

      it('should reject negative quantity', () => {
        // Arrange
        const invalidLine = {
          quantity: -10,
          unit_price: 1.00,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
      })
    })

    describe('Unit price validation', () => {
      it('should accept zero unit_price', () => {
        // Arrange
        const validLine = {
          quantity: 100,
          unit_price: 0,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept positive unit_price', () => {
        // Arrange
        const validLine = {
          quantity: 100,
          unit_price: 999.99,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should reject negative unit_price', () => {
        // Arrange
        const invalidLine = {
          quantity: 100,
          unit_price: -5.00,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('cannot be negative')
        }
      })
    })

    describe('AC-4: Discount percent validation', () => {
      it('should accept 0% discount', () => {
        // Arrange
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 0,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept 10% discount', () => {
        // Arrange
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 10,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept 100% discount', () => {
        // Arrange
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 100,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept discount_percent as optional', () => {
        // Arrange
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should reject negative discount_percent', () => {
        // Arrange
        const invalidLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: -10,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('negative')
        }
      })

      it('should reject discount_percent > 100', () => {
        // Arrange
        const invalidLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_percent: 150,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('100')
        }
      })
    })

    describe('AC-5: Discount amount validation', () => {
      it('should accept zero discount_amount', () => {
        // Arrange
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 0,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept positive discount_amount', () => {
        // Arrange
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 50.00,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept discount_amount as optional', () => {
        // Arrange
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should reject negative discount_amount', () => {
        // Arrange
        const invalidLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: -10.00,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('negative')
        }
      })
    })

    describe('AC-14: Discount cannot exceed line total', () => {
      it('should reject discount_amount > line_total', () => {
        // Arrange: $600 line total, $700 discount
        const invalidLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 700.00,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('exceed')
        }
      })

      it('should accept discount_amount = line_total', () => {
        // Arrange: $600 line total, $600 discount (100%)
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 600.00,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept discount_amount < line_total', () => {
        // Arrange: $600 line total, $50 discount
        const validLine = {
          quantity: 500,
          unit_price: 1.20,
          discount_amount: 50.00,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should handle small amounts correctly', () => {
        // Arrange: Very small line total
        const validLine = {
          quantity: 0.01,
          unit_price: 0.01,
          discount_amount: 0.00,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('Tax rate validation', () => {
      it('should accept 0% tax rate', () => {
        // Arrange
        const validLine = {
          quantity: 100,
          unit_price: 1.00,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept positive tax rate', () => {
        // Arrange
        const validLine = {
          quantity: 100,
          unit_price: 1.00,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept 100% tax rate (edge case)', () => {
        // Arrange
        const validLine = {
          quantity: 100,
          unit_price: 1.00,
          tax_rate: 100,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should reject negative tax rate', () => {
        // Arrange
        const invalidLine = {
          quantity: 100,
          unit_price: 1.00,
          tax_rate: -10,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject tax rate > 100', () => {
        // Arrange
        const invalidLine = {
          quantity: 100,
          unit_price: 1.00,
          tax_rate: 150,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(invalidLine)

        // Assert
        expect(result.success).toBe(false)
      })
    })

    describe('AC-19: Rounding precision', () => {
      it('should accept decimals with up to 4 places', () => {
        // Arrange
        const validLine = {
          quantity: 333,
          unit_price: 0.33333,
          tax_rate: 23,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept very small decimal values', () => {
        // Arrange
        const validLine = {
          quantity: 0.0001,
          unit_price: 0.0001,
          tax_rate: 0,
        }

        // Act
        const result = poLineCalculationSchema.safeParse(validLine)

        // Assert
        expect(result.success).toBe(true)
      })
    })
  })

  describe('poHeaderCalculationSchema', () => {
    describe('Shipping cost validation', () => {
      it('should accept valid shipping cost', () => {
        // Arrange
        const validHeader = {
          shipping_cost: 25.00,
        }

        // Act
        const result = poHeaderCalculationSchema.safeParse(validHeader)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.shipping_cost).toBe(25.00)
        }
      })

      it('should accept zero shipping cost', () => {
        // Arrange
        const validHeader = {
          shipping_cost: 0,
        }

        // Act
        const result = poHeaderCalculationSchema.safeParse(validHeader)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.shipping_cost).toBe(0)
        }
      })

      it('should default shipping_cost to 0 if not provided', () => {
        // Arrange
        const validHeader = {}

        // Act
        const result = poHeaderCalculationSchema.safeParse(validHeader)

        // Assert
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.shipping_cost).toBe(0)
        }
      })

      it('should accept large shipping costs', () => {
        // Arrange
        const validHeader = {
          shipping_cost: 10000.00,
        }

        // Act
        const result = poHeaderCalculationSchema.safeParse(validHeader)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('AC-16: Shipping cost cannot be negative', () => {
      it('should reject negative shipping cost', () => {
        // Arrange
        const invalidHeader = {
          shipping_cost: -50.00,
        }

        // Act
        const result = poHeaderCalculationSchema.safeParse(invalidHeader)

        // Assert
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('negative')
        }
      })

      it('should reject very small negative value', () => {
        // Arrange
        const invalidHeader = {
          shipping_cost: -0.01,
        }

        // Act
        const result = poHeaderCalculationSchema.safeParse(invalidHeader)

        // Assert
        expect(result.success).toBe(false)
      })
    })

    describe('AC-19: Rounding precision', () => {
      it('should accept shipping cost with decimals', () => {
        // Arrange
        const validHeader = {
          shipping_cost: 25.99,
        }

        // Act
        const result = poHeaderCalculationSchema.safeParse(validHeader)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept shipping cost with 4 decimal places', () => {
        // Arrange
        const validHeader = {
          shipping_cost: 25.5555,
        }

        // Act
        const result = poHeaderCalculationSchema.safeParse(validHeader)

        // Assert
        expect(result.success).toBe(true)
      })
    })
  })

  describe('poTotalsSchema', () => {
    describe('Output validation', () => {
      it('should accept valid totals output', () => {
        // Arrange
        const validTotals = {
          subtotal: 800.00,
          tax_amount: 184.00,
          discount_total: 50.00,
          shipping_cost: 25.00,
          total: 959.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(validTotals)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept zero totals', () => {
        // Arrange
        const validTotals = {
          subtotal: 0,
          tax_amount: 0,
          discount_total: 0,
          shipping_cost: 0,
          total: 0,
        }

        // Act
        const result = poTotalsSchema.safeParse(validTotals)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept large amounts', () => {
        // Arrange
        const validTotals = {
          subtotal: 1000000.00,
          tax_amount: 230000.00,
          discount_total: 100000.00,
          shipping_cost: 50000.00,
          total: 1180000.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(validTotals)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('Field constraints', () => {
      it('should reject negative subtotal', () => {
        // Arrange
        const invalidTotals = {
          subtotal: -100.00,
          tax_amount: 0,
          discount_total: 0,
          shipping_cost: 0,
          total: -100.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(invalidTotals)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject negative tax_amount', () => {
        // Arrange
        const invalidTotals = {
          subtotal: 100.00,
          tax_amount: -20.00,
          discount_total: 0,
          shipping_cost: 0,
          total: 80.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(invalidTotals)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject negative discount_total', () => {
        // Arrange
        const invalidTotals = {
          subtotal: 100.00,
          tax_amount: 23.00,
          discount_total: -10.00,
          shipping_cost: 0,
          total: 113.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(invalidTotals)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject negative shipping_cost', () => {
        // Arrange
        const invalidTotals = {
          subtotal: 100.00,
          tax_amount: 23.00,
          discount_total: 0,
          shipping_cost: -5.00,
          total: 118.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(invalidTotals)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject negative total', () => {
        // Arrange
        const invalidTotals = {
          subtotal: 100.00,
          tax_amount: 23.00,
          discount_total: 200.00, // Discount > subtotal would make total negative
          shipping_cost: 0,
          total: -77.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(invalidTotals)

        // Assert
        expect(result.success).toBe(false)
      })
    })

    describe('AC-19: Rounding precision', () => {
      it('should accept decimal values with up to 4 places', () => {
        // Arrange
        const validTotals = {
          subtotal: 800.1234,
          tax_amount: 184.5678,
          discount_total: 50.9999,
          shipping_cost: 25.0001,
          total: 959.4912,
        }

        // Act
        const result = poTotalsSchema.safeParse(validTotals)

        // Assert
        expect(result.success).toBe(true)
      })

      it('should accept values rounded to 2 decimals', () => {
        // Arrange
        const validTotals = {
          subtotal: 800.00,
          tax_amount: 184.00,
          discount_total: 50.00,
          shipping_cost: 25.00,
          total: 959.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(validTotals)

        // Assert
        expect(result.success).toBe(true)
      })
    })

    describe('Required fields', () => {
      it('should reject missing subtotal', () => {
        // Arrange
        const invalidTotals = {
          tax_amount: 184.00,
          discount_total: 50.00,
          shipping_cost: 25.00,
          total: 959.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(invalidTotals)

        // Assert
        expect(result.success).toBe(false)
      })

      it('should reject missing total', () => {
        // Arrange
        const invalidTotals = {
          subtotal: 800.00,
          tax_amount: 184.00,
          discount_total: 50.00,
          shipping_cost: 25.00,
        }

        // Act
        const result = poTotalsSchema.safeParse(invalidTotals)

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should validate a complete PO line calculation flow', () => {
      // Arrange: Valid line with all optional fields
      const validLine = {
        quantity: 500,
        unit_price: 1.20,
        discount_percent: 10,
        discount_amount: 60,
        tax_rate: 23,
      }

      // Act
      const result = poLineCalculationSchema.safeParse(validLine)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate a complete PO header calculation flow', () => {
      // Arrange: Valid header
      const validHeader = {
        shipping_cost: 25.50,
      }

      // Act
      const result = poHeaderCalculationSchema.safeParse(validHeader)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should validate a complete totals output', () => {
      // Arrange: Complete totals from calculation
      const validTotals = {
        subtotal: 800.00,
        tax_amount: 179.50,
        discount_total: 60.00,
        shipping_cost: 25.00,
        total: 944.50,
      }

      // Act
      const result = poTotalsSchema.safeParse(validTotals)

      // Assert
      expect(result.success).toBe(true)
    })
  })
})
