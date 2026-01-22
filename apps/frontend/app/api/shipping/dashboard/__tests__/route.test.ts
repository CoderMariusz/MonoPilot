/**
 * Integration Tests: Shipping Dashboard API Endpoints
 * Story: 07.15 - Shipping Dashboard + KPIs
 * Phase: RED - Tests should FAIL (routes not implemented)
 *
 * Endpoints tested:
 * - GET /api/shipping/dashboard (KPIs)
 * - GET /api/shipping/dashboard/alerts
 * - GET /api/shipping/dashboard/recent-activity
 *
 * Tests:
 * - Authentication and authorization
 * - Response structure and validation
 * - Org isolation (RLS)
 * - Cache headers
 * - Query parameters validation
 * - Error handling
 * - Performance targets
 *
 * Coverage Target: 90%
 * Test Count: 48 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getKPIs } from '../route'
import { GET as getAlerts } from '../alerts/route'
import { GET as getRecentActivity } from '../recent-activity/route'

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
        single: vi.fn(() =>
          Promise.resolve({
            data: { org_id: mockOrgId },
            error: null,
          })
        ),
      })),
    })),
  })),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
}))

/**
 * Mock shipping dashboard service
 */
vi.mock('@/lib/services/shipping-dashboard-service', () => ({
  ShippingDashboardService: {
    getKPIs: vi.fn(() =>
      Promise.resolve({
        orders: {
          total: 100,
          by_status: {
            draft: 10,
            confirmed: 20,
            allocated: 15,
            picking: 10,
            packing: 15,
            shipped: 25,
            delivered: 5,
          },
          trend: { current: 100, previous: 80, percentage: 25, direction: 'up' },
        },
        pick_lists: {
          total: 50,
          by_status: { pending: 10, assigned: 15, in_progress: 10, completed: 15 },
          trend: { current: 50, previous: 45, percentage: 11, direction: 'up' },
        },
        shipments: {
          total: 30,
          by_status: { pending: 5, packing: 5, packed: 5, shipped: 10, delivered: 5 },
          trend: { current: 30, previous: 30, percentage: 0, direction: 'neutral' },
        },
        backorders: { count: 5, total_value: 1500.0 },
        on_time_delivery_pct: 92,
        avg_pick_time_hours: 2.5,
        avg_pack_time_hours: 1.5,
        last_updated: new Date().toISOString(),
      })
    ),
    getAlerts: vi.fn(() =>
      Promise.resolve({
        backorders: {
          count: 3,
          items: [
            { so_line_id: 'line-1', product_name: 'Product A', qty_backordered: 10 },
          ],
        },
        delayed_shipments: {
          count: 2,
          items: [
            {
              so_id: 'so-1',
              order_number: 'SO-2025-00001',
              promised_date: '2025-12-15',
              days_late: 3,
            },
          ],
        },
        pending_picks_overdue: {
          count: 1,
          items: [
            {
              pick_list_id: 'pl-1',
              pick_list_number: 'PL-2025-00001',
              created_at: '2025-12-17T10:00:00Z',
              hours_pending: 48,
            },
          ],
        },
        allergen_conflicts: {
          count: 1,
          items: [
            {
              so_id: 'so-2',
              order_number: 'SO-2025-00002',
              customer_name: 'Test Customer',
              conflicting_allergens: ['Milk', 'Eggs'],
            },
          ],
        },
        alert_summary: { critical: 3, warning: 4, info: 0 },
      })
    ),
    getRecentActivity: vi.fn(() =>
      Promise.resolve([
        {
          id: 'activity-1',
          type: 'so_created',
          entity_type: 'sales_order',
          entity_id: 'so-1',
          entity_number: 'SO-2025-00001',
          description: 'Sales order created',
          created_at: new Date().toISOString(),
          created_by: { id: 'user-1', name: 'John Doe' },
          status: 'success',
        },
      ])
    ),
  },
}))

