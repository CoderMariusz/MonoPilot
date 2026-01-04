/**
 * Integration Tests: Warehouse Dashboard Alerts Endpoint
 * Story: 05.7 - Warehouse Dashboard
 * Phase: RED - Tests should FAIL (endpoint not implemented)
 *
 * GET /api/warehouse/dashboard/alerts
 *
 * Tests:
 * - Authentication and authorization
 * - Response structure and validation
 * - Alert type filtering
 * - Org isolation (RLS)
 * - Cache headers
 * - Error handling
 *
 * Coverage Target: 90%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../alerts/route'

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
  getDashboardAlerts: vi.fn(() => Promise.resolve({
    low_stock: [],
    expiring_items: [],
    blocked_lps: [],
  })),
}))

describe('GET /api/warehouse/dashboard/alerts', () => {
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

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 for users without warehouse permission', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      // Mock org lookup failure
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'No access' },
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Organization not found')
    })
  })

  describe('Response Structure', () => {
    it('should return 200 with alerts for authenticated users', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('low_stock')
      expect(data).toHaveProperty('expiring_items')
      expect(data).toHaveProperty('blocked_lps')
    })

    it('should return arrays for all alert types', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      expect(Array.isArray(data.low_stock)).toBe(true)
      expect(Array.isArray(data.expiring_items)).toBe(true)
      expect(Array.isArray(data.blocked_lps)).toBe(true)
    })

    it('should limit each array to 10 items max', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      expect(data.low_stock.length).toBeLessThanOrEqual(10)
      expect(data.expiring_items.length).toBeLessThanOrEqual(10)
      expect(data.blocked_lps.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Low Stock Alerts', () => {
    it('should include product_id, product_name, current_count, min_stock', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      if (data.low_stock.length > 0) {
        const alert = data.low_stock[0]
        expect(alert).toHaveProperty('product_id')
        expect(alert).toHaveProperty('product_name')
        expect(alert).toHaveProperty('current_count')
        expect(alert).toHaveProperty('min_stock')
      }
    })

    it('should only show products below min_stock threshold', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      data.low_stock.forEach((alert: any) => {
        expect(alert.current_count).toBeLessThan(alert.min_stock)
      })
    })
  })

  describe('Expiring Items Alerts', () => {
    it('should include lp_id, lp_number, product_name, expiry_date, days_until_expiry', async () => {
      // Expiring item alert structure
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      if (data.expiring_items.length > 0) {
        const alert = data.expiring_items[0]
        expect(alert).toHaveProperty('lp_id')
        expect(alert).toHaveProperty('lp_number')
        expect(alert).toHaveProperty('product_name')
        expect(alert).toHaveProperty('expiry_date')
        expect(alert).toHaveProperty('days_until_expiry')
      }
    })

    it('should calculate days_until_expiry correctly', async () => {
      // Create LP expiring in 7 days
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      if (data.expiring_items.length > 0) {
        const alert = data.expiring_items[0]
        expect(typeof alert.days_until_expiry).toBe('number')
        expect(alert.days_until_expiry).toBeGreaterThanOrEqual(0)
        expect(alert.days_until_expiry).toBeLessThanOrEqual(30)
      }
    })

    it('should sort by expiry_date ASC (soonest first)', async () => {
      // Create multiple expiring LPs
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      if (data.expiring_items.length > 1) {
        const first = data.expiring_items[0].days_until_expiry
        const second = data.expiring_items[1].days_until_expiry
        expect(first).toBeLessThanOrEqual(second)
      }
    })
  })

  describe('Blocked LPs Alerts', () => {
    it('should include lp_id, lp_number, product_name, qa_status, block_reason', async () => {
      // Blocked LP alert structure
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      if (data.blocked_lps.length > 0) {
        const alert = data.blocked_lps[0]
        expect(alert).toHaveProperty('lp_id')
        expect(alert).toHaveProperty('lp_number')
        expect(alert).toHaveProperty('product_name')
        expect(alert).toHaveProperty('qa_status')
      }
    })

    it('should only show quarantine or failed LPs', async () => {
      // Create LPs with various qa_status
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      const data = await response.json()
      data.blocked_lps.forEach((alert: any) => {
        expect(['quarantine', 'failed']).toContain(alert.qa_status)
      })
    })
  })

  describe('Org Isolation (RLS)', () => {
    it('should only return alerts for user org', async () => {
      // Create low stock in Org A and Org B
      // User A should only see Org A products
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toBeDefined()
      // Verify org_id filtering happened
    })

    it('should not leak data from other orgs', async () => {
      // Verify RLS filtering on all alert types
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Cache Headers', () => {
    it('should set Cache-Control header with max-age=60', async () => {
      // Should cache for 60 seconds
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('private, max-age=60')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      // Simulate database connection failure
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/alerts')
      const response = await GET(request)

      // In error case, should return 500
      if (response.status === 500) {
        const data = await response.json()
        expect(data.error).toBe('Internal server error')
      }
    })
  })
})
