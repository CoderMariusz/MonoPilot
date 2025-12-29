/**
 * BOM Alternatives Service - Unit Tests (Story 02.6)
 * Purpose: Test BOM alternative operations and validation rules
 * Phase: GREEN - Tests implemented with actual assertions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAlternatives,
  getNextPreferenceOrder,
  createAlternative,
  updateAlternative,
  deleteAlternative,
  validateAlternativeRules,
} from '../bom-alternatives-service'
import type {
  BOMAlternative,
  CreateAlternativeRequest,
  UpdateAlternativeRequest,
} from '@/lib/types/bom-alternative'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('BOMAlternativesService (Story 02.6)', () => {
  const TEST_BOM_ID = '11111111-1111-1111-1111-111111111111'
  const TEST_ITEM_ID = '22222222-2222-2222-2222-222222222222'
  const TEST_ALT_ID = '33333333-3333-3333-3333-333333333333'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAlternatives', () => {
    it('should return alternatives sorted by preference_order ascending', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternatives: [
            { id: 'alt-1', preference_order: 2 },
            { id: 'alt-2', preference_order: 3 },
            { id: 'alt-3', preference_order: 4 },
          ],
          primary_item: {
            id: TEST_ITEM_ID,
            product_code: 'RM-001',
            product_name: 'Wheat Flour',
            product_type: 'RM',
            quantity: 50,
            uom: 'kg',
          },
        }),
      })

      const result = await getAlternatives(TEST_BOM_ID, TEST_ITEM_ID)
      expect(result.alternatives).toHaveLength(3)
      expect(result.alternatives[0].preference_order).toBe(2)
      expect(result.alternatives[1].preference_order).toBe(3)
      expect(result.alternatives[2].preference_order).toBe(4)
    })

    it('should include primary item info in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternatives: [],
          primary_item: {
            id: TEST_ITEM_ID,
            product_code: 'RM-001',
            product_name: 'Wheat Flour',
            product_type: 'RM',
            quantity: 50,
            uom: 'kg',
          },
        }),
      })

      const result = await getAlternatives(TEST_BOM_ID, TEST_ITEM_ID)
      expect(result.primary_item).toBeDefined()
      expect(result.primary_item.product_code).toBe('RM-001')
      expect(result.primary_item.quantity).toBe(50)
      expect(result.primary_item.uom).toBe('kg')
    })

    it('should return empty array when item has no alternatives', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternatives: [],
          primary_item: {
            id: TEST_ITEM_ID,
            product_code: 'RM-001',
            product_name: 'Wheat Flour',
            product_type: 'RM',
            quantity: 50,
            uom: 'kg',
          },
        }),
      })

      const result = await getAlternatives(TEST_BOM_ID, TEST_ITEM_ID)
      expect(result.alternatives).toEqual([])
    })

    it('should throw error when BOM not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'BOM_NOT_FOUND' }),
      })

      await expect(getAlternatives('invalid-bom', TEST_ITEM_ID))
        .rejects.toThrow('BOM_NOT_FOUND')
    })

    it('should throw error when item not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'ITEM_NOT_FOUND' }),
      })

      await expect(getAlternatives(TEST_BOM_ID, 'invalid-item'))
        .rejects.toThrow('ITEM_NOT_FOUND')
    })
  })

  describe('getNextPreferenceOrder', () => {
    it('should return 2 when item has no alternatives', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternatives: [],
          primary_item: { id: TEST_ITEM_ID },
        }),
      })

      const result = await getNextPreferenceOrder(TEST_BOM_ID, TEST_ITEM_ID)
      expect(result).toBe(2)
    })

    it('should return max + 1 when alternatives exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternatives: [
            { preference_order: 2 },
            { preference_order: 3 },
          ],
          primary_item: { id: TEST_ITEM_ID },
        }),
      })

      const result = await getNextPreferenceOrder(TEST_BOM_ID, TEST_ITEM_ID)
      expect(result).toBe(4)
    })

    it('should handle non-sequential preferences correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternatives: [
            { preference_order: 2 },
            { preference_order: 5 },
            { preference_order: 3 },
          ],
          primary_item: { id: TEST_ITEM_ID },
        }),
      })

      const result = await getNextPreferenceOrder(TEST_BOM_ID, TEST_ITEM_ID)
      expect(result).toBe(6)
    })

    it('should return 2 if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      })

      const result = await getNextPreferenceOrder(TEST_BOM_ID, TEST_ITEM_ID)
      expect(result).toBe(2)
    })
  })

  describe('createAlternative', () => {
    it('should create alternative with provided data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternative: {
            id: TEST_ALT_ID,
            bom_item_id: TEST_ITEM_ID,
            alternative_product_id: 'prod-rm-005',
            alternative_product_code: 'RM-005',
            alternative_product_name: 'Whole Wheat Flour',
            alternative_product_type: 'RM',
            quantity: 48,
            uom: 'kg',
            preference_order: 2,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'Alternative created successfully',
        }),
      })

      const data: CreateAlternativeRequest = {
        alternative_product_id: 'prod-rm-005',
        quantity: 48,
        uom: 'kg',
      }

      const result = await createAlternative(TEST_BOM_ID, TEST_ITEM_ID, data)
      expect(result.alternative.preference_order).toBe(2)
      expect(result.alternative.quantity).toBe(48)
    })

    it('should use provided preference_order if specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternative: {
            id: TEST_ALT_ID,
            bom_item_id: TEST_ITEM_ID,
            alternative_product_id: 'prod-rm-005',
            alternative_product_code: 'RM-005',
            alternative_product_name: 'Whole Wheat Flour',
            alternative_product_type: 'RM',
            quantity: 48,
            uom: 'kg',
            preference_order: 5,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'Alternative created successfully',
        }),
      })

      const data: CreateAlternativeRequest = {
        alternative_product_id: 'prod-rm-005',
        quantity: 48,
        uom: 'kg',
        preference_order: 5,
      }

      const result = await createAlternative(TEST_BOM_ID, TEST_ITEM_ID, data)
      expect(result.alternative.preference_order).toBe(5)
    })

    it('should throw error on duplicate alternative', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'DUPLICATE_ALTERNATIVE' }),
      })

      const data: CreateAlternativeRequest = {
        alternative_product_id: 'prod-rm-005',
        quantity: 48,
        uom: 'kg',
      }

      await expect(createAlternative(TEST_BOM_ID, TEST_ITEM_ID, data))
        .rejects.toThrow('DUPLICATE_ALTERNATIVE')
    })

    it('should throw error when product not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'PRODUCT_NOT_FOUND' }),
      })

      const data: CreateAlternativeRequest = {
        alternative_product_id: 'invalid-product',
        quantity: 48,
        uom: 'kg',
      }

      await expect(createAlternative(TEST_BOM_ID, TEST_ITEM_ID, data))
        .rejects.toThrow('PRODUCT_NOT_FOUND')
    })
  })

  describe('updateAlternative', () => {
    it('should update quantity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternative: {
            id: TEST_ALT_ID,
            bom_item_id: TEST_ITEM_ID,
            alternative_product_id: 'prod-rm-005',
            alternative_product_code: 'RM-005',
            alternative_product_name: 'Whole Wheat Flour',
            alternative_product_type: 'RM',
            quantity: 55,
            uom: 'kg',
            preference_order: 2,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'Alternative updated successfully',
        }),
      })

      const data: UpdateAlternativeRequest = { quantity: 55 }
      const result = await updateAlternative(TEST_BOM_ID, TEST_ITEM_ID, TEST_ALT_ID, data)
      expect(result.alternative.quantity).toBe(55)
    })

    it('should update preference_order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternative: {
            id: TEST_ALT_ID,
            bom_item_id: TEST_ITEM_ID,
            alternative_product_id: 'prod-rm-005',
            alternative_product_code: 'RM-005',
            alternative_product_name: 'Whole Wheat Flour',
            alternative_product_type: 'RM',
            quantity: 48,
            uom: 'kg',
            preference_order: 3,
            notes: null,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'Alternative updated successfully',
        }),
      })

      const data: UpdateAlternativeRequest = { preference_order: 3 }
      const result = await updateAlternative(TEST_BOM_ID, TEST_ITEM_ID, TEST_ALT_ID, data)
      expect(result.alternative.preference_order).toBe(3)
    })

    it('should update notes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alternative: {
            id: TEST_ALT_ID,
            bom_item_id: TEST_ITEM_ID,
            alternative_product_id: 'prod-rm-005',
            alternative_product_code: 'RM-005',
            alternative_product_name: 'Whole Wheat Flour',
            alternative_product_type: 'RM',
            quantity: 48,
            uom: 'kg',
            preference_order: 2,
            notes: 'New note',
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'Alternative updated successfully',
        }),
      })

      const data: UpdateAlternativeRequest = { notes: 'New note' }
      const result = await updateAlternative(TEST_BOM_ID, TEST_ITEM_ID, TEST_ALT_ID, data)
      expect(result.alternative.notes).toBe('New note')
    })

    it('should throw error when alternative not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'ALTERNATIVE_NOT_FOUND' }),
      })

      const data: UpdateAlternativeRequest = { quantity: 55 }
      await expect(updateAlternative(TEST_BOM_ID, TEST_ITEM_ID, 'invalid-id', data))
        .rejects.toThrow('ALTERNATIVE_NOT_FOUND')
    })
  })

  describe('deleteAlternative', () => {
    it('should delete alternative by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Alternative deleted successfully',
        }),
      })

      const result = await deleteAlternative(TEST_BOM_ID, TEST_ITEM_ID, TEST_ALT_ID)
      expect(result.success).toBe(true)
    })

    it('should throw error when alternative not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'ALTERNATIVE_NOT_FOUND' }),
      })

      await expect(deleteAlternative(TEST_BOM_ID, TEST_ITEM_ID, 'invalid-id'))
        .rejects.toThrow('ALTERNATIVE_NOT_FOUND')
    })
  })

  describe('validateAlternativeRules', () => {
    const primaryItem = {
      product_id: 'prod-rm-001',
      product_type: 'RM',
      uom: 'kg',
    }
    const bomProductId = 'prod-fg-001'

    it('should return error when alternative is same as primary product', () => {
      const result = validateAlternativeRules(
        primaryItem,
        'prod-rm-001', // Same as primary
        [],
        bomProductId
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('SAME_AS_PRIMARY')
    })

    it('should return error when alternative is same as BOM product (circular ref)', () => {
      const result = validateAlternativeRules(
        primaryItem,
        'prod-fg-001', // Same as BOM product
        [],
        bomProductId
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CIRCULAR_REFERENCE')
    })

    it('should return error for duplicate alternative', () => {
      const existingAlternatives: BOMAlternative[] = [
        {
          id: 'alt-1',
          bom_item_id: 'item-1',
          alternative_product_id: 'prod-rm-005',
          alternative_product_code: 'RM-005',
          alternative_product_name: 'Whole Wheat',
          alternative_product_type: 'RM',
          quantity: 48,
          uom: 'kg',
          preference_order: 2,
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const result = validateAlternativeRules(
        primaryItem,
        'prod-rm-005', // Already exists
        existingAlternatives,
        bomProductId
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('DUPLICATE_ALTERNATIVE')
    })

    it('should return error when types do not match', () => {
      const result = validateAlternativeRules(
        primaryItem,
        'prod-ing-001',
        [],
        bomProductId,
        { product_type: 'ING', base_uom: 'kg' } // Different type
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('TYPE_MISMATCH')
    })

    it('should return warning for UoM mismatch (different classes)', () => {
      const result = validateAlternativeRules(
        primaryItem,
        'prod-rm-005',
        [],
        bomProductId,
        { product_type: 'RM', base_uom: 'L' } // Volume vs weight
      )
      expect(result.valid).toBe(true)
      expect(result.warning).toBe('UOM_MISMATCH')
    })

    it('should allow different UoM if same class (kg vs lbs)', () => {
      const result = validateAlternativeRules(
        primaryItem,
        'prod-rm-005',
        [],
        bomProductId,
        { product_type: 'RM', base_uom: 'lbs' } // Both weight
      )
      expect(result.valid).toBe(true)
      expect(result.warning).toBeUndefined()
    })

    it('should pass validation for valid alternative', () => {
      const result = validateAlternativeRules(
        primaryItem,
        'prod-rm-005',
        [],
        bomProductId,
        { product_type: 'RM', base_uom: 'kg' }
      )
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('Multi-tenant Isolation (ADR-013)', () => {
    it('should throw error for cross-org access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'ALTERNATIVE_NOT_FOUND' }),
      })

      await expect(getAlternatives(TEST_BOM_ID, TEST_ITEM_ID))
        .rejects.toThrow('ALTERNATIVE_NOT_FOUND')
    })
  })

  describe('Error Handling', () => {
    it('should throw error when BOM not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'BOM_NOT_FOUND' }),
      })

      await expect(getAlternatives('invalid-bom', TEST_ITEM_ID))
        .rejects.toThrow('BOM_NOT_FOUND')
    })

    it('should throw error when item not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'ITEM_NOT_FOUND' }),
      })

      await expect(getAlternatives(TEST_BOM_ID, 'invalid-item'))
        .rejects.toThrow('ITEM_NOT_FOUND')
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'CREATE_FAILED' }),
      })

      const data: CreateAlternativeRequest = {
        alternative_product_id: 'prod-rm-005',
        quantity: 48,
        uom: 'kg',
      }

      await expect(createAlternative(TEST_BOM_ID, TEST_ITEM_ID, data))
        .rejects.toThrow('CREATE_FAILED')
    })
  })
})