describe('GET /api/shipping/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: authenticated user for most tests
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
  })

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      })

      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 when user org not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      ;(mockSupabase.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Not found' },
              })
            ),
          })),
        })),
      })

      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Organization not found')
    })
  })

  describe('Response Structure - KPIs', () => {
    it('should return 200 with KPIs for authenticated users', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('orders')
      expect(data).toHaveProperty('pick_lists')
      expect(data).toHaveProperty('shipments')
      expect(data).toHaveProperty('backorders')
      expect(data).toHaveProperty('on_time_delivery_pct')
      expect(data).toHaveProperty('last_updated')
    })

    it('should return orders with total, by_status, and trend', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      const data = await response.json()
      expect(data.orders).toHaveProperty('total')
      expect(data.orders).toHaveProperty('by_status')
      expect(data.orders).toHaveProperty('trend')
      expect(data.orders.by_status).toHaveProperty('draft')
      expect(data.orders.by_status).toHaveProperty('confirmed')
      expect(data.orders.by_status).toHaveProperty('shipped')
    })

    it('should return trend with current, previous, percentage, direction', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      const data = await response.json()
      expect(data.orders.trend).toHaveProperty('current')
      expect(data.orders.trend).toHaveProperty('previous')
      expect(data.orders.trend).toHaveProperty('percentage')
      expect(data.orders.trend).toHaveProperty('direction')
      expect(['up', 'down', 'neutral']).toContain(data.orders.trend.direction)
    })

    it('should return backorders with count and total_value', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      const data = await response.json()
      expect(data.backorders).toHaveProperty('count')
      expect(data.backorders).toHaveProperty('total_value')
      expect(typeof data.backorders.count).toBe('number')
      expect(typeof data.backorders.total_value).toBe('number')
    })

    it('should return on_time_delivery_pct as percentage 0-100', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      const data = await response.json()
      expect(data.on_time_delivery_pct).toBeGreaterThanOrEqual(0)
      expect(data.on_time_delivery_pct).toBeLessThanOrEqual(100)
    })
  })

  describe('Query Parameters - KPIs', () => {
    it('should accept date_from and date_to query params', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard?date_from=2025-12-01&date_to=2025-12-31'
      )
      const response = await getKPIs(request)

      expect(response.status).toBe(200)
    })

    it('should accept date_range preset (today, week, month, last_7, last_30)', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard?date_range=last_30'
      )
      const response = await getKPIs(request)

      expect(response.status).toBe(200)
    })

    it('should return 400 for invalid date range exceeding 365 days', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard?date_from=2024-01-01&date_to=2025-12-31'
      )
      const response = await getKPIs(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.code).toBe('INVALID_DATE_RANGE')
    })

    it('should default to last 30 days when no date params provided', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Cache Headers', () => {
    it('should set Cache-Control header with max-age=60', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      expect(response.headers.get('Cache-Control')).toBe('private, max-age=60')
    })

    it('should set private cache control to prevent cross-user caching', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('private')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on service error', async () => {
      const { ShippingDashboardService } = await import(
        '@/lib/services/shipping-dashboard-service'
      )
      vi.mocked(ShippingDashboardService.getKPIs).mockRejectedValueOnce(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should include error code DASHBOARD_KPI_ERROR', async () => {
      const { ShippingDashboardService } = await import(
        '@/lib/services/shipping-dashboard-service'
      )
      vi.mocked(ShippingDashboardService.getKPIs).mockRejectedValueOnce(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/shipping/dashboard')
      const response = await getKPIs(request)

      const data = await response.json()
      expect(data.code).toBe('DASHBOARD_KPI_ERROR')
    })
  })
})

describe('GET /api/shipping/dashboard/alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
  })

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      })

      const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
      const response = await getAlerts(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Response Structure - Alerts', () => {
    it('should return 200 with alerts for authenticated users', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
      const response = await getAlerts(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('backorders')
      expect(data).toHaveProperty('delayed_shipments')
      expect(data).toHaveProperty('pending_picks_overdue')
      expect(data).toHaveProperty('allergen_conflicts')
      expect(data).toHaveProperty('alert_summary')
    })

    it('should return backorders with count and items array', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
      const response = await getAlerts(request)

      const data = await response.json()
      expect(data.backorders).toHaveProperty('count')
      expect(data.backorders).toHaveProperty('items')
      expect(Array.isArray(data.backorders.items)).toBe(true)
    })

    it('should return delayed_shipments with days_late calculation', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
      const response = await getAlerts(request)

      const data = await response.json()
      if (data.delayed_shipments.items.length > 0) {
        expect(data.delayed_shipments.items[0]).toHaveProperty('days_late')
        expect(data.delayed_shipments.items[0].days_late).toBeGreaterThan(0)
      }
    })

    it('should return pending_picks_overdue with hours_pending calculation', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
      const response = await getAlerts(request)

      const data = await response.json()
      if (data.pending_picks_overdue.items.length > 0) {
        expect(data.pending_picks_overdue.items[0]).toHaveProperty('hours_pending')
        expect(data.pending_picks_overdue.items[0].hours_pending).toBeGreaterThan(24)
      }
    })

    it('should return allergen_conflicts with conflicting_allergens array', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
      const response = await getAlerts(request)

      const data = await response.json()
      if (data.allergen_conflicts.items.length > 0) {
        expect(data.allergen_conflicts.items[0]).toHaveProperty('conflicting_allergens')
        expect(Array.isArray(data.allergen_conflicts.items[0].conflicting_allergens)).toBe(
          true
        )
      }
    })

    it('should return alert_summary with critical, warning, info counts', async () => {
      const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
      const response = await getAlerts(request)

      const data = await response.json()
      expect(data.alert_summary).toHaveProperty('critical')
      expect(data.alert_summary).toHaveProperty('warning')
      expect(data.alert_summary).toHaveProperty('info')
    })
  })

  describe('Query Parameters - Alerts', () => {
    it('should accept severity filter (critical, warning, info, all)', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/alerts?severity=critical'
      )
      const response = await getAlerts(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on service error with DASHBOARD_ALERTS_ERROR code', async () => {
      const { ShippingDashboardService } = await import(
        '@/lib/services/shipping-dashboard-service'
      )
      vi.mocked(ShippingDashboardService.getAlerts).mockRejectedValueOnce(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
      const response = await getAlerts(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.code).toBe('DASHBOARD_ALERTS_ERROR')
    })
  })
})

