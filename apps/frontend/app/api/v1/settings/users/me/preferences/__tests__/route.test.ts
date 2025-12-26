/**
 * User Preferences API Route Tests
 * Story: TD-208 - Language Selector for Allergen Names
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}))

import { createServerSupabase } from '@/lib/supabase/server'
import { GET, PUT, POST, DELETE } from '../route'

describe('User Preferences API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/settings/users/me/preferences', () => {
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

    it('should return user language preference', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({ data: 'pl', error: null }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.language).toBe('pl')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_language', { p_user_id: 'user-123' })
    })

    it('should return en as default on RPC error', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC error' } }),
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.language).toBe('en')
    })
  })

  describe('PUT /api/v1/settings/users/me/preferences', () => {
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

      const request = new NextRequest('http://localhost/api/v1/settings/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ language: 'pl' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for invalid JSON body', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest('http://localhost/api/v1/settings/users/me/preferences', {
        method: 'PUT',
        body: 'invalid json',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON body')
    })

    it('should return 400 for invalid language code', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest('http://localhost/api/v1/settings/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ language: 'es' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_LANGUAGE')
      expect(data.error).toContain('Invalid language code')
    })

    it('should update language preference successfully', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        rpc: vi.fn()
          .mockResolvedValueOnce({ data: null, error: null }) // set_user_language
          .mockResolvedValueOnce({ data: 'de', error: null }), // get_user_language
      }
      vi.mocked(createServerSupabase).mockResolvedValue(mockSupabase as any)

      const request = new NextRequest('http://localhost/api/v1/settings/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ language: 'de' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.language).toBe('de')
      expect(data.message).toBe('Preferences updated successfully')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('set_user_language', { p_language: 'de' })
    })

    it('should handle RPC error', async () => {
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

      const request = new NextRequest('http://localhost/api/v1/settings/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ language: 'fr' }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update preferences')
    })
  })

  describe('POST /api/v1/settings/users/me/preferences', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('Method not allowed')
      expect(response.headers.get('Allow')).toBe('GET, PUT')
    })
  })

  describe('DELETE /api/v1/settings/users/me/preferences', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(405)
      expect(data.error).toContain('cannot be deleted')
      expect(response.headers.get('Allow')).toBe('GET, PUT')
    })
  })
})
