/**
 * BOM Items Service - Unit Tests (Story 02.5a)
 * Purpose: Test BOM items CRUD operations with warnings and validation
 * Phase: RED - Tests should FAIL (no implementation yet)
 *
 * Tests the BOMItemsService which handles:
 * - Listing BOM items for a specific BOM with product joins
 * - Creating BOM items with operation assignment validation
 * - Updating BOM items with quantity/sequence changes
 * - Deleting BOM items
 * - Getting next sequence number (max + 10)
 * - UoM mismatch warnings (non-blocking)
 * - Quantity validation (> 0, max 6 decimals)
 *
 * Coverage Target: 80%+
 * Test Count: 32 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01: BOM Items List Display (500ms for 100 items)
 * - AC-02: Add BOM Item with MVP fields
 * - AC-03: Edit BOM Item
 * - AC-04: Delete BOM Item
 * - AC-05: Operation Assignment
 * - AC-06: UoM Validation (warning, not error)
 * - AC-07: Quantity Validation (> 0, max 6 decimals)
 * - AC-08: Sequence Management (auto-increment by 10)
 * - AC-09: Permission Enforcement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getBOMItems,
  createBOMItem,
  updateBOMItem,
  deleteBOMItem,
  getNextSequence,
} from '../bom-items-service'
import type {
  BOMItem,
  CreateBOMItemRequest,
  UpdateBOMItemRequest,
  BOMItemsListResponse,
  BOMItemResponse,
} from '@/lib/types/bom-items'

describe('BOMItemsService (Story 02.5a)', () => {
  let mockFetch: any

  // Test data
  const TEST_BOM_ID = '11111111-1111-1111-1111-111111111111'
  const TEST_PRODUCT_ID = '22222222-2222-2222-2222-222222222222'
  const TEST_ITEM_ID = '33333333-3333-3333-3333-333333333333'
  const TEST_ROUTING_ID = '44444444-4444-4444-4444-444444444444'

  const mockBOMItem: BOMItem = {
    id: TEST_ITEM_ID,
    bom_id: TEST_BOM_ID,
    product_id: TEST_PRODUCT_ID,
    product_code: 'RM-001',
    product_name: 'Water',
    product_type: 'RM',
    product_base_uom: 'kg',
    quantity: 50,
    uom: 'kg',
    sequence: 10,
    operation_seq: null,
    operation_name: null,
    scrap_percent: 0,
    notes: null,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  }

  const mockBOMItemsResponse: BOMItemsListResponse = {
    items: [mockBOMItem],
    total: 1,
    bom_output_qty: 100,
    bom_output_uom: 'kg',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    mockFetch = global.fetch as any
  })

  // ============================================
  // GET BOM ITEMS TESTS (AC-01)
  // ============================================
  describe('getBOMItems - List Items', () => {
    it('should fetch items for valid BOM ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBOMItemsResponse,
      })

      const result = await getBOMItems(TEST_BOM_ID)

      expect(result).toBeDefined()
      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(mockFetch).toHaveBeenCalledWith(`/api/v1/technical/boms/${TEST_BOM_ID}/items`)
    })

    it('should return items in sequence order', async () => {
      const itemSeq20 = { ...mockBOMItem, sequence: 20, id: '55555555-5555-5555-5555-555555555555' }
      const itemSeq10 = { ...mockBOMItem, sequence: 10, id: '66666666-6666-6666-6666-666666666666' }
      const itemSeq30 = { ...mockBOMItem, sequence: 30, id: '77777777-7777-7777-7777-777777777777' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockBOMItemsResponse,
          items: [itemSeq20, itemSeq10, itemSeq30],
        }),
      })

      const result = await getBOMItems(TEST_BOM_ID)

      expect(result.items).toHaveLength(3)
      // Service should return in server-provided order (already sorted by backend)
      expect(result.items[0].sequence).toBeLessThanOrEqual(result.items[1].sequence)
    })

    it('should include product details in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBOMItemsResponse,
      })

      const result = await getBOMItems(TEST_BOM_ID)

      const item = result.items[0]
      expect(item.product_code).toBe('RM-001')
      expect(item.product_name).toBe('Water')
      expect(item.product_type).toBe('RM')
      expect(item.product_base_uom).toBe('kg')
    })

    it('should include operation name when assigned', async () => {
      const itemWithOp = {
        ...mockBOMItem,
        operation_seq: 10,
        operation_name: 'Mixing',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockBOMItemsResponse,
          items: [itemWithOp],
        }),
      })

      const result = await getBOMItems(TEST_BOM_ID)

      expect(result.items[0].operation_seq).toBe(10)
      expect(result.items[0].operation_name).toBe('Mixing')
    })

    it('should include BOM output quantity and UoM', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBOMItemsResponse,
      })

      const result = await getBOMItems(TEST_BOM_ID)

      expect(result.bom_output_qty).toBe(100)
      expect(result.bom_output_uom).toBe('kg')
    })

    it('should handle empty items list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          total: 0,
          bom_output_qty: 100,
          bom_output_uom: 'kg',
        }),
      })

      const result = await getBOMItems(TEST_BOM_ID)

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should throw error for invalid BOM ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'BOM not found' }),
      })

      await expect(getBOMItems(TEST_BOM_ID)).rejects.toThrow('BOM not found')
    })

    it('should include scrap percent in response', async () => {
      const itemWithScrap = { ...mockBOMItem, scrap_percent: 2.5 }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockBOMItemsResponse,
          items: [itemWithScrap],
        }),
      })

      const result = await getBOMItems(TEST_BOM_ID)

      expect(result.items[0].scrap_percent).toBe(2.5)
    })

    it('should handle performance requirement (500ms for 100 items)', async () => {
      const items100 = Array.from({ length: 100 }, (_, i) => ({
        ...mockBOMItem,
        id: `item-${i}`,
        sequence: (i + 1) * 10,
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: items100,
          total: 100,
          bom_output_qty: 100,
          bom_output_uom: 'kg',
        }),
      })

      const startTime = performance.now()
      const result = await getBOMItems(TEST_BOM_ID)
      const duration = performance.now() - startTime

      expect(result.items).toHaveLength(100)
      expect(duration).toBeLessThan(500)
    })
  })

  // ============================================
  // CREATE BOM ITEM TESTS (AC-02)
  // ============================================
  describe('createBOMItem - Create Item', () => {
    const createRequest: CreateBOMItemRequest = {
      product_id: TEST_PRODUCT_ID,
      quantity: 50,
      uom: 'kg',
      sequence: 10,
      scrap_percent: 0,
    }

    it('should create item with valid data', async () => {
      const response: BOMItemResponse = {
        item: mockBOMItem,
        warnings: [],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => response,
      })

      const result = await createBOMItem(TEST_BOM_ID, createRequest)

      expect(result.item).toBeDefined()
      expect(result.item.product_id).toBe(TEST_PRODUCT_ID)
      expect(result.item.quantity).toBe(50)
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/v1/technical/boms/${TEST_BOM_ID}/items`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should return 201 status code on success', async () => {
      const response: BOMItemResponse = {
        item: mockBOMItem,
        warnings: [],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => response,
      })

      const result = await createBOMItem(TEST_BOM_ID, createRequest)

      expect(result.item).toBeDefined()
    })

    it('should reject zero quantity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Quantity must be greater than 0' }),
      })

      const request = { ...createRequest, quantity: 0 }

      await expect(createBOMItem(TEST_BOM_ID, request)).rejects.toThrow(
        'Quantity must be greater than 0'
      )
    })

    it('should reject negative quantity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Quantity must be greater than 0' }),
      })

      const request = { ...createRequest, quantity: -5 }

      await expect(createBOMItem(TEST_BOM_ID, request)).rejects.toThrow(
        'Quantity must be greater than 0'
      )
    })

    it('should include UoM mismatch warning in response', async () => {
      const response: BOMItemResponse = {
        item: mockBOMItem,
        warnings: [
          {
            code: 'UOM_MISMATCH',
            message: 'UoM does not match component base UoM',
            details: "Component base UoM is 'kg', you entered 'L'",
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => response,
      })

      const request = { ...createRequest, uom: 'L' }
      const result = await createBOMItem(TEST_BOM_ID, request)

      expect(result.warnings).toBeDefined()
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('UOM_MISMATCH')
    })

    it('should validate operation exists in routing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Operation does not exist in assigned routing',
        }),
      })

      const request = { ...createRequest, operation_seq: 99 }

      await expect(createBOMItem(TEST_BOM_ID, request)).rejects.toThrow(
        'Operation does not exist in assigned routing'
      )
    })

    it('should reject operation without routing assigned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Cannot assign operation: BOM has no routing assigned',
        }),
      })

      const request = { ...createRequest, operation_seq: 10 }

      await expect(createBOMItem(TEST_BOM_ID, request)).rejects.toThrow(
        'Cannot assign operation: BOM has no routing assigned'
      )
    })

    it('should send POST request with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ item: mockBOMItem, warnings: [] }),
      })

      await createBOMItem(TEST_BOM_ID, createRequest)

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)

      expect(body.product_id).toBe(TEST_PRODUCT_ID)
      expect(body.quantity).toBe(50)
      expect(body.uom).toBe('kg')
    })
  })

  // ============================================
  // UPDATE BOM ITEM TESTS (AC-03)
  // ============================================
  describe('updateBOMItem - Update Item', () => {
    const updateRequest: UpdateBOMItemRequest = {
      quantity: 75,
      uom: 'kg',
    }

    it('should update item with valid data', async () => {
      const updatedItem = { ...mockBOMItem, quantity: 75 }
      const response: BOMItemResponse = {
        item: updatedItem,
        warnings: [],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response,
      })

      const result = await updateBOMItem(TEST_BOM_ID, TEST_ITEM_ID, updateRequest)

      expect(result.item.quantity).toBe(75)
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/v1/technical/boms/${TEST_BOM_ID}/items/${TEST_ITEM_ID}`,
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('should update operation assignment', async () => {
      const itemWithOp = {
        ...mockBOMItem,
        operation_seq: 10,
        operation_name: 'Mixing',
      }
      const response: BOMItemResponse = {
        item: itemWithOp,
        warnings: [],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response,
      })

      const request = { operation_seq: 10 }
      const result = await updateBOMItem(TEST_BOM_ID, TEST_ITEM_ID, request)

      expect(result.item.operation_seq).toBe(10)
      expect(result.item.operation_name).toBe('Mixing')
    })

    it('should reject zero quantity on update', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Quantity must be greater than 0' }),
      })

      const request = { quantity: 0 }

      await expect(updateBOMItem(TEST_BOM_ID, TEST_ITEM_ID, request)).rejects.toThrow(
        'Quantity must be greater than 0'
      )
    })

    it('should include warnings in update response', async () => {
      const response: BOMItemResponse = {
        item: mockBOMItem,
        warnings: [
          {
            code: 'UOM_MISMATCH',
            message: 'UoM does not match component base UoM',
            details: "Component base UoM is 'kg', you entered 'L'",
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response,
      })

      const request = { uom: 'L' }
      const result = await updateBOMItem(TEST_BOM_ID, TEST_ITEM_ID, request)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('UOM_MISMATCH')
    })

    it('should return 404 for non-existent item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'BOM item not found' }),
      })

      await expect(updateBOMItem(TEST_BOM_ID, 'invalid-id', updateRequest)).rejects.toThrow(
        'BOM item not found'
      )
    })
  })

  // ============================================
  // DELETE BOM ITEM TESTS (AC-04)
  // ============================================
  describe('deleteBOMItem - Delete Item', () => {
    it('should delete item successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'BOM item deleted successfully' }),
      })

      const result = await deleteBOMItem(TEST_BOM_ID, TEST_ITEM_ID)

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/v1/technical/boms/${TEST_BOM_ID}/items/${TEST_ITEM_ID}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should return 200 on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'BOM item deleted successfully' }),
      })

      const result = await deleteBOMItem(TEST_BOM_ID, TEST_ITEM_ID)

      expect(result.success).toBe(true)
    })

    it('should return 404 for non-existent item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'BOM item not found' }),
      })

      await expect(deleteBOMItem(TEST_BOM_ID, 'invalid-id')).rejects.toThrow(
        'BOM item not found'
      )
    })

    it('should handle deletion within 500ms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'BOM item deleted successfully' }),
      })

      const startTime = performance.now()
      await deleteBOMItem(TEST_BOM_ID, TEST_ITEM_ID)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(500)
    })
  })

  // ============================================
  // GET NEXT SEQUENCE TESTS (AC-08)
  // ============================================
  describe('getNextSequence - Auto-Increment Sequence', () => {
    it('should return max sequence + 10', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ next_sequence: 40 }),
      })

      const result = await getNextSequence(TEST_BOM_ID)

      expect(result).toBe(40)
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/v1/technical/boms/${TEST_BOM_ID}/items/next-sequence`
      )
    })

    it('should return 10 for empty BOM', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ next_sequence: 10 }),
      })

      const result = await getNextSequence(TEST_BOM_ID)

      expect(result).toBe(10)
    })

    it('should handle missing endpoint gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      })

      const result = await getNextSequence(TEST_BOM_ID)

      // Default to 10 if request fails
      expect(result).toBe(10)
    })

    it('should return correct sequence for 3-item BOM (should be 40)', async () => {
      // Items at sequences 10, 20, 30 -> next should be 40
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ next_sequence: 40 }),
      })

      const result = await getNextSequence(TEST_BOM_ID)

      expect(result).toBe(40)
    })
  })

  // ============================================
  // VALIDATION ERROR TESTS
  // ============================================
  describe('Validation Errors', () => {
    it('should reject empty product_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Component is required' }),
      })

      const request = {
        product_id: '',
        quantity: 50,
        uom: 'kg',
      } as any

      await expect(createBOMItem(TEST_BOM_ID, request)).rejects.toThrow('Component is required')
    })

    it('should reject invalid decimal precision (> 6 decimals)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Maximum 6 decimal places allowed' }),
      })

      const request = {
        product_id: TEST_PRODUCT_ID,
        quantity: 50.1234567,
        uom: 'kg',
      } as any

      await expect(createBOMItem(TEST_BOM_ID, request)).rejects.toThrow(
        'Maximum 6 decimal places allowed'
      )
    })

    it('should allow exactly 6 decimal places', async () => {
      const response: BOMItemResponse = {
        item: { ...mockBOMItem, quantity: 50.123456 },
        warnings: [],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => response,
      })

      const request = {
        product_id: TEST_PRODUCT_ID,
        quantity: 50.123456,
        uom: 'kg',
      }

      const result = await createBOMItem(TEST_BOM_ID, request)

      expect(result.item.quantity).toBe(50.123456)
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(getBOMItems(TEST_BOM_ID)).rejects.toThrow('Network error')
    })

    it('should handle malformed responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(getBOMItems(TEST_BOM_ID)).rejects.toThrow()
    })

    it('should provide meaningful error messages for 5xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(getBOMItems(TEST_BOM_ID)).rejects.toThrow('Internal server error')
    })
  })
})