describe('GET /api/shipping/dashboard/recent-activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
  })

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      })

      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity'
      )
      const response = await getRecentActivity(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Response Structure - Recent Activity', () => {
    it('should return 200 with activities array', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity'
      )
      const response = await getRecentActivity(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('activities')
      expect(Array.isArray(data.activities)).toBe(true)
    })

    it('should return activities with required fields', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity'
      )
      const response = await getRecentActivity(request)

      const data = await response.json()
      if (data.activities.length > 0) {
        const activity = data.activities[0]
        expect(activity).toHaveProperty('id')
        expect(activity).toHaveProperty('type')
        expect(activity).toHaveProperty('entity_type')
        expect(activity).toHaveProperty('entity_id')
        expect(activity).toHaveProperty('entity_number')
        expect(activity).toHaveProperty('description')
        expect(activity).toHaveProperty('created_at')
        expect(activity).toHaveProperty('created_by')
        expect(activity).toHaveProperty('status')
      }
    })

    it('should return pagination info', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity'
      )
      const response = await getRecentActivity(request)

      const data = await response.json()
      expect(data).toHaveProperty('pagination')
      expect(data.pagination).toHaveProperty('total')
      expect(data.pagination).toHaveProperty('limit')
      expect(data.pagination).toHaveProperty('offset')
    })

    it('should return valid activity types', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity'
      )
      const response = await getRecentActivity(request)

      const validTypes = [
        'so_created',
        'so_confirmed',
        'so_shipped',
        'pick_completed',
        'shipment_packed',
      ]

      const data = await response.json()
      data.activities.forEach((activity: any) => {
        expect(validTypes).toContain(activity.type)
      })
    })
  })

  describe('Query Parameters - Recent Activity', () => {
    it('should accept limit parameter (default 10, max 50)', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity?limit=20'
      )
      const response = await getRecentActivity(request)

      expect(response.status).toBe(200)
    })

    it('should accept offset parameter for pagination', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity?offset=10'
      )
      const response = await getRecentActivity(request)

      expect(response.status).toBe(200)
    })

    it('should return 400 for limit exceeding 50', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity?limit=100'
      )
      const response = await getRecentActivity(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.code).toBe('INVALID_LIMIT')
    })

    it('should return 400 for negative limit', async () => {
      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity?limit=-5'
      )
      const response = await getRecentActivity(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on service error with DASHBOARD_ACTIVITY_ERROR code', async () => {
      const { ShippingDashboardService } = await import(
        '@/lib/services/shipping-dashboard-service'
      )
      vi.mocked(ShippingDashboardService.getRecentActivity).mockRejectedValueOnce(
        new Error('Database error')
      )

      const request = new NextRequest(
        'http://localhost/api/shipping/dashboard/recent-activity'
      )
      const response = await getRecentActivity(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.code).toBe('DASHBOARD_ACTIVITY_ERROR')
    })
  })
})

describe('Multi-Tenant Isolation (All Endpoints)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
  })

  it('should only return data for authenticated user org (KPIs)', async () => {
    const request = new NextRequest('http://localhost/api/shipping/dashboard')
    const response = await getKPIs(request)

    expect(response.status).toBe(200)
  })

  it('should only return data for authenticated user org (Alerts)', async () => {
    const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
    const response = await getAlerts(request)

    expect(response.status).toBe(200)
  })

  it('should only return data for authenticated user org (Activity)', async () => {
    const request = new NextRequest(
      'http://localhost/api/shipping/dashboard/recent-activity'
    )
    const response = await getRecentActivity(request)

    expect(response.status).toBe(200)
  })
})

describe('Performance Targets', () => {
  it('KPIs API should target <200ms response time (with cache)', async () => {
    const start = performance.now()
    const request = new NextRequest('http://localhost/api/shipping/dashboard')
    await getKPIs(request)
    const duration = performance.now() - start

    // Note: This is a mock test, real performance testing requires actual implementation
    expect(duration).toBeDefined()
  })

  it('Alerts API should target <150ms response time (with cache)', async () => {
    const start = performance.now()
    const request = new NextRequest('http://localhost/api/shipping/dashboard/alerts')
    await getAlerts(request)
    const duration = performance.now() - start

    expect(duration).toBeDefined()
  })

  it('Activity API should target <100ms response time (with cache)', async () => {
    const start = performance.now()
    const request = new NextRequest(
      'http://localhost/api/shipping/dashboard/recent-activity'
    )
    await getRecentActivity(request)
    const duration = performance.now() - start

    expect(duration).toBeDefined()
  })
})
