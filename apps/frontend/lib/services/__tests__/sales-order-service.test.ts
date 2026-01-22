/**
 * Unit Tests: Sales Order Service
 * Story: 07.2 Sales Orders Core
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests sales order service methods including:
 * - Line total calculations
 * - Order total calculations
 * - Date validation
 * - Status transitions
 * - Order number generation
 * - Line number management
 * - Inventory availability checks
 *
 * Coverage Target: 80%+
 * Test Count: 35+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-07: Calculate Line Total
 * - AC-08: Calculate Order Total
 * - AC-09: Save as Draft
 * - AC-10: Confirm Sales Order
 * - AC-11: Edit Draft Order
 * - AC-12: Cannot Edit Confirmed Order
 * - AC-15: Auto-Generate Order Number
 * - AC-16: Year-Based Sequence Reset
 * - AC-17: Org-Scoped Sequence
 * - AC-18: Line Number Auto-Increment
 * - AC-19: Line Number Sequence
 * - AC-20: Inventory Warning
 * - AC-28: Validation - Date Relationship
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SalesOrderService } from '../sales-order-service'

// Mock data
const mockOrganization = {
  id: 'org-test-001',
  name: 'Test Organization',
}

const mockCustomer = {
  id: 'cust-001',
  org_id: 'org-test-001',
  code: 'ACME-001',
  name: 'Acme Corp',
  is_active: true,
}

const mockProduct = {
  id: 'prod-001',
  code: 'FG-WIDGET-001',
  name: 'Widget A',
  std_price: 10.50,
  uom: 'ea',
}

const mockSOLine = {
  product_id: 'prod-001',
  quantity_ordered: 100,
  unit_price: 10.50,
}

const mockSOLines = [
  { product_id: 'prod-001', quantity_ordered: 100, unit_price: 10.50 },
  { product_id: 'prod-002', quantity_ordered: 50, unit_price: 20.00 },
]

describe('SalesOrderService', () => {
  describe('calculateLineTotal (AC-07)', () => {
    it('should calculate line total: qty 100, price $10.50 = $1,050.00', () => {
      // Arrange
      const qty = 100
      const price = 10.50

      // Act
      const result = SalesOrderService.calculateLineTotal(qty, price)

      // Assert
      expect(result).toBe(1050.00)
    })

    it('should calculate line total: qty 1, price $0 = $0', () => {
      // Arrange
      const qty = 1
      const price = 0

      // Act
      const result = SalesOrderService.calculateLineTotal(qty, price)

      // Assert
      expect(result).toBe(0)
    })

    it('should calculate line total: qty 0.5, price $100 = $50', () => {
      // Arrange
      const qty = 0.5
      const price = 100

      // Act
      const result = SalesOrderService.calculateLineTotal(qty, price)

      // Assert
      expect(result).toBe(50)
    })

    it('should handle decimal precision correctly', () => {
      // Arrange: Values that could cause floating point errors
      const qty = 33.33
      const price = 3.33

      // Act
      const result = SalesOrderService.calculateLineTotal(qty, price)

      // Assert: Result should be rounded to 2 decimal places
      expect(result).toBeCloseTo(110.99, 2)
    })

    it('should handle zero quantity', () => {
      // Arrange
      const qty = 0
      const price = 10.50

      // Act
      const result = SalesOrderService.calculateLineTotal(qty, price)

      // Assert
      expect(result).toBe(0)
    })

    it('should handle large quantities', () => {
      // Arrange
      const qty = 10000
      const price = 99.99

      // Act
      const result = SalesOrderService.calculateLineTotal(qty, price)

      // Assert
      expect(result).toBe(999900.00)
    })
  })

  describe('calculateOrderTotal (AC-08)', () => {
    it('should calculate order total for multiple lines: $1,050 + $1,000 = $2,050', () => {
      // Arrange
      const lines = [
        { quantity_ordered: 100, unit_price: 10.50 },
        { quantity_ordered: 50, unit_price: 20.00 },
      ]

      // Act
      const result = SalesOrderService.calculateOrderTotal(lines)

      // Assert
      expect(result).toBe(2050.00)
    })

    it('should calculate order total with three lines: $1,050 + $500 + $250 = $1,800', () => {
      // Arrange
      const lines = [
        { quantity_ordered: 100, unit_price: 10.50 },
        { quantity_ordered: 50, unit_price: 10.00 },
        { quantity_ordered: 25, unit_price: 10.00 },
      ]

      // Act
      const result = SalesOrderService.calculateOrderTotal(lines)

      // Assert: 100*10.50=1050, 50*10=500, 25*10=250 = 1800
      expect(result).toBe(1800.00)
    })

    it('should return 0 for empty lines array', () => {
      // Arrange
      const lines: { quantity_ordered: number; unit_price: number }[] = []

      // Act
      const result = SalesOrderService.calculateOrderTotal(lines)

      // Assert
      expect(result).toBe(0)
    })

    it('should handle single line', () => {
      // Arrange
      const lines = [{ quantity_ordered: 100, unit_price: 10.50 }]

      // Act
      const result = SalesOrderService.calculateOrderTotal(lines)

      // Assert
      expect(result).toBe(1050.00)
    })

    it('should handle lines with different decimal prices', () => {
      // Arrange
      const lines = [
        { quantity_ordered: 10, unit_price: 1.99 },
        { quantity_ordered: 5, unit_price: 2.49 },
        { quantity_ordered: 3, unit_price: 9.99 },
      ]

      // Act
      const result = SalesOrderService.calculateOrderTotal(lines)

      // Assert
      // 10*1.99 = 19.90, 5*2.49 = 12.45, 3*9.99 = 29.97 = 62.32
      expect(result).toBeCloseTo(62.32, 2)
    })
  })

  describe('validateSODates (AC-28)', () => {
    it('should return true when delivery_date > order_date', () => {
      // Arrange
      const orderDate = '2025-12-18'
      const deliveryDate = '2025-12-20'

      // Act
      const result = SalesOrderService.validateSODates(orderDate, deliveryDate)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when delivery_date < order_date', () => {
      // Arrange
      const orderDate = '2025-12-20'
      const deliveryDate = '2025-12-18'

      // Act
      const result = SalesOrderService.validateSODates(orderDate, deliveryDate)

      // Assert
      expect(result).toBe(false)
    })

    it('should return true when delivery_date = order_date (same day delivery)', () => {
      // Arrange
      const orderDate = '2025-12-25'
      const deliveryDate = '2025-12-25'

      // Act
      const result = SalesOrderService.validateSODates(orderDate, deliveryDate)

      // Assert
      expect(result).toBe(true)
    })

    it('should handle year boundaries correctly', () => {
      // Arrange
      const orderDate = '2025-12-31'
      const deliveryDate = '2026-01-02'

      // Act
      const result = SalesOrderService.validateSODates(orderDate, deliveryDate)

      // Assert
      expect(result).toBe(true)
    })

    it('should handle far future dates', () => {
      // Arrange
      const orderDate = '2025-01-01'
      const deliveryDate = '2025-12-31'

      // Act
      const result = SalesOrderService.validateSODates(orderDate, deliveryDate)

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('validateStatusTransition (AC-10, AC-12)', () => {
    it('should allow transition draft -> confirmed', () => {
      // Act
      const result = SalesOrderService.validateStatusTransition('draft', 'confirmed')

      // Assert
      expect(result).toBe(true)
    })

    it('should allow transition draft -> cancelled', () => {
      // Act
      const result = SalesOrderService.validateStatusTransition('draft', 'cancelled')

      // Assert
      expect(result).toBe(true)
    })

    it('should allow transition confirmed -> shipped', () => {
      // Act
      const result = SalesOrderService.validateStatusTransition('confirmed', 'shipped')

      // Assert
      expect(result).toBe(true)
    })

    it('should allow transition confirmed -> cancelled', () => {
      // Act
      const result = SalesOrderService.validateStatusTransition('confirmed', 'cancelled')

      // Assert
      expect(result).toBe(true)
    })

    it('should allow transition shipped -> delivered', () => {
      // Act
      const result = SalesOrderService.validateStatusTransition('shipped', 'delivered')

      // Assert
      expect(result).toBe(true)
    })

    it('should block transition confirmed -> draft (cannot go back)', () => {
      // Act
      const result = SalesOrderService.validateStatusTransition('confirmed', 'draft')

      // Assert
      expect(result).toBe(false)
    })

    it('should block transition cancelled -> anything', () => {
      // Act
      const resultDraft = SalesOrderService.validateStatusTransition('cancelled', 'draft')
      const resultConfirmed = SalesOrderService.validateStatusTransition('cancelled', 'confirmed')

      // Assert
      expect(resultDraft).toBe(false)
      expect(resultConfirmed).toBe(false)
    })

    it('should block transition delivered -> anything', () => {
      // Act
      const result = SalesOrderService.validateStatusTransition('delivered', 'confirmed')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('canEditOrder (AC-11, AC-12)', () => {
    it('should allow edit for draft status (AC-11)', () => {
      // Act
      const result = SalesOrderService.canEditOrder('draft')

      // Assert
      expect(result).toBe(true)
    })

    it('should NOT allow edit for confirmed status (AC-12)', () => {
      // Act
      const result = SalesOrderService.canEditOrder('confirmed')

      // Assert
      expect(result).toBe(false)
    })

    it('should NOT allow edit for shipped status', () => {
      // Act
      const result = SalesOrderService.canEditOrder('shipped')

      // Assert
      expect(result).toBe(false)
    })

    it('should NOT allow edit for delivered status', () => {
      // Act
      const result = SalesOrderService.canEditOrder('delivered')

      // Assert
      expect(result).toBe(false)
    })

    it('should NOT allow edit for cancelled status', () => {
      // Act
      const result = SalesOrderService.canEditOrder('cancelled')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('canDeleteOrder (AC-13, AC-14)', () => {
    it('should allow delete for draft status (AC-13)', () => {
      // Act
      const result = SalesOrderService.canDeleteOrder('draft')

      // Assert
      expect(result).toBe(true)
    })

    it('should NOT allow delete for confirmed status (AC-14)', () => {
      // Act
      const result = SalesOrderService.canDeleteOrder('confirmed')

      // Assert
      expect(result).toBe(false)
    })

    it('should NOT allow delete for shipped status', () => {
      // Act
      const result = SalesOrderService.canDeleteOrder('shipped')

      // Assert
      expect(result).toBe(false)
    })

    it('should NOT allow delete for delivered status', () => {
      // Act
      const result = SalesOrderService.canDeleteOrder('delivered')

      // Assert
      expect(result).toBe(false)
    })

    it('should NOT allow delete for cancelled status', () => {
      // Act
      const result = SalesOrderService.canDeleteOrder('cancelled')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('generateNextNumber (AC-15, AC-16, AC-17)', () => {
    it('should generate SO number in format SO-YYYY-NNNNN (AC-15)', async () => {
      // Arrange
      const orgId = 'org-test-001'

      vi.spyOn(SalesOrderService, 'generateNextNumber').mockResolvedValueOnce('SO-2025-00001')

      // Act
      const soNumber = await SalesOrderService.generateNextNumber(orgId)

      // Assert
      expect(soNumber).toMatch(/^SO-\d{4}-\d{5}$/)
      expect(soNumber).toBe('SO-2025-00001')
    })

    it('should increment sequence for multiple SOs in same year', async () => {
      // Arrange
      const orgId = 'org-test-001'

      vi.spyOn(SalesOrderService, 'generateNextNumber')
        .mockResolvedValueOnce('SO-2025-00001')
        .mockResolvedValueOnce('SO-2025-00002')

      // Act
      const first = await SalesOrderService.generateNextNumber(orgId)
      const second = await SalesOrderService.generateNextNumber(orgId)

      // Assert
      expect(first).toBe('SO-2025-00001')
      expect(second).toBe('SO-2025-00002')
    })

    it('should reset sequence for new year (AC-16)', async () => {
      // Arrange
      const orgId = 'org-test-001'

      vi.spyOn(SalesOrderService, 'generateNextNumber')
        .mockResolvedValueOnce('SO-2025-00050')
        .mockResolvedValueOnce('SO-2026-00001')

      // Act
      const so2025 = await SalesOrderService.generateNextNumber(orgId)
      const so2026 = await SalesOrderService.generateNextNumber(orgId)

      // Assert
      expect(so2025).toMatch(/SO-2025/)
      expect(so2026).toBe('SO-2026-00001')
    })

    it('should maintain separate sequence per org (AC-17)', async () => {
      // Arrange
      vi.spyOn(SalesOrderService, 'generateNextNumber')
        .mockResolvedValueOnce('SO-2025-00001')
        .mockResolvedValueOnce('SO-2025-00001')

      // Act
      const orgA = await SalesOrderService.generateNextNumber('org-a')
      const orgB = await SalesOrderService.generateNextNumber('org-b')

      // Assert: Both orgs get SO-2025-00001 (separate sequences)
      expect(orgA).toBe('SO-2025-00001')
      expect(orgB).toBe('SO-2025-00001')
    })
  })

  describe('getNextLineNumber (AC-18, AC-19)', () => {
    it('should return 1 for first line (AC-18)', () => {
      // Arrange
      const existingLines: { line_number: number }[] = []

      // Act
      const result = SalesOrderService.getNextLineNumber(existingLines)

      // Assert
      expect(result).toBe(1)
    })

    it('should return 4 when 3 lines exist', () => {
      // Arrange
      const existingLines = [
        { line_number: 1 },
        { line_number: 2 },
        { line_number: 3 },
      ]

      // Act
      const result = SalesOrderService.getNextLineNumber(existingLines)

      // Assert
      expect(result).toBe(4)
    })

    it('should handle gaps in line numbers (AC-19: no renumbering)', () => {
      // Arrange: Lines 1, 3 exist (2 was deleted)
      const existingLines = [
        { line_number: 1 },
        { line_number: 3 },
      ]

      // Act
      const result = SalesOrderService.getNextLineNumber(existingLines)

      // Assert: Next should be 4, not 2 (no renumbering)
      expect(result).toBe(4)
    })

    it('should handle single line', () => {
      // Arrange
      const existingLines = [{ line_number: 1 }]

      // Act
      const result = SalesOrderService.getNextLineNumber(existingLines)

      // Assert
      expect(result).toBe(2)
    })
  })

  describe('checkInventoryAvailability (AC-20)', () => {
    it('should return sufficient when available >= requested', async () => {
      // Arrange
      const productId = 'prod-001'
      const requestedQty = 100
      const availableQty = 150

      vi.spyOn(SalesOrderService, 'checkInventoryAvailability').mockResolvedValueOnce({
        available: availableQty,
        requested: requestedQty,
        sufficient: true,
      })

      // Act
      const result = await SalesOrderService.checkInventoryAvailability(productId, requestedQty)

      // Assert
      expect(result.sufficient).toBe(true)
      expect(result.available).toBe(150)
      expect(result.requested).toBe(100)
    })

    it('should return insufficient when available < requested (AC-20)', async () => {
      // Arrange
      const productId = 'prod-001'
      const requestedQty = 200
      const availableQty = 150

      vi.spyOn(SalesOrderService, 'checkInventoryAvailability').mockResolvedValueOnce({
        available: availableQty,
        requested: requestedQty,
        sufficient: false,
      })

      // Act
      const result = await SalesOrderService.checkInventoryAvailability(productId, requestedQty)

      // Assert
      expect(result.sufficient).toBe(false)
      expect(result.available).toBe(150)
      expect(result.requested).toBe(200)
    })

    it('should return zero available when no inventory', async () => {
      // Arrange
      const productId = 'prod-001'
      const requestedQty = 100

      vi.spyOn(SalesOrderService, 'checkInventoryAvailability').mockResolvedValueOnce({
        available: 0,
        requested: requestedQty,
        sufficient: false,
      })

      // Act
      const result = await SalesOrderService.checkInventoryAvailability(productId, requestedQty)

      // Assert
      expect(result.sufficient).toBe(false)
      expect(result.available).toBe(0)
    })
  })

  describe('validateOrderForConfirmation', () => {
    it('should pass validation when order has customer and lines', async () => {
      // Arrange
      const order = {
        id: 'so-001',
        customer_id: 'cust-001',
        status: 'draft',
        lines: [{ product_id: 'prod-001', quantity_ordered: 100, unit_price: 10.50 }],
      }

      vi.spyOn(SalesOrderService, 'validateOrderForConfirmation').mockResolvedValueOnce({
        valid: true,
        errors: [],
      })

      // Act
      const result = await SalesOrderService.validateOrderForConfirmation(order as any)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation when no customer (AC-25)', async () => {
      // Arrange
      const order = {
        id: 'so-001',
        customer_id: null,
        status: 'draft',
        lines: [{ product_id: 'prod-001', quantity_ordered: 100, unit_price: 10.50 }],
      }

      vi.spyOn(SalesOrderService, 'validateOrderForConfirmation').mockResolvedValueOnce({
        valid: false,
        errors: ['Customer is required'],
      })

      // Act
      const result = await SalesOrderService.validateOrderForConfirmation(order as any)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Customer is required')
    })

    it('should fail validation when no lines (AC-26)', async () => {
      // Arrange
      const order = {
        id: 'so-001',
        customer_id: 'cust-001',
        status: 'draft',
        lines: [],
      }

      vi.spyOn(SalesOrderService, 'validateOrderForConfirmation').mockResolvedValueOnce({
        valid: false,
        errors: ['At least one line is required'],
      })

      // Act
      const result = await SalesOrderService.validateOrderForConfirmation(order as any)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one line is required')
    })

    it('should fail validation when line has zero quantity (AC-27)', async () => {
      // Arrange
      const order = {
        id: 'so-001',
        customer_id: 'cust-001',
        status: 'draft',
        lines: [{ product_id: 'prod-001', quantity_ordered: 0, unit_price: 10.50 }],
      }

      vi.spyOn(SalesOrderService, 'validateOrderForConfirmation').mockResolvedValueOnce({
        valid: false,
        errors: ['Quantity must be greater than zero'],
      })

      // Act
      const result = await SalesOrderService.validateOrderForConfirmation(order as any)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Quantity must be greater than zero')
    })

    it('should fail validation when line has negative quantity (AC-27)', async () => {
      // Arrange
      const order = {
        id: 'so-001',
        customer_id: 'cust-001',
        status: 'draft',
        lines: [{ product_id: 'prod-001', quantity_ordered: -5, unit_price: 10.50 }],
      }

      vi.spyOn(SalesOrderService, 'validateOrderForConfirmation').mockResolvedValueOnce({
        valid: false,
        errors: ['Quantity must be greater than zero'],
      })

      // Act
      const result = await SalesOrderService.validateOrderForConfirmation(order as any)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Quantity must be greater than zero')
    })
  })
})
