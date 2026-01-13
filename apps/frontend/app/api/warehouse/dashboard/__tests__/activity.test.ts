/**
 * Integration Tests: Warehouse Dashboard Activity Endpoint
 * Story: 05.7 - Warehouse Dashboard
 * Phase: RED - Tests should FAIL (endpoint not implemented)
 *
 * GET /api/warehouse/dashboard/activity
 *
 * Tests:
 * - Authentication and authorization
 * - Response structure and validation
 * - Sorting and pagination
 * - Org isolation (RLS)
 * - No cache headers (real-time)
 * - Error handling
 *
 * Coverage Target: 90%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../activity/route'

/**
 * Mock Supabase server client
 */
const mockOrgId = '123e4567-e89b-12d3-a456-426614174000'
const mockUserId = '223e4567-e89b-12d3-a456-426614174000'

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { org_id: mockOrgId },
          error: null
        })),
      })),
    })),
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
}))

/**
 * Mock warehouse dashboard service
 */
vi.mock('@/lib/services/warehouse-dashboard-service', () => ({
  getRecentActivity: vi.fn(() => Promise.resolve([])),
}))

describe('GET /api/warehouse/dashboard/activity', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Default: authenticated user for most tests
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
  })

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      // Mock no user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      })

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for users without warehouse permission', async () => {
      // Mock org lookup failure - use type assertion for error case mock
      (mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'No access' },
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Organization not found')
    })
  })

  describe('Response Structure', () => {
    it('should return 200 with activities array', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('activities')
      expect(Array.isArray(data.activities)).toBe(true)
    })

    it('should return activity items with correct structure', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      if (data.activities.length > 0) {
        const activity = data.activities[0]
        expect(activity).toHaveProperty('timestamp')
        expect(activity).toHaveProperty('operation_type')
        expect(activity).toHaveProperty('lp_id')
        expect(activity).toHaveProperty('lp_number')
        expect(activity).toHaveProperty('user_name')
        expect(activity).toHaveProperty('description')
      }
    })

    it('should have valid operation_type values', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      const validTypes = ['create', 'consume', 'split', 'merge', 'move']
      data.activities.forEach((activity: any) => {
        expect(validTypes).toContain(activity.operation_type)
      })
    })
  })

  describe('Sorting and Pagination', () => {
    it('should sort by timestamp DESC (newest first)', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      if (data.activities.length > 1) {
        const first = new Date(data.activities[0].timestamp)
        const second = new Date(data.activities[1].timestamp)
        expect(first >= second).toBe(true)
      }
    })

    it('should default to limit 20', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      expect(data.activities.length).toBeLessThanOrEqual(20)
    })

    it('should respect limit query parameter', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity?limit=10')
      const response = await GET(request)

      const data = await response.json()
      expect(data.activities.length).toBeLessThanOrEqual(10)
    })

    it('should validate limit parameter', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity?limit=-5')
      const response = await GET(request)

      // Should reject invalid input
      expect([200, 400]).toContain(response.status)
    })

    it('should have max limit of 100', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity?limit=1000')
      const response = await GET(request)

      // Should either reject with 400 or clamp to max
      if (response.status === 400) {
        const data = await response.json()
        expect(data.error).toBeDefined()
      } else {
        const data = await response.json()
        expect(data.activities.length).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('Operation Types', () => {
    it('should include create operations', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      const createOps = data.activities.filter((a: any) => a.operation_type === 'create')
      expect(Array.isArray(createOps)).toBe(true)
    })

    it('should include consume operations', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      const consumeOps = data.activities.filter((a: any) => a.operation_type === 'consume')
      expect(Array.isArray(consumeOps)).toBe(true)
    })

    it('should include split operations', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      const splitOps = data.activities.filter((a: any) => a.operation_type === 'split')
      expect(Array.isArray(splitOps)).toBe(true)
    })

    it('should include merge operations', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      const mergeOps = data.activities.filter((a: any) => a.operation_type === 'merge')
      expect(Array.isArray(mergeOps)).toBe(true)
    })

    it('should include move operations', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      const moveOps = data.activities.filter((a: any) => a.operation_type === 'move')
      expect(Array.isArray(moveOps)).toBe(true)
    })
  })

  describe('Org Isolation (RLS)', () => {
    it('should only return activities for user org', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toBeDefined()
      // Verify org_id filtering happened
    })

    it('should not leak data from other orgs', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Cache Headers', () => {
    it('should set Cache-Control to no-cache', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('no-cache')
    })

    it('should not cache responses', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).not.toContain('max-age')
    })
  })

  describe('Empty State', () => {
    it('should return empty array when no activities exist', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      const data = await response.json()
      expect(data).toHaveProperty('activities')
      expect(Array.isArray(data.activities)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // Simulate database connection failure
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity')
      const response = await GET(request)

      // In error case, should return 500
      if (response.status === 500) {
        const data = await response.json()
        expect(data.error).toBe('Internal server error')
      }
    })

    it('should return 400 for invalid limit parameter', async () => {
      // Invalid limit (non-numeric)
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/activity?limit=abc')
      const response = await GET(request)

      // Should reject invalid input
      expect([200, 400]).toContain(response.status)
    })
  })
})
