/**
 * Unit Tests: SO Pricing Service
 * Story: 07.4 - SO Line Pricing
 * Phase: RED - Tests will fail until service implementation exists
 *
 * Tests calculation service methods:
 * - calculateLineTotal(qty, unitPrice, discount) - line-level total
 * - calculateOrderTotal(lines) - SO-level total
 * - getProductPrice(productId) - fetch product std_price
 * - validateUnitPrice(price) - price validation
 * - validateDiscount(discount) - discount validation
 *
 * Coverage:
 * - AC1: Auto-populate unit_price from product master
 * - AC2: Calculate line_total on quantity/price change
 * - AC3: Apply percentage discount to line
 * - AC4: Apply fixed discount to line
 * - AC5: Calculate SO total_amount from all lines
 * - AC6: Recalculate totals on line edit
 * - AC7: Recalculate totals on line delete
 * - AC8: Validate positive unit_price
 * - AC9: Validate non-negative discount
 * - AC10: Validate percentage discount <= 100%
 * - AC11: Handle products without std_price
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  calculateLineTotal,
  calculateOrderTotal,
  getProductPrice,
  validateUnitPrice,
  validateDiscount,
} from '../so-pricing-service'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

const mockQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))

// Types
interface Discount {
  type: 'percent' | 'fixed'
  value: number
}

interface SOLine {
  line_total: number | null
}

interface ValidationResult {
  valid: boolean
  error?: string
}

describe('SOPricingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.from.mockReturnValue(mockQuery)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('calculateLineTotal()', () => {
    describe('AC2: Calculate line_total on quantity/price change', () => {
      it('should calculate line_total = quantity * unit_price (no discount)', () => {
        // Arrange
        const quantity = 100
        const unitPrice = 12.5

        // Act
        const result = calculateLineTotal(quantity, unitPrice, null)

        // Assert
        expect(result).toBe(1250.0)
      })

      it('should handle decimal quantities', () => {
        // Arrange
        const quantity = 10.5
        const unitPrice = 4.0

        // Act
        const result = calculateLineTotal(quantity, unitPrice, null)

        // Assert
        expect(result).toBe(42.0)
      })

      it('should handle decimal prices', () => {
        // Arrange
        const quantity = 100
        const unitPrice = 5.55

        // Act
        const result = calculateLineTotal(quantity, unitPrice, null)

        // Assert
        expect(result).toBe(555.0)
      })

      it('should round to 2 decimal places', () => {
        // Arrange: 10.33 * 5.25 = 54.2325 -> 54.23
        const quantity = 10.33
        const unitPrice = 5.25

        // Act
        const result = calculateLineTotal(quantity, unitPrice, null)

        // Assert
        expect(result).toBe(54.23)
      })

      it('should handle zero quantity', () => {
        // Arrange
        const quantity = 0
        const unitPrice = 12.5

        // Act
        const result = calculateLineTotal(quantity, unitPrice, null)

        // Assert
        expect(result).toBe(0.0)
      })
    })

    describe('AC3: Apply percentage discount to line', () => {
      it('should apply 10% discount correctly', () => {
        // Arrange: 50 * 20.00 = 1000, 10% discount = 900
        const quantity = 50
        const unitPrice = 20.0
        const discount: Discount = { type: 'percent', value: 10 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(900.0)
      })

      it('should apply 0% discount (no effect)', () => {
        // Arrange
        const quantity = 100
        const unitPrice = 10.0
        const discount: Discount = { type: 'percent', value: 0 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(1000.0)
      })

      it('should apply 100% discount (zero total)', () => {
        // Arrange
        const quantity = 100
        const unitPrice = 10.0
        const discount: Discount = { type: 'percent', value: 100 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(0.0)
      })

      it('should apply 25% discount correctly', () => {
        // Arrange: 40 * 25.00 = 1000, 25% = 750
        const quantity = 40
        const unitPrice = 25.0
        const discount: Discount = { type: 'percent', value: 25 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(750.0)
      })

      it('should round percentage discount result to 2 decimals', () => {
        // Arrange: 33 * 10.00 = 330, 15% off = 280.50
        const quantity = 33
        const unitPrice = 10.0
        const discount: Discount = { type: 'percent', value: 15 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(280.5)
      })
    })

    describe('AC4: Apply fixed discount to line', () => {
      it('should apply fixed discount correctly', () => {
        // Arrange: 25 * 40.00 = 1000, -$50 = 950
        const quantity = 25
        const unitPrice = 40.0
        const discount: Discount = { type: 'fixed', value: 50.0 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(950.0)
      })

      it('should apply zero fixed discount (no effect)', () => {
        // Arrange
        const quantity = 100
        const unitPrice = 10.0
        const discount: Discount = { type: 'fixed', value: 0 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(1000.0)
      })

      it('should not make total negative when fixed discount > subtotal', () => {
        // Arrange: 10 * 50.00 = 500, -$1000 should = 0, not -500
        const quantity = 10
        const unitPrice = 50.0
        const discount: Discount = { type: 'fixed', value: 1000.0 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(0.0)
      })

      it('should handle fixed discount equal to subtotal', () => {
        // Arrange: 10 * 50.00 = 500, -$500 = 0
        const quantity = 10
        const unitPrice = 50.0
        const discount: Discount = { type: 'fixed', value: 500.0 }

        // Act
        const result = calculateLineTotal(quantity, unitPrice, discount)

        // Assert
        expect(result).toBe(0.0)
      })
    })

    describe('Edge cases', () => {
      it('should handle very small amounts', () => {
        // Arrange
        const quantity = 1
        const unitPrice = 0.01

        // Act
        const result = calculateLineTotal(quantity, unitPrice, null)

        // Assert
        expect(result).toBe(0.01)
      })

      it('should handle large quantities', () => {
        // Arrange
        const quantity = 100000
        const unitPrice = 99.99

        // Act
        const result = calculateLineTotal(quantity, unitPrice, null)

        // Assert
        expect(result).toBe(9999000.0)
      })

      it('should handle undefined discount as null', () => {
        // Arrange
        const quantity = 100
        const unitPrice = 10.0

        // Act
        const result = calculateLineTotal(quantity, unitPrice, undefined as unknown as Discount | null)

        // Assert
        expect(result).toBe(1000.0)
      })
    })
  })

  describe('calculateOrderTotal()', () => {
    describe('AC5: Calculate SO total_amount from all lines', () => {
      it('should sum all line totals', () => {
        // Arrange
        const lines: SOLine[] = [
          { line_total: 500.0 },
          { line_total: 750.0 },
          { line_total: 250.0 },
        ]

        // Act
        const result = calculateOrderTotal(lines)

        // Assert
        expect(result).toBe(1500.0)
      })

      it('should handle single line', () => {
        // Arrange
        const lines: SOLine[] = [{ line_total: 999.99 }]

        // Act
        const result = calculateOrderTotal(lines)

        // Assert
        expect(result).toBe(999.99)
      })

      it('should handle empty lines array', () => {
        // Arrange
        const lines: SOLine[] = []

        // Act
        const result = calculateOrderTotal(lines)

        // Assert
        expect(result).toBe(0.0)
      })
    })

    describe('AC6: Recalculate totals on line edit', () => {
      it('should calculate correct total after line edit', () => {
        // Arrange: Original lines (500, 750, 250) = 1500
        // After edit: (500, 1000, 250) = 1750
        const editedLines: SOLine[] = [
          { line_total: 500.0 },
          { line_total: 1000.0 }, // Was 750, now 1000
          { line_total: 250.0 },
        ]

        // Act
        const result = calculateOrderTotal(editedLines)

        // Assert
        expect(result).toBe(1750.0)
      })
    })

    describe('AC7: Recalculate totals on line delete', () => {
      it('should calculate correct total after line delete', () => {
        // Arrange: After deleting Line 3 (250)
        const remainingLines: SOLine[] = [
          { line_total: 500.0 },
          { line_total: 750.0 },
        ]

        // Act
        const result = calculateOrderTotal(remainingLines)

        // Assert
        expect(result).toBe(1250.0)
      })
    })

    describe('Null handling', () => {
      it('should treat null line_total as 0', () => {
        // Arrange
        const lines: SOLine[] = [
          { line_total: 500.0 },
          { line_total: null },
          { line_total: 250.0 },
        ]

        // Act
        const result = calculateOrderTotal(lines)

        // Assert
        expect(result).toBe(750.0)
      })

      it('should handle all null line_totals', () => {
        // Arrange
        const lines: SOLine[] = [
          { line_total: null },
          { line_total: null },
        ]

        // Act
        const result = calculateOrderTotal(lines)

        // Assert
        expect(result).toBe(0.0)
      })
    })

    describe('Rounding', () => {
      it('should round total to 2 decimal places', () => {
        // Arrange: Lines that might cause floating point issues
        const lines: SOLine[] = [
          { line_total: 0.1 },
          { line_total: 0.2 },
        ]

        // Act
        const result = calculateOrderTotal(lines)

        // Assert
        expect(result).toBe(0.3)
      })
    })
  })

  describe('getProductPrice()', () => {
    describe('AC1: Auto-populate unit_price from product master', () => {
      it('should return std_price for valid product', async () => {
        // Arrange
        mockQuery.single.mockResolvedValue({
          data: { std_price: 25.5 },
          error: null,
        })

        // Act
        const result = await getProductPrice('prod-123')

        // Assert
        expect(result).toBe(25.5)
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('products')
        expect(mockQuery.select).toHaveBeenCalledWith('std_price')
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'prod-123')
      })

      it('should return std_price with decimal precision', async () => {
        // Arrange
        mockQuery.single.mockResolvedValue({
          data: { std_price: 12.99 },
          error: null,
        })

        // Act
        const result = await getProductPrice('prod-456')

        // Assert
        expect(result).toBe(12.99)
      })
    })

    describe('AC11: Handle products without std_price', () => {
      it('should return null when product not found', async () => {
        // Arrange
        mockQuery.single.mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        })

        // Act
        const result = await getProductPrice('invalid-id')

        // Assert
        expect(result).toBeNull()
      })

      it('should return null when std_price is null', async () => {
        // Arrange
        mockQuery.single.mockResolvedValue({
          data: { std_price: null },
          error: null,
        })

        // Act
        const result = await getProductPrice('prod-no-price')

        // Assert
        expect(result).toBeNull()
      })

      it('should return 0 when std_price is 0', async () => {
        // Arrange
        mockQuery.single.mockResolvedValue({
          data: { std_price: 0 },
          error: null,
        })

        // Act
        const result = await getProductPrice('prod-free')

        // Assert
        expect(result).toBe(0)
      })
    })

    describe('Error handling', () => {
      it('should return null on database error', async () => {
        // Arrange
        mockQuery.single.mockResolvedValue({
          data: null,
          error: { message: 'Database connection error' },
        })

        // Act
        const result = await getProductPrice('prod-123')

        // Assert
        expect(result).toBeNull()
      })
    })
  })

  describe('validateUnitPrice()', () => {
    describe('AC8: Validate positive unit_price', () => {
      it('should reject unit_price = 0', () => {
        // Act
        const result = validateUnitPrice(0)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('greater than zero')
      })

      it('should reject negative unit_price', () => {
        // Act
        const result = validateUnitPrice(-5.0)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('greater than zero')
      })

      it('should accept positive unit_price', () => {
        // Act
        const result = validateUnitPrice(10.0)

        // Assert
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should accept very small positive price', () => {
        // Act
        const result = validateUnitPrice(0.01)

        // Assert
        expect(result.valid).toBe(true)
      })

      it('should accept large price', () => {
        // Act
        const result = validateUnitPrice(99999.99)

        // Assert
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('validateDiscount()', () => {
    describe('AC9: Validate non-negative discount', () => {
      it('should reject negative percentage discount', () => {
        // Arrange
        const discount: Discount = { type: 'percent', value: -10 }

        // Act
        const result = validateDiscount(discount)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('negative')
      })

      it('should reject negative fixed discount', () => {
        // Arrange
        const discount: Discount = { type: 'fixed', value: -50 }

        // Act
        const result = validateDiscount(discount)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('negative')
      })

      it('should accept zero discount', () => {
        // Arrange
        const discount: Discount = { type: 'percent', value: 0 }

        // Act
        const result = validateDiscount(discount)

        // Assert
        expect(result.valid).toBe(true)
      })
    })

    describe('AC10: Validate percentage discount <= 100%', () => {
      it('should reject percentage discount > 100', () => {
        // Arrange
        const discount: Discount = { type: 'percent', value: 150 }

        // Act
        const result = validateDiscount(discount)

        // Assert
        expect(result.valid).toBe(false)
        expect(result.error).toContain('100')
      })

      it('should accept percentage discount = 100', () => {
        // Arrange
        const discount: Discount = { type: 'percent', value: 100 }

        // Act
        const result = validateDiscount(discount)

        // Assert
        expect(result.valid).toBe(true)
      })

      it('should accept percentage discount < 100', () => {
        // Arrange
        const discount: Discount = { type: 'percent', value: 50 }

        // Act
        const result = validateDiscount(discount)

        // Assert
        expect(result.valid).toBe(true)
      })

      it('should NOT apply 100% cap to fixed discount', () => {
        // Arrange: Fixed discount can be any amount
        const discount: Discount = { type: 'fixed', value: 500 }

        // Act
        const result = validateDiscount(discount)

        // Assert
        expect(result.valid).toBe(true)
      })
    })

    describe('Null discount handling', () => {
      it('should accept null discount', () => {
        // Act
        const result = validateDiscount(null)

        // Assert
        expect(result.valid).toBe(true)
      })

      it('should accept undefined discount', () => {
        // Act
        const result = validateDiscount(undefined as unknown as Discount | null)

        // Assert
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('Performance', () => {
    it('should calculate order total for 100 lines in < 10ms', () => {
      // Arrange
      const lines: SOLine[] = Array.from({ length: 100 }, (_, i) => ({
        line_total: 100 + i * 0.5,
      }))

      // Act
      const startTime = performance.now()
      const result = calculateOrderTotal(lines)
      const endTime = performance.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(10)
      expect(result).toBeGreaterThan(0)
    })
  })
})
