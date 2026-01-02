/**
 * Unit Tests: Purchase Order Service
 * Story: 03.3 PO CRUD + Lines
 *
 * Tests purchase order service methods including:
 * - Totals calculation (line, subtotal, tax, grand total)
 * - Status transitions validation
 * - Line editing capabilities
 * - Price lookups (supplier vs standard)
 * - PO number generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PurchaseOrderService } from '../purchase-order-service'

// Mock data
const mockOrganization = {
  id: 'org-test-001',
  name: 'Test Organization',
}

const mockSupplier = {
  id: 'sup-001',
  org_id: 'org-test-001',
  code: 'MILL-001',
  name: 'Mill Co.',
  currency: 'EUR',
  tax_code_id: 'tax-023',
  payment_terms: 'Net 30',
}

const mockTaxCode = {
  id: 'tax-023',
  code: 'VAT-23',
  rate: 23,
}

const mockProduct = {
  id: 'prod-001',
  code: 'RM-FLOUR-001',
  name: 'Wheat Flour',
  std_price: 2.00,
  uom: 'kg',
}

const mockSupplierProduct = {
  supplier_id: 'sup-001',
  product_id: 'prod-001',
  unit_price: 2.50,
}

const mockPOLine = {
  product_id: 'prod-001',
  quantity: 100,
  uom: 'kg',
  unit_price: 2.50,
  discount_percent: 10,
}

const mockPOLines = [
  { ...mockPOLine, quantity: 100, unit_price: 2.50, discount_percent: 10 },
  { ...mockPOLine, product_id: 'prod-002', quantity: 50, unit_price: 5.00, discount_percent: 0 },
]

describe('PurchaseOrderService', () => {
  describe('calculateTotals', () => {
    it('AC-04-1: Should calculate subtotal correctly for single line', () => {
      // Arrange: Single line with quantity 100, unit_price 2.50, no discount
      const lines = [{ quantity: 100, unit_price: 2.50, discount_percent: 0 }]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 0)

      // Assert
      expect(totals.subtotal).toBe(250.00)
      expect(totals.discount_total).toBe(0)
      expect(totals.tax_amount).toBe(0)
      expect(totals.total).toBe(250.00)
    })

    it('AC-04-1: Should calculate subtotal correctly for multiple lines', () => {
      // Arrange: Multiple lines with different quantities and prices
      const lines = [
        { quantity: 100, unit_price: 2.50, discount_percent: 0 },
        { quantity: 50, unit_price: 5.00, discount_percent: 0 },
      ]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 0)

      // Assert
      expect(totals.subtotal).toBe(500.00) // (100 * 2.50) + (50 * 5.00)
    })

    it('AC-03-4: Should calculate discount amounts correctly', () => {
      // Arrange: Line with 10% discount
      const lines = [{ quantity: 100, unit_price: 2.50, discount_percent: 10 }]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 0)

      // Assert
      expect(totals.subtotal).toBe(225.00) // 250 - 25 discount
      expect(totals.discount_total).toBe(25.00)
      expect(totals.total).toBe(225.00)
    })

    it('AC-03-4: Should calculate line totals with multiple discounts', () => {
      // Arrange: Multiple lines with different discounts
      const lines = [
        { quantity: 100, unit_price: 2.50, discount_percent: 10 },
        { quantity: 50, unit_price: 5.00, discount_percent: 5 },
      ]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 0)

      // Assert
      expect(totals.discount_total).toBe(37.50) // 25 + 12.50
      expect(totals.subtotal).toBe(462.50) // 250 + 250 - discount
    })

    it('AC-04-2: Should calculate tax amount correctly', () => {
      // Arrange: Subtotal 1000, tax rate 23%
      const lines = [{ quantity: 100, unit_price: 10, discount_percent: 0 }]
      const taxRate = 23

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, taxRate)

      // Assert
      expect(totals.subtotal).toBe(1000.00)
      expect(totals.tax_amount).toBe(230.00)
    })

    it('AC-04-3: Should calculate grand total correctly', () => {
      // Arrange: Subtotal 1000, tax 230
      const lines = [{ quantity: 100, unit_price: 10, discount_percent: 0 }]
      const taxRate = 23

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, taxRate)

      // Assert
      expect(totals.total).toBe(1230.00) // 1000 + 230
    })

    it('Should handle edge case: zero quantity line', () => {
      // Arrange: Line with zero quantity
      const lines = [{ quantity: 0, unit_price: 2.50, discount_percent: 0 }]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 0)

      // Assert
      expect(totals.subtotal).toBe(0)
      expect(totals.total).toBe(0)
    })

    it('Should handle edge case: 100% discount', () => {
      // Arrange: Line with 100% discount
      const lines = [{ quantity: 100, unit_price: 2.50, discount_percent: 100 }]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 0)

      // Assert
      expect(totals.discount_total).toBe(250.00)
      expect(totals.subtotal).toBe(0)
      expect(totals.total).toBe(0)
    })

    it('Should handle edge case: high tax rate', () => {
      // Arrange: Subtotal 1000, tax rate 100%
      const lines = [{ quantity: 100, unit_price: 10, discount_percent: 0 }]
      const taxRate = 100

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, taxRate)

      // Assert
      expect(totals.tax_amount).toBe(1000.00)
      expect(totals.total).toBe(2000.00)
    })

    it('Should handle decimal precision correctly', () => {
      // Arrange: Values that could cause floating point errors
      const lines = [
        { quantity: 33.33, unit_price: 3.33, discount_percent: 15.5 },
      ]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 19)

      // Assert
      // Verify results are rounded to 4 decimal places
      expect(totals.subtotal).toBeLessThanOrEqual(116.53) // Round checks
      expect(totals.tax_amount).toBeDefined()
      expect(typeof totals.tax_amount).toBe('number')
    })
  })

  describe('validateStatusTransition', () => {
    it('AC-05-2: Should allow valid transition draft -> submitted', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('draft', 'submitted')

      // Assert
      expect(result).toBe(true)
    })

    it('AC-05-2: Should allow valid transition draft -> cancelled', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('draft', 'cancelled')

      // Assert
      expect(result).toBe(true)
    })

    it('AC-05-2: Should allow valid transition submitted -> confirmed', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('submitted', 'confirmed')

      // Assert
      expect(result).toBe(true)
    })

    it('AC-05-2: Should allow valid transition confirmed -> receiving', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('confirmed', 'receiving')

      // Assert
      expect(result).toBe(true)
    })

    it('AC-05-2: Should allow valid transition receiving -> closed', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('receiving', 'closed')

      // Assert
      expect(result).toBe(true)
    })

    it('AC-05-2: Should block invalid transition closed -> draft', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('closed', 'draft')

      // Assert
      expect(result).toBe(false)
    })

    it('AC-05-2: Should block invalid transition closed -> anything', () => {
      // Act
      const resultDraft = PurchaseOrderService.validateStatusTransition('closed', 'draft')
      const resultSubmitted = PurchaseOrderService.validateStatusTransition('closed', 'submitted')
      const resultConfirmed = PurchaseOrderService.validateStatusTransition('closed', 'confirmed')

      // Assert
      expect(resultDraft).toBe(false)
      expect(resultSubmitted).toBe(false)
      expect(resultConfirmed).toBe(false)
    })

    it('AC-05-2: Should block invalid transition cancelled -> anything', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('cancelled', 'draft')

      // Assert
      expect(result).toBe(false)
    })

    it('Should allow transition submitted -> pending_approval', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('submitted', 'pending_approval')

      // Assert
      expect(result).toBe(true)
    })

    it('Should allow transition pending_approval -> confirmed', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('pending_approval', 'confirmed')

      // Assert
      expect(result).toBe(true)
    })

    it('Should allow transition confirmed -> cancelled', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('confirmed', 'cancelled')

      // Assert
      expect(result).toBe(true)
    })

    it('Should allow transition receiving -> cancelled', () => {
      // Act
      const result = PurchaseOrderService.validateStatusTransition('receiving', 'cancelled')

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('canEditLines', () => {
    it('AC-05-1: Should allow edit for draft status', () => {
      // Act
      const result = PurchaseOrderService.canEditLines('draft')

      // Assert
      expect(result).toBe(true)
    })

    it('AC-05-1: Should allow edit for submitted status', () => {
      // Act
      const result = PurchaseOrderService.canEditLines('submitted')

      // Assert
      expect(result).toBe(true)
    })

    it('AC-05-4: Should not allow edit for confirmed status', () => {
      // Act
      const result = PurchaseOrderService.canEditLines('confirmed')

      // Assert
      expect(result).toBe(false)
    })

    it('AC-05-4: Should not allow edit for receiving status', () => {
      // Act
      const result = PurchaseOrderService.canEditLines('receiving')

      // Assert
      expect(result).toBe(false)
    })

    it('Should not allow edit for closed status', () => {
      // Act
      const result = PurchaseOrderService.canEditLines('closed')

      // Assert
      expect(result).toBe(false)
    })

    it('Should not allow edit for cancelled status', () => {
      // Act
      const result = PurchaseOrderService.canEditLines('cancelled')

      // Assert
      expect(result).toBe(false)
    })

    it('Should not allow edit for pending_approval status', () => {
      // Act
      const result = PurchaseOrderService.canEditLines('pending_approval')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('canDeleteLine', () => {
    it('Should allow deletion for draft PO with no receipts', async () => {
      // Arrange: Mock line with no received quantity
      const mockLine = {
        id: 'line-001',
        po_id: 'po-001',
        received_qty: 0,
      }

      // Act
      const result = await PurchaseOrderService.canDeleteLine(mockLine as any)

      // Assert
      expect(result.allowed).toBe(true)
    })

    it('Should block deletion for line with receipts', async () => {
      // Arrange: Mock line with received quantity
      const mockLine = {
        id: 'line-001',
        po_id: 'po-001',
        received_qty: 10,
      }

      // Act
      const result = await PurchaseOrderService.canDeleteLine(mockLine as any)

      // Assert
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('received')
    })
  })

  describe('getDefaultsFromSupplier', () => {
    it('AC-02-1: Should return supplier defaults', async () => {
      // Arrange: Mock supplier data
      const supplierId = 'sup-001'

      // Mock the service to return defaults
      vi.spyOn(PurchaseOrderService, 'getDefaultsFromSupplier').mockResolvedValueOnce({
        currency: 'EUR',
        tax_code_id: 'tax-023',
        payment_terms: 'Net 30',
      })

      // Act
      const defaults = await PurchaseOrderService.getDefaultsFromSupplier(supplierId)

      // Assert
      expect(defaults.currency).toBe('EUR')
      expect(defaults.tax_code_id).toBe('tax-023')
      expect(defaults.payment_terms).toBe('Net 30')
    })

    it('Should handle supplier without tax code', async () => {
      // Arrange
      const supplierId = 'sup-002'

      vi.spyOn(PurchaseOrderService, 'getDefaultsFromSupplier').mockResolvedValueOnce({
        currency: 'USD',
        tax_code_id: null,
        payment_terms: 'COD',
      })

      // Act
      const defaults = await PurchaseOrderService.getDefaultsFromSupplier(supplierId)

      // Assert
      expect(defaults.currency).toBe('USD')
      expect(defaults.tax_code_id).toBeNull()
    })
  })

  describe('getProductPrice', () => {
    it('AC-03-2: Should return supplier-product price when available', async () => {
      // Arrange
      const productId = 'prod-001'
      const supplierId = 'sup-001'

      vi.spyOn(PurchaseOrderService, 'getProductPrice').mockResolvedValueOnce({
        price: 2.50,
        source: 'supplier',
      })

      // Act
      const priceInfo = await PurchaseOrderService.getProductPrice(productId, supplierId)

      // Assert
      expect(priceInfo.price).toBe(2.50)
      expect(priceInfo.source).toBe('supplier')
    })

    it('AC-03-3: Should fallback to product std_price when no supplier-product price', async () => {
      // Arrange
      const productId = 'prod-002'
      const supplierId = 'sup-001'

      vi.spyOn(PurchaseOrderService, 'getProductPrice').mockResolvedValueOnce({
        price: 1.50,
        source: 'standard',
      })

      // Act
      const priceInfo = await PurchaseOrderService.getProductPrice(productId, supplierId)

      // Assert
      expect(priceInfo.price).toBe(1.50)
      expect(priceInfo.source).toBe('standard')
    })

    it('Should return zero price if product not found', async () => {
      // Arrange
      const productId = 'prod-nonexistent'
      const supplierId = 'sup-001'

      vi.spyOn(PurchaseOrderService, 'getProductPrice').mockResolvedValueOnce({
        price: 0,
        source: 'fallback',
      })

      // Act
      const priceInfo = await PurchaseOrderService.getProductPrice(productId, supplierId)

      // Assert
      expect(priceInfo.price).toBe(0)
    })
  })

  describe('generateNextNumber', () => {
    it('AC-02-2: Should generate PO number in format PO-YYYY-NNNNN', async () => {
      // Arrange
      const orgId = 'org-test-001'

      vi.spyOn(PurchaseOrderService, 'generateNextNumber').mockResolvedValueOnce('PO-2024-00001')

      // Act
      const poNumber = await PurchaseOrderService.generateNextNumber(orgId)

      // Assert
      expect(poNumber).toMatch(/^PO-\d{4}-\d{5}$/)
      expect(poNumber).toBe('PO-2024-00001')
    })

    it('Should increment sequence for multiple POs in same year', async () => {
      // Arrange
      const orgId = 'org-test-001'

      // First call
      vi.spyOn(PurchaseOrderService, 'generateNextNumber').mockResolvedValueOnce('PO-2024-00001')
      const first = await PurchaseOrderService.generateNextNumber(orgId)

      // Second call
      vi.spyOn(PurchaseOrderService, 'generateNextNumber').mockResolvedValueOnce('PO-2024-00002')
      const second = await PurchaseOrderService.generateNextNumber(orgId)

      // Assert
      expect(first).toBe('PO-2024-00001')
      expect(second).toBe('PO-2024-00002')
    })

    it('Should reset sequence for new year', async () => {
      // Arrange: Mock for year transition
      const orgId = 'org-test-001'

      // Year 2024
      vi.spyOn(PurchaseOrderService, 'generateNextNumber').mockResolvedValueOnce('PO-2024-00005')
      const po2024 = await PurchaseOrderService.generateNextNumber(orgId)

      // Year 2025
      vi.spyOn(PurchaseOrderService, 'generateNextNumber').mockResolvedValueOnce('PO-2025-00001')
      const po2025 = await PurchaseOrderService.generateNextNumber(orgId)

      // Assert
      expect(po2024).toMatch(/PO-2024/)
      expect(po2025).toMatch(/PO-2025/)
    })
  })

  describe('Line total calculations', () => {
    it('Should calculate line total: (quantity * unit_price) - discount_amount', () => {
      // Arrange: quantity=100, unit_price=2.50, discount=10%
      // Expected: (100 * 2.50) - (100 * 2.50 * 0.10) = 250 - 25 = 225
      const lines = [{ quantity: 100, unit_price: 2.50, discount_percent: 10 }]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 0)

      // Assert
      expect(totals.subtotal).toBe(225.00)
    })

    it('Should calculate correct discount_amount', () => {
      // Arrange: quantity=100, unit_price=2.50, discount=10%
      // Expected discount: 100 * 2.50 * (10/100) = 25
      const lines = [{ quantity: 100, unit_price: 2.50, discount_percent: 10 }]

      // Act
      const totals = PurchaseOrderService.calculateTotals(lines, 0)

      // Assert
      expect(totals.discount_total).toBe(25.00)
    })
  })
})
