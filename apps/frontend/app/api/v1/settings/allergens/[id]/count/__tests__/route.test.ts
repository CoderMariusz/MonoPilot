/**
 * Single Allergen Count API Route Tests
 * Story: TD-209 - Products Column in Allergens Table
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}))

import { createServerSupabase } from '@/lib/supabase/server'
import { GET, POST, PUT, DELETE } from '../route'

// Valid UUID for testing
const VALID_ALLERGEN_ID = '123e4567-e89b-12d3-a456-426614174000'

describe('Single Allergen Count API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/settings/allergens/[id]/count', () => {
    it('should return 400 for invalid UUID format', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest(`http://localhost/api/v1/settings/allergens/invalid-id/count`)
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid allergen ID format')
    })

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

      const request = new NextRequest(`http://localhost/api/v1/settings/allergens/${VALID_ALLERGEN_ID}/count`)
      const response = await GET(request, { params: Promise.resolve({ id: VALID_ALLERGEN_ID }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when allergen not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest(`http://localhost/api/v1/settings/allergens/${VALID_ALLERGEN_ID}/count`)
      const response = await GET(request, { params: Promise.resolve({ id: VALID_ALLERGEN_ID }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Allergen not found')
    })

    it('should return product count for valid allergen', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: VALID_ALLERGEN_ID }, error: null }),
              }),
            }),
          }),
        }),
        rpc: vi.fn().mockResolvedValue({ data: 7, error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest(`http://localhost/api/v1/settings/allergens/${VALID_ALLERGEN_ID}/count`)
      const response = await GET(request, { params: Promise.resolve({ id: VALID_ALLERGEN_ID }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.allergen_id).toBe(VALID_ALLERGEN_ID)
      expect(data.product_count).toBe(7)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_allergen_product_count', {
        p_allergen_id: VALID_ALLERGEN_ID,
      })
    })

    it('should return 0 when RPC returns null', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: VALID_ALLERGEN_ID }, error: null }),
              }),
            }),
          }),
        }),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest(`http://localhost/api/v1/settings/allergens/${VALID_ALLERGEN_ID}/count`)
      const response = await GET(request, { params: Promise.resolve({ id: VALID_ALLERGEN_ID }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.product_count).toBe(0)
    })

    it('should return 500 on RPC error', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: VALID_ALLERGEN_ID }, error: null }),
              }),
            }),
          }),
        }),
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest(`http://localhost/api/v1/settings/allergens/${VALID_ALLERGEN_ID}/count`)
      const response = await GET(request, { params: Promise.resolve({ id: VALID_ALLERGEN_ID }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch product count')
    })
  })

  describe('POST /api/v1/settings/allergens/[id]/count', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
      expect(response.headers.get('Allow')).toBe('GET')
    })
  })

  describe('PUT /api/v1/settings/allergens/[id]/count', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await PUT()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
      expect(response.headers.get('Allow')).toBe('GET')
    })
  })

  describe('DELETE /api/v1/settings/allergens/[id]/count', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
      expect(response.headers.get('Allow')).toBe('GET')
    })
  })
})
