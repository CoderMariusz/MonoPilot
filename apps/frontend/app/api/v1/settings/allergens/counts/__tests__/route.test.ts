/**
 * Allergen Counts API Route Tests
 * Story: TD-209 - Products Column in Allergens Table
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}))

import { createServerSupabase } from '@/lib/supabase/server'
import { GET, POST, PUT, DELETE } from '../route'

describe('Allergen Counts API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/settings/allergens/counts', () => {
    it('should return 401 when not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return allergen product counts', async () => {
      const mockCounts = [
        { allergen_id: 'a1', product_count: 5 },
        { allergen_id: 'a2', product_count: 0 },
        { allergen_id: 'a3', product_count: 12 },
      ]
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({ data: mockCounts, error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCounts)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_all_allergen_product_counts')
    })

    it('should return empty array when RPC returns null', async () => {
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

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return 500 on RPC error', async () => {
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

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch allergen counts')
    })
  })

  describe('POST /api/v1/settings/allergens/counts', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
      expect(response.headers.get('Allow')).toBe('GET')
    })
  })

  describe('PUT /api/v1/settings/allergens/counts', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await PUT()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
      expect(response.headers.get('Allow')).toBe('GET')
    })
  })

  describe('DELETE /api/v1/settings/allergens/counts', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
      expect(response.headers.get('Allow')).toBe('GET')
    })
  })
})
