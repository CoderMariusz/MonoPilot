/**
 * Allergen Service V2 Tests
 * Story: TD-209 - Products Column in Allergens Table
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the server supabase module
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}))

import { createServerSupabase } from '@/lib/supabase/server'
import {
  getProductCountForAllergen,
  getAllergenProductCounts,
  getAllergenProductCountsAsObject,
  fetchAllergenProductCounts,
  fetchProductCountForAllergen,
} from '../allergen-service-v2'

// Mock fetch for client-side functions
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AllergenServiceV2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProductCountForAllergen', () => {
    it('should return product count for valid allergen', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({ data: 5, error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const result = await getProductCountForAllergen('allergen-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(5)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_allergen_product_count', {
        p_allergen_id: 'allergen-123',
      })
    })

    it('should return unauthorized error when not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const result = await getProductCountForAllergen('allergen-123')

      expect(result.success).toBe(false)
      expect(result.code).toBe('UNAUTHORIZED')
    })

    it('should return database error on RPC failure', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const result = await getProductCountForAllergen('allergen-123')

      expect(result.success).toBe(false)
      expect(result.code).toBe('DATABASE_ERROR')
    })

    it('should return 0 for null data', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const result = await getProductCountForAllergen('allergen-123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(0)
    })
  })

  describe('getAllergenProductCounts', () => {
    it('should return map of all allergen counts', async () => {
      const mockData = [
        { allergen_id: 'a1', product_count: 3 },
        { allergen_id: 'a2', product_count: 0 },
        { allergen_id: 'a3', product_count: 10 },
      ]
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const result = await getAllergenProductCounts()

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Map)
      expect(result.data?.get('a1')).toBe(3)
      expect(result.data?.get('a2')).toBe(0)
      expect(result.data?.get('a3')).toBe(10)
    })

    it('should filter by allergenIds when provided', async () => {
      const mockData = [
        { allergen_id: 'a1', product_count: 3 },
        { allergen_id: 'a2', product_count: 0 },
        { allergen_id: 'a3', product_count: 10 },
      ]
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const result = await getAllergenProductCounts(['a1', 'a3'])

      expect(result.success).toBe(true)
      expect(result.data?.size).toBe(2)
      expect(result.data?.has('a1')).toBe(true)
      expect(result.data?.has('a2')).toBe(false)
      expect(result.data?.has('a3')).toBe(true)
    })

    it('should return unauthorized error when not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const result = await getAllergenProductCounts()

      expect(result.success).toBe(false)
      expect(result.code).toBe('UNAUTHORIZED')
    })
  })

  describe('getAllergenProductCountsAsObject', () => {
    it('should return object instead of Map', async () => {
      const mockData = [
        { allergen_id: 'a1', product_count: 3 },
        { allergen_id: 'a2', product_count: 7 },
      ]
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const result = await getAllergenProductCountsAsObject()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ a1: 3, a2: 7 })
    })
  })

  describe('fetchAllergenProductCounts (client-side)', () => {
    it('should fetch counts from API', async () => {
      const mockResponse = [
        { allergen_id: 'a1', product_count: 5 },
        { allergen_id: 'a2', product_count: 2 },
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await fetchAllergenProductCounts()

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/settings/allergens/counts')
    })

    it('should return empty array on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const result = await fetchAllergenProductCounts()

      expect(result).toEqual([])
    })

    it('should return empty array on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchAllergenProductCounts()

      expect(result).toEqual([])
    })
  })

  describe('fetchProductCountForAllergen (client-side)', () => {
    it('should fetch single allergen count from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ allergen_id: 'a1', product_count: 8 }),
      })

      const result = await fetchProductCountForAllergen('a1')

      expect(result).toBe(8)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/settings/allergens/a1/count')
    })

    it('should return 0 on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await fetchProductCountForAllergen('a1')

      expect(result).toBe(0)
    })

    it('should return 0 on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchProductCountForAllergen('a1')

      expect(result).toBe(0)
    })
  })
})
