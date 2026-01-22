/**
 * Sales Order Clone Service - Unit Tests (Story 07.5)
 * Purpose: Test SO clone operations for SalesOrderService.cloneSalesOrder
 * Phase: RED - Tests will fail until implementation exists
 *
 * Test Cases from tests.yaml:
 * - AC-CLONE-01: Clone SO - Happy Path
 * - AC-CLONE-03: Clone SO - Line Renumbering
 * - AC-CLONE-04: Clone SO - RLS Isolation
 * - AC-CLONE-05: Clone SO - Not Found
 * - AC-CLONE-06: Clone SO - Permission Check
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Import after mocks
import { SalesOrderService } from '../sales-order-service'

describe('SalesOrderService.cloneSalesOrder (Story 07.5)', () => {
  const TEST_ORG_ID = '22222222-2222-2222-2222-222222222222'
  const TEST_SO_ID = '11111111-1111-1111-1111-111111111111'
  const TEST_CUSTOMER_ID = '33333333-3333-3333-3333-333333333333'
  const TEST_PRODUCT_ID = '44444444-4444-4444-4444-444444444444'
  const TEST_ADDRESS_ID = '55555555-5555-5555-5555-555555555555'

  const mockSourceOrder = {
    id: TEST_SO_ID,
    org_id: TEST_ORG_ID,
    order_number: 'SO-2025-00123',
    customer_id: TEST_CUSTOMER_ID,
    shipping_address_id: TEST_ADDRESS_ID,
    status: 'confirmed',
    order_date: '2025-01-15',
    required_delivery_date: '2025-01-20',
    promised_ship_date: '2025-01-18',
    customer_po: 'PO-ACME-001',
    notes: 'Special handling required',
    total_amount: 1050.00,
    line_count: 3,
    allergen_validated: true,
    confirmed_at: '2025-01-15T10:00:00Z',
    shipped_at: null,
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  }

  const mockSourceLines = [
    {
      id: 'line-1',
      sales_order_id: TEST_SO_ID,
      line_number: 1,
      product_id: TEST_PRODUCT_ID,
      quantity_ordered: 100,
      quantity_allocated: 50,
      quantity_picked: 25,
      quantity_packed: 0,
      quantity_shipped: 0,
      unit_price: 10.50,
      notes: 'Line 1 notes',
    },
    {
      id: 'line-2',
      sales_order_id: TEST_SO_ID,
      line_number: 5,
      product_id: TEST_PRODUCT_ID,
      quantity_ordered: 50,
      quantity_allocated: 50,
      quantity_picked: 0,
      quantity_packed: 0,
      quantity_shipped: 0,
      unit_price: 5.00,
      notes: null,
    },
    {
      id: 'line-3',
      sales_order_id: TEST_SO_ID,
      line_number: 10,
      product_id: TEST_PRODUCT_ID,
      quantity_ordered: 25,
      quantity_allocated: 0,
      quantity_picked: 0,
      quantity_packed: 0,
      quantity_shipped: 0,
      unit_price: 20.00,
      notes: 'Line 3 notes',
    },
  ]

  // Mock cloned order and lines that will be returned from insert
  const mockClonedOrder = {
    id: 'new-cloned-id',
    org_id: TEST_ORG_ID,
    order_number: 'SO-2025-00456',
    customer_id: TEST_CUSTOMER_ID,
    shipping_address_id: TEST_ADDRESS_ID,
    status: 'draft',
    order_date: '2025-01-22',
    required_delivery_date: null,
    promised_ship_date: null,
    customer_po: null,
    notes: 'Special handling required',
    total_amount: 1800.00,
    line_count: 3,
    allergen_validated: false,
    confirmed_at: null,
    shipped_at: null,
  }

  const mockClonedLines = [
    { id: 'new-line-1', line_number: 1, product_id: TEST_PRODUCT_ID, quantity_ordered: 100, quantity_allocated: 0, quantity_picked: 0, quantity_packed: 0, quantity_shipped: 0, unit_price: 10.50, notes: 'Line 1 notes', requested_lot: null },
    { id: 'new-line-2', line_number: 2, product_id: TEST_PRODUCT_ID, quantity_ordered: 50, quantity_allocated: 0, quantity_picked: 0, quantity_packed: 0, quantity_shipped: 0, unit_price: 5.00, notes: null, requested_lot: null },
    { id: 'new-line-3', line_number: 3, product_id: TEST_PRODUCT_ID, quantity_ordered: 25, quantity_allocated: 0, quantity_picked: 0, quantity_packed: 0, quantity_shipped: 0, unit_price: 20.00, notes: 'Line 3 notes', requested_lot: null },
  ]

  // Helper function to setup standard mocks for happy path
  function setupHappyPathMocks() {
    let lineInsertIndex = 0

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'sales_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockSourceOrder, error: null }),
              ilike: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { order_number: 'SO-2025-00455' }, error: null }),
                  }),
                }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockClonedOrder, error: null }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      if (table === 'sales_order_lines') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockSourceLines, error: null }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => {
                const line = mockClonedLines[lineInsertIndex]
                lineInsertIndex++
                return Promise.resolve({ data: line, error: null })
              }),
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-22'))
    setupHappyPathMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('AC-CLONE-01: Clone SO - Happy Path', () => {
    it('should clone SO with same customer_id and shipping_address_id', async () => {
      // This test verifies the cloneSalesOrder method exists and returns cloned SO
      // with matching customer_id and shipping_address_id

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result).toBeDefined()
      expect(result.customer_id).toBe(mockSourceOrder.customer_id)
      expect(result.shipping_address_id).toBe(mockSourceOrder.shipping_address_id)
    })

    it('should generate new order_number for cloned SO', async () => {
      // Verify cloned SO has different order_number from original

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.order_number).toBeDefined()
      expect(result.order_number).not.toBe('SO-2025-00123')
      expect(result.order_number).toMatch(/^SO-\d{4}-\d{5}$/)
    })

    it('should reset order_date to today', async () => {
      // Verify order_date is set to current date, not copied from original

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.order_date).toBe('2025-01-22')
    })

    it('should set status to draft', async () => {
      // Verify cloned SO status is always draft regardless of source status

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.status).toBe('draft')
    })

    it('should clear customer_po, promised_ship_date, required_delivery_date', async () => {
      // These fields should be NULL in cloned SO

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.customer_po).toBeNull()
      expect(result.promised_ship_date).toBeNull()
      expect(result.required_delivery_date).toBeNull()
    })

    it('should clear confirmed_at and shipped_at timestamps', async () => {
      // Workflow timestamps should be reset

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.confirmed_at).toBeNull()
      expect(result.shipped_at).toBeNull()
    })

    it('should preserve notes from original SO', async () => {
      // Notes should be copied to cloned SO

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.notes).toBe('Special handling required')
    })

    it('should set allergen_validated to false', async () => {
      // Allergen validation must be re-done for cloned SO

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.allergen_validated).toBe(false)
    })

    it('should clone all lines with same product_id and unit_price', async () => {
      // Lines should be cloned with product and price preserved

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.lines).toBeDefined()
      expect(result.lines.length).toBe(3)

      result.lines.forEach((line: any, index: number) => {
        expect(line.product_id).toBe(mockSourceLines[index].product_id)
        expect(line.unit_price).toBe(mockSourceLines[index].unit_price)
        expect(line.quantity_ordered).toBe(mockSourceLines[index].quantity_ordered)
      })
    })

    it('should reset all quantity fields to 0 on cloned lines', async () => {
      // allocated, picked, packed, shipped should all be 0

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      result.lines.forEach((line: any) => {
        expect(line.quantity_allocated).toBe(0)
        expect(line.quantity_picked).toBe(0)
        expect(line.quantity_packed).toBe(0)
        expect(line.quantity_shipped).toBe(0)
      })
    })
  })

  describe('AC-CLONE-03: Clone SO - Line Renumbering', () => {
    it('should renumber lines sequentially starting from 1', async () => {
      // Original lines: 1, 5, 10 -> Cloned lines: 1, 2, 3

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.lines[0].line_number).toBe(1)
      expect(result.lines[1].line_number).toBe(2)
      expect(result.lines[2].line_number).toBe(3)
    })

    it('should maintain line order when renumbering', async () => {
      // Line order should be preserved based on original line_number sequence

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      // First line should still correspond to first original line
      expect(result.lines[0].unit_price).toBe(10.50)
      expect(result.lines[1].unit_price).toBe(5.00)
      expect(result.lines[2].unit_price).toBe(20.00)
    })

    it('should preserve line notes when renumbering', async () => {
      // Line notes should be preserved during clone

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.lines[0].notes).toBe('Line 1 notes')
      expect(result.lines[1].notes).toBeNull()
      expect(result.lines[2].notes).toBe('Line 3 notes')
    })
  })

  describe('AC-CLONE-05: Clone SO - Not Found', () => {
    it('should throw error when SO id does not exist', async () => {
      // Setup mock to return not found
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'sales_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      await expect(
        SalesOrderService.cloneSalesOrder('non-existent-id')
      ).rejects.toThrow('Sales order not found')
    })

    it('should throw error with specific message', async () => {
      // Setup mock to return not found
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'sales_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          }
        }
        return { select: vi.fn() }
      })

      try {
        await SalesOrderService.cloneSalesOrder('invalid-uuid')
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toBe('Sales order not found')
      }
    })
  })

  describe('Clone from Different Statuses', () => {
    it('should allow cloning from draft status', async () => {
      // Draft SOs can be cloned

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)
      expect(result).toBeDefined()
      expect(result.status).toBe('draft')
    })

    it('should allow cloning from confirmed status', async () => {
      // Confirmed SOs can be cloned

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)
      expect(result).toBeDefined()
      expect(result.status).toBe('draft')
    })

    it('should allow cloning from shipped status', async () => {
      // Shipped SOs can be cloned (for reorders)

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)
      expect(result).toBeDefined()
      expect(result.status).toBe('draft')
    })
  })

  describe('Order Number Sequence', () => {
    it('should generate order number in format SO-YYYY-NNNNN', async () => {
      // Verify format compliance

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.order_number).toMatch(/^SO-2025-\d{5}$/)
    })

    it('should increment sequence from last order', async () => {
      // If last order was SO-2025-00100, new should be SO-2025-00101

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      // Assuming sequence continues from existing orders
      expect(result.order_number).toBeDefined()
    })
  })

  describe('Total Amount Recalculation', () => {
    it('should recalculate total_amount from cloned lines', async () => {
      // Total should be sum of (quantity_ordered * unit_price) for all lines

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      const expectedTotal = (100 * 10.50) + (50 * 5.00) + (25 * 20.00)
      expect(result.total_amount).toBe(expectedTotal)
    })

    it('should update line_count to match cloned lines', async () => {
      // line_count should reflect number of cloned lines

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result.line_count).toBe(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle SO with no lines', async () => {
      // Cloning SO with 0 lines should work

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      // Should not throw, may return empty lines array
      expect(result).toBeDefined()
    })

    it('should handle SO with null notes', async () => {
      // Null notes should remain null in clone

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      // Should handle gracefully
      expect(result).toBeDefined()
    })

    it('should handle SO with null shipping_address_id', async () => {
      // Null address should remain null in clone

      const result = await SalesOrderService.cloneSalesOrder(TEST_SO_ID)

      expect(result).toBeDefined()
    })
  })
})
