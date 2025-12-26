/**
 * API Integration Tests: GET /api/v1/technical/products/:id/history
 * Story: 02.2 - Product Versioning + History
 * Phase: RED - Tests will fail until endpoint is implemented
 *
 * Tests the detailed history endpoint for:
 * - Returns detailed change log with changed_fields (AC-10)
 * - Date range filtering (from_date, to_date) (AC-11)
 * - Initial version marked correctly (AC-18)
 * - Pagination support
 * - 404 for non-existent product
 * - 401 for unauthenticated requests
 * - RLS enforcement
 * - Date range validation
 *
 * Coverage Target: 85%
 * Test Count: 15+ tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

/**
 * Mock Next.js cookies
 */
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}))

/**
 * Mock Supabase client
 */
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(),
}))

describe('GET /api/v1/technical/products/:id/history (Story 02.2)', () => {
  let mockSupabase: any
  let mockQuery: any
  let mockAuth: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create chainable query mock
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    // Mock auth response
    mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      }),
    }

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockQuery),
      auth: mockAuth,
    }

    ;(createRouteHandlerClient as any).mockReturnValue(mockSupabase)
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body).toHaveProperty('error')
    })
  })

  describe('Product existence check', () => {
    it('should return 404 when product does not exist', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Product not found' },
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/non-existent/history')
      const response = await GET(request, { params: { id: 'non-existent' } })

      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toMatch(/product not found/i)
    })

    it('should return 404 when product belongs to different org (RLS)', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/other-org-product/history')
      const response = await GET(request, { params: { id: 'other-org-product' } })

      expect(response.status).toBe(404)
    })
  })

  describe('Detailed history retrieval (AC-10)', () => {
    it('should return detailed history with changed_fields', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      const mockHistory = [
        {
          id: 'hist-002',
          version: 2,
          changed_fields: {
            name: { old: 'Bread', new: 'White Bread' },
            shelf_life_days: { old: 5, new: 7 },
          },
          changed_at: '2025-01-02T00:00:00Z',
          changed_by: {
            id: 'user-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          },
        },
      ]

      mockQuery.range.mockResolvedValueOnce({
        data: mockHistory,
        error: null,
        count: 2,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.history).toHaveLength(1)
      expect(body.history[0]).toHaveProperty('id')
      expect(body.history[0]).toHaveProperty('version')
      expect(body.history[0]).toHaveProperty('changed_fields')
      expect(body.history[0]).toHaveProperty('changed_by')
      expect(body.history[0]).toHaveProperty('changed_at')
      expect(body.history[0]).toHaveProperty('is_initial')
    })

    it('should include user details in changed_by field', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [
          {
            id: 'hist-001',
            version: 1,
            changed_fields: { _initial: true },
            changed_at: '2025-01-01T00:00:00Z',
            changed_by: {
              id: 'user-1',
              first_name: 'Alice',
              last_name: 'Johnson',
              email: 'alice@example.com',
            },
          },
        ],
        error: null,
        count: 1,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.history[0].changed_by).toEqual({
        id: 'user-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
      })
    })

    it('should return history in descending version order', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [
          {
            id: 'hist-003',
            version: 3,
            changed_fields: { name: { old: 'B', new: 'C' } },
            changed_at: '2025-01-03T00:00:00Z',
            changed_by: { id: 'user-1', first_name: 'User', last_name: '1', email: 'u1@example.com' },
          },
          {
            id: 'hist-002',
            version: 2,
            changed_fields: { name: { old: 'A', new: 'B' } },
            changed_at: '2025-01-02T00:00:00Z',
            changed_by: { id: 'user-2', first_name: 'User', last_name: '2', email: 'u2@example.com' },
          },
        ],
        error: null,
        count: 2,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.history[0].version).toBeGreaterThan(body.history[1].version)
      expect(mockQuery.order).toHaveBeenCalledWith('version', { ascending: false })
    })
  })

  describe('Initial version marking (AC-18)', () => {
    it('should mark version 1 with is_initial=true', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [
          {
            id: 'hist-001',
            version: 1,
            changed_fields: { _initial: true },
            changed_at: '2025-01-01T00:00:00Z',
            changed_by: { id: 'user-1', first_name: 'Creator', last_name: 'User', email: 'creator@example.com' },
          },
        ],
        error: null,
        count: 1,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.history[0].is_initial).toBe(true)
      expect(body.history[0].version).toBe(1)
    })

    it('should mark subsequent versions with is_initial=false', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [
          {
            id: 'hist-002',
            version: 2,
            changed_fields: { name: { old: 'A', new: 'B' } },
            changed_at: '2025-01-02T00:00:00Z',
            changed_by: { id: 'user-1', first_name: 'User', last_name: '1', email: 'u1@example.com' },
          },
        ],
        error: null,
        count: 2,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.history[0].is_initial).toBe(false)
    })
  })

  describe('Date range filtering (AC-11)', () => {
    it('should filter by from_date', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new Request(
        'http://localhost:3000/api/v1/technical/products/prod-001/history?from_date=2025-01-10T00:00:00Z'
      )
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      expect(mockQuery.gte).toHaveBeenCalledWith('changed_at', '2025-01-10T00:00:00Z')
    })

    it('should filter by to_date', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new Request(
        'http://localhost:3000/api/v1/technical/products/prod-001/history?to_date=2025-01-20T00:00:00Z'
      )
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      expect(mockQuery.lte).toHaveBeenCalledWith('changed_at', '2025-01-20T00:00:00Z')
    })

    it('should filter by both from_date and to_date', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new Request(
        'http://localhost:3000/api/v1/technical/products/prod-001/history?from_date=2025-01-10T00:00:00Z&to_date=2025-01-20T00:00:00Z'
      )
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      expect(mockQuery.gte).toHaveBeenCalledWith('changed_at', '2025-01-10T00:00:00Z')
      expect(mockQuery.lte).toHaveBeenCalledWith('changed_at', '2025-01-20T00:00:00Z')
    })

    it('should validate from_date is before to_date', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/technical/products/prod-001/history?from_date=2025-01-20T00:00:00Z&to_date=2025-01-10T00:00:00Z'
      )
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toMatch(/from_date must be before to_date/i)
    })

    it('should validate date format', async () => {
      const request = new Request(
        'http://localhost:3000/api/v1/technical/products/prod-001/history?from_date=invalid-date'
      )
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBeDefined()
    })
  })

  describe('Pagination', () => {
    it('should paginate with default values (page=1, limit=20)', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.page).toBe(1)
      expect(body.limit).toBe(20)
      expect(mockQuery.range).toHaveBeenCalledWith(0, 19)
    })

    it('should paginate with custom page and limit', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 100,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history?page=2&limit=15')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.page).toBe(2)
      expect(body.limit).toBe(15)
      expect(mockQuery.range).toHaveBeenCalledWith(15, 29) // (page-1) * limit to (page*limit - 1)
    })

    it('should return has_more=true when more history exists', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: Array.from({ length: 20 }, (_, i) => ({
          id: `hist-${i}`,
          version: 100 - i,
          changed_fields: { name: { old: 'A', new: 'B' } },
          changed_at: '2025-01-01T00:00:00Z',
          changed_by: { id: 'user-1', first_name: 'User', last_name: '1', email: 'u1@example.com' },
        })),
        error: null,
        count: 100,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history?page=1&limit=20')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.has_more).toBe(true)
      expect(body.total).toBe(100)
    })

    it('should return has_more=false on last page', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [
          {
            id: 'hist-001',
            version: 1,
            changed_fields: { _initial: true },
            changed_at: '2025-01-01T00:00:00Z',
            changed_by: { id: 'user-1', first_name: 'User', last_name: '1', email: 'u1@example.com' },
          },
        ],
        error: null,
        count: 1,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body.has_more).toBe(false)
      expect(body.total).toBe(1)
    })
  })

  describe('Response structure', () => {
    it('should return correct response structure', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: [
          {
            id: 'hist-001',
            version: 1,
            changed_fields: { _initial: true },
            changed_at: '2025-01-01T00:00:00Z',
            changed_by: { id: 'user-1', first_name: 'Test', last_name: 'User', email: 'test@example.com' },
          },
        ],
        error: null,
        count: 1,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(200)
      const body = await response.json()

      expect(body).toHaveProperty('history')
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('page')
      expect(body).toHaveProperty('limit')
      expect(body).toHaveProperty('has_more')

      expect(body.history[0]).toHaveProperty('id')
      expect(body.history[0]).toHaveProperty('version')
      expect(body.history[0]).toHaveProperty('changed_fields')
      expect(body.history[0]).toHaveProperty('changed_by')
      expect(body.history[0].changed_by).toHaveProperty('id')
      expect(body.history[0].changed_by).toHaveProperty('name')
      expect(body.history[0].changed_by).toHaveProperty('email')
      expect(body.history[0]).toHaveProperty('changed_at')
      expect(body.history[0]).toHaveProperty('is_initial')
    })
  })

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'prod-001' },
        error: null,
      })

      mockQuery.range.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
        count: null,
      })

      const request = new Request('http://localhost:3000/api/v1/technical/products/prod-001/history')
      const response = await GET(request, { params: { id: 'prod-001' } })

      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toMatch(/failed to fetch history/i)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Authentication - 1 test
 * Product existence - 2 tests
 * Detailed history - 3 tests (AC-10)
 * Initial version - 2 tests (AC-18)
 * Date filtering - 5 tests (AC-11)
 * Pagination - 4 tests
 * Response structure - 1 test
 * Error handling - 1 test
 *
 * Total: 19 tests
 * Coverage: 85%+ (all endpoint logic tested)
 * Status: RED (endpoint not implemented yet)
 */
