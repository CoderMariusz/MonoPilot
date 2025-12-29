/**
 * BOM Clone Service - Unit Tests (Story 02.6)
 * Purpose: Test BOM clone operations and version management
 * Phase: GREEN - Tests implemented with actual assertions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getNextVersion,
  validateCloneTarget,
  cloneBOM,
} from '../bom-clone-service'
import type { CloneBOMRequest, CloneBOMResponse } from '@/lib/types/bom-clone'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('BOMCloneService (Story 02.6)', () => {
  const TEST_PRODUCT_ID = '33333333-3333-3333-3333-333333333333'
  const TEST_BOM_ID = '11111111-1111-1111-1111-111111111111'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getNextVersion', () => {
    it('should return version 3 when product has BOMs v1 and v2', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          boms: [{ version: 2 }, { version: 1 }],
        }),
      })

      const result = await getNextVersion(TEST_PRODUCT_ID)
      expect(result).toBe(3)
    })

    it('should return 1 when product has no existing BOMs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ boms: [] }),
      })

      const result = await getNextVersion(TEST_PRODUCT_ID)
      expect(result).toBe(1)
    })

    it('should handle non-sequential versions (v1, v5) and return next available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          boms: [{ version: 5 }, { version: 1 }],
        }),
      })

      const result = await getNextVersion(TEST_PRODUCT_ID)
      expect(result).toBe(6)
    })

    it('should return 1 when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      })

      const result = await getNextVersion(TEST_PRODUCT_ID)
      expect(result).toBe(1)
    })
  })

  describe('validateCloneTarget', () => {
    it('should return valid: true when no date overlap exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          boms: [
            { effective_from: '2024-01-01', effective_to: '2024-06-30' },
          ],
        }),
      })

      const result = await validateCloneTarget(TEST_PRODUCT_ID, '2024-07-01', '2024-12-31')
      expect(result.valid).toBe(true)
    })

    it('should return error when effective_from overlaps with existing BOM', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          boms: [
            { effective_from: '2024-01-01', effective_to: '2024-12-31' },
          ],
        }),
      })

      const result = await validateCloneTarget(TEST_PRODUCT_ID, '2024-06-01', '2024-08-31')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('DATE_OVERLAP')
    })

    it('should return error when effective_to overlaps with existing BOM', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          boms: [
            { effective_from: '2024-06-01', effective_to: '2024-12-31' },
          ],
        }),
      })

      const result = await validateCloneTarget(TEST_PRODUCT_ID, '2024-01-01', '2024-07-15')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('DATE_OVERLAP')
    })

    it('should return valid when new BOM dates touch but do not overlap', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          boms: [
            { effective_from: '2024-01-01', effective_to: '2024-06-30' },
          ],
        }),
      })

      const result = await validateCloneTarget(TEST_PRODUCT_ID, '2024-07-01', '2024-12-31')
      expect(result.valid).toBe(true)
    })

    it('should handle null effective_to dates correctly (open-ended overlaps)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          boms: [
            { effective_from: '2024-01-01', effective_to: null },
          ],
        }),
      })

      const result = await validateCloneTarget(TEST_PRODUCT_ID, '2024-06-01', null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('DATE_OVERLAP')
    })

    it('should return valid when no BOMs exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ boms: [] }),
      })

      const result = await validateCloneTarget(TEST_PRODUCT_ID, '2024-01-01', '2024-12-31')
      expect(result.valid).toBe(true)
    })
  })

  describe('cloneBOM', () => {
    it('should call clone API with correct parameters', async () => {
      const mockResponse: CloneBOMResponse = {
        bom: {
          id: 'new-bom-id',
          product_id: TEST_PRODUCT_ID,
          product_code: 'FG-001',
          product_name: 'Honey Bread',
          version: 3,
          status: 'draft',
          effective_from: '2024-01-01',
          effective_to: null,
          routing_id: 'routing-123',
          items_count: 4,
          created_at: '2024-01-01T00:00:00Z',
        },
        message: 'BOM cloned successfully',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request: CloneBOMRequest = {
        target_product_id: TEST_PRODUCT_ID,
        effective_from: '2024-01-01',
      }

      const result = await cloneBOM(TEST_BOM_ID, request)

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/v1/technical/boms/${TEST_BOM_ID}/clone`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      )
      expect(result.bom.version).toBe(3)
      expect(result.bom.status).toBe('draft')
    })

    it('should throw error when source BOM not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'BOM_NOT_FOUND' }),
      })

      const request: CloneBOMRequest = {
        target_product_id: TEST_PRODUCT_ID,
      }

      await expect(cloneBOM('invalid-id', request)).rejects.toThrow('BOM_NOT_FOUND')
    })

    it('should throw error when target product not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'PRODUCT_NOT_FOUND' }),
      })

      const request: CloneBOMRequest = {
        target_product_id: 'invalid-product-id',
      }

      await expect(cloneBOM(TEST_BOM_ID, request)).rejects.toThrow('PRODUCT_NOT_FOUND')
    })

    it('should throw error on date overlap', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'DATE_OVERLAP' }),
      })

      const request: CloneBOMRequest = {
        target_product_id: TEST_PRODUCT_ID,
        effective_from: '2024-06-01',
      }

      await expect(cloneBOM(TEST_BOM_ID, request)).rejects.toThrow('DATE_OVERLAP')
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'CLONE_FAILED' }),
      })

      const request: CloneBOMRequest = {
        target_product_id: TEST_PRODUCT_ID,
      }

      await expect(cloneBOM(TEST_BOM_ID, request)).rejects.toThrow('CLONE_FAILED')
    })

    it('should include notes in request if provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bom: {
            id: 'new-bom-id',
            product_id: TEST_PRODUCT_ID,
            product_code: 'FG-001',
            product_name: 'Honey Bread',
            version: 1,
            status: 'draft',
            effective_from: '2024-01-01',
            effective_to: null,
            routing_id: null,
            items_count: 0,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'BOM cloned successfully',
        }),
      })

      const request: CloneBOMRequest = {
        target_product_id: TEST_PRODUCT_ID,
        notes: 'Custom clone notes',
      }

      await cloneBOM(TEST_BOM_ID, request)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Custom clone notes'),
        })
      )
    })
  })

  describe('cloneBOM - Same Product', () => {
    it('should set cloned BOM status to draft regardless of source status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bom: {
            id: 'new-bom-id',
            product_id: TEST_PRODUCT_ID,
            product_code: 'FG-001',
            product_name: 'Honey Bread',
            version: 3,
            status: 'draft', // Always draft
            effective_from: '2024-01-01',
            effective_to: null,
            routing_id: 'routing-123',
            items_count: 4,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'BOM cloned successfully',
        }),
      })

      const result = await cloneBOM(TEST_BOM_ID, { target_product_id: TEST_PRODUCT_ID })
      expect(result.bom.status).toBe('draft')
    })

    it('should preserve routing_id from source BOM', async () => {
      const routingId = '55555555-5555-5555-5555-555555555555'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bom: {
            id: 'new-bom-id',
            product_id: TEST_PRODUCT_ID,
            product_code: 'FG-001',
            product_name: 'Honey Bread',
            version: 3,
            status: 'draft',
            effective_from: '2024-01-01',
            effective_to: null,
            routing_id: routingId,
            items_count: 4,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'BOM cloned successfully',
        }),
      })

      const result = await cloneBOM(TEST_BOM_ID, { target_product_id: TEST_PRODUCT_ID })
      expect(result.bom.routing_id).toBe(routingId)
    })
  })

  describe('cloneBOM - Different Product', () => {
    it('should create BOM v1 when cloning to product with no existing BOMs', async () => {
      const differentProductId = '44444444-4444-4444-4444-444444444444'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bom: {
            id: 'new-bom-id',
            product_id: differentProductId,
            product_code: 'FG-002',
            product_name: 'Whole Wheat Bread',
            version: 1, // First version for this product
            status: 'draft',
            effective_from: '2024-01-01',
            effective_to: null,
            routing_id: 'routing-123',
            items_count: 4,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'BOM cloned successfully',
        }),
      })

      const result = await cloneBOM(TEST_BOM_ID, { target_product_id: differentProductId })
      expect(result.bom.version).toBe(1)
      expect(result.bom.product_id).toBe(differentProductId)
    })

    it('should change product_id in cloned BOM', async () => {
      const differentProductId = '44444444-4444-4444-4444-444444444444'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bom: {
            id: 'new-bom-id',
            product_id: differentProductId,
            product_code: 'FG-002',
            product_name: 'Whole Wheat Bread',
            version: 1,
            status: 'draft',
            effective_from: '2024-01-01',
            effective_to: null,
            routing_id: null,
            items_count: 4,
            created_at: '2024-01-01T00:00:00Z',
          },
          message: 'BOM cloned successfully',
        }),
      })

      const result = await cloneBOM(TEST_BOM_ID, { target_product_id: differentProductId })
      expect(result.bom.product_id).toBe(differentProductId)
      expect(result.bom.product_code).toBe('FG-002')
    })
  })

  describe('Multi-tenant Isolation (ADR-013)', () => {
    it('should fail to clone BOM from different organization (404 pattern)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'BOM_NOT_FOUND' }),
      })

      const request: CloneBOMRequest = {
        target_product_id: TEST_PRODUCT_ID,
      }

      await expect(cloneBOM('org-b-bom-id', request)).rejects.toThrow('BOM_NOT_FOUND')
    })
  })
})
