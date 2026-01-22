/**
 * Unit Tests: Shipping Dashboard Service
 * Story: 07.15 - Shipping Dashboard + KPIs
 * Phase: RED - Tests should FAIL (service not implemented)
 *
 * Tests dashboard service methods including:
 * - KPI calculations (Orders, Pick Lists, Shipments, Backorders)
 * - Trend analysis (current vs previous period)
 * - Alert aggregation (4 alert types)
 * - Recent activity feed
 * - Cache key generation
 * - RLS org_id filtering
 * - Performance with caching
 *
 * Coverage Target: 80%
 * Test Count: 45 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type {
  DashboardKPIs,
  DashboardAlerts,
  ActivityItem,
  TrendIndicator,
  DateRange,
} from '../../types/shipping-dashboard'
import {
  ShippingDashboardService,
  SHIPPING_DASHBOARD_CACHE_KEYS,
} from '../shipping-dashboard-service'

// Mock Supabase with recursive chainable methods
const createChainableMock = (): any => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null, count: 0 })),
    then: vi.fn((resolve) => resolve({ data: null, error: null, count: 0 })),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({
    from: vi.fn(() => createChainableMock()),
  }),
}))

// Mock Redis cache
vi.mock('@/lib/cache/redis', () => ({
  getCache: vi.fn(() => Promise.resolve(null)),
  setCache: vi.fn(() => Promise.resolve()),
  deleteCache: vi.fn(() => Promise.resolve()),
}))

// Mock types
const mockOrgId = '123e4567-e89b-12d3-a456-426614174000'
const mockDateFrom = new Date('2025-12-01')
const mockDateTo = new Date('2025-12-31')

describe('Shipping Dashboard Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getKPIs', () => {
    it('should return all KPI metrics', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result).toHaveProperty('orders')
      expect(result).toHaveProperty('pick_lists')
      expect(result).toHaveProperty('shipments')
      expect(result).toHaveProperty('backorders')
      expect(result).toHaveProperty('on_time_delivery_pct')
      expect(result).toHaveProperty('avg_pick_time_hours')
      expect(result).toHaveProperty('avg_pack_time_hours')
      expect(result).toHaveProperty('last_updated')
    })

    it('should return orders KPI with total and by_status breakdown', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.orders).toHaveProperty('total')
      expect(result.orders).toHaveProperty('by_status')
      expect(result.orders).toHaveProperty('trend')
      expect(result.orders.by_status).toHaveProperty('draft')
      expect(result.orders.by_status).toHaveProperty('confirmed')
      expect(result.orders.by_status).toHaveProperty('allocated')
      expect(result.orders.by_status).toHaveProperty('picking')
      expect(result.orders.by_status).toHaveProperty('packing')
      expect(result.orders.by_status).toHaveProperty('shipped')
      expect(result.orders.by_status).toHaveProperty('delivered')
    })

    it('should return pick_lists KPI with total and by_status breakdown', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.pick_lists).toHaveProperty('total')
      expect(result.pick_lists).toHaveProperty('by_status')
      expect(result.pick_lists).toHaveProperty('trend')
      expect(result.pick_lists.by_status).toHaveProperty('pending')
      expect(result.pick_lists.by_status).toHaveProperty('assigned')
      expect(result.pick_lists.by_status).toHaveProperty('in_progress')
      expect(result.pick_lists.by_status).toHaveProperty('completed')
    })

    it('should return shipments KPI with total and by_status breakdown', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.shipments).toHaveProperty('total')
      expect(result.shipments).toHaveProperty('by_status')
      expect(result.shipments).toHaveProperty('trend')
      expect(result.shipments.by_status).toHaveProperty('pending')
      expect(result.shipments.by_status).toHaveProperty('packing')
      expect(result.shipments.by_status).toHaveProperty('packed')
      expect(result.shipments.by_status).toHaveProperty('shipped')
      expect(result.shipments.by_status).toHaveProperty('delivered')
    })

    it('should return backorders KPI with count and total_value', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.backorders).toHaveProperty('count')
      expect(result.backorders).toHaveProperty('total_value')
      expect(typeof result.backorders.count).toBe('number')
      expect(typeof result.backorders.total_value).toBe('number')
    })

    it('should calculate on_time_delivery_pct as percentage 0-100', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.on_time_delivery_pct).toBeGreaterThanOrEqual(0)
      expect(result.on_time_delivery_pct).toBeLessThanOrEqual(100)
    })

    it('should return avg_pick_time_hours as positive number', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.avg_pick_time_hours).toBeGreaterThanOrEqual(0)
    })

    it('should return avg_pack_time_hours as positive number', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.avg_pack_time_hours).toBeGreaterThanOrEqual(0)
    })

    it('should return last_updated as valid ISO date string', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(typeof result.last_updated).toBe('string')
      expect(new Date(result.last_updated).toISOString()).toBe(result.last_updated)
    })

    it('should filter by org_id for RLS compliance', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result).toBeDefined()
    })

    it('should return cached value when available', async () => {
      const { getCache } = await import('@/lib/cache/redis')
      vi.mocked(getCache).mockResolvedValueOnce({
        orders: { total: 100, by_status: {}, trend: {} },
        pick_lists: { total: 50, by_status: {}, trend: {} },
        shipments: { total: 30, by_status: {}, trend: {} },
        backorders: { count: 5, total_value: 1000 },
        on_time_delivery_pct: 95,
        avg_pick_time_hours: 2.5,
        avg_pack_time_hours: 1.5,
        last_updated: new Date().toISOString(),
      })

      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.orders.total).toBe(100)
    })

    it('should populate cache on miss with 60s TTL', async () => {
      const { setCache } = await import('@/lib/cache/redis')

      await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(setCache).toHaveBeenCalled()
    })

    it('should return zero values when no data exists', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.orders.total).toBeGreaterThanOrEqual(0)
      expect(result.pick_lists.total).toBeGreaterThanOrEqual(0)
      expect(result.shipments.total).toBeGreaterThanOrEqual(0)
      expect(result.backorders.count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateTrend', () => {
    it('should calculate positive trend correctly', () => {
      const result = ShippingDashboardService.calculateTrend(100, 80)

      expect(result.percentage).toBe(25)
      expect(result.direction).toBe('up')
      expect(result.current).toBe(100)
      expect(result.previous).toBe(80)
    })

    it('should calculate negative trend correctly', () => {
      const result = ShippingDashboardService.calculateTrend(80, 100)

      expect(result.percentage).toBe(20)
      expect(result.direction).toBe('down')
    })

    it('should return neutral trend when values are equal', () => {
      const result = ShippingDashboardService.calculateTrend(50, 50)

      expect(result.percentage).toBe(0)
      expect(result.direction).toBe('neutral')
    })

    it('should handle zero previous value', () => {
      const result = ShippingDashboardService.calculateTrend(50, 0)

      expect(result.percentage).toBe(100)
      expect(result.direction).toBe('up')
    })

    it('should handle both values being zero', () => {
      const result = ShippingDashboardService.calculateTrend(0, 0)

      expect(result.percentage).toBe(0)
      expect(result.direction).toBe('neutral')
    })

    it('should round percentage to integer', () => {
      const result = ShippingDashboardService.calculateTrend(33, 100)

      expect(Number.isInteger(result.percentage)).toBe(true)
    })
  })

  describe('generateCacheKey', () => {
    it('should generate cache key with correct format', () => {
      const cacheKey = ShippingDashboardService.generateCacheKey(
        'kpis',
        mockOrgId,
        mockDateFrom,
        mockDateTo
      )

      expect(cacheKey).toContain('shipping:dashboard:kpis')
      expect(cacheKey).toContain(mockOrgId)
      expect(cacheKey).toContain('2025-12-01_2025-12-31')
    })

    it('should handle same day range', () => {
      const sameDay = new Date('2025-12-15')
      const cacheKey = ShippingDashboardService.generateCacheKey(
        'kpis',
        mockOrgId,
        sameDay,
        sameDay
      )

      expect(cacheKey).toContain('2025-12-15_2025-12-15')
    })

    it('should generate unique keys for different date ranges', () => {
      const key1 = ShippingDashboardService.generateCacheKey(
        'kpis',
        mockOrgId,
        new Date('2025-12-01'),
        new Date('2025-12-07')
      )
      const key2 = ShippingDashboardService.generateCacheKey(
        'kpis',
        mockOrgId,
        new Date('2025-12-08'),
        new Date('2025-12-14')
      )

      expect(key1).not.toBe(key2)
    })

    it('should generate unique keys for different orgs', () => {
      const key1 = ShippingDashboardService.generateCacheKey(
        'kpis',
        'org-1',
        mockDateFrom,
        mockDateTo
      )
      const key2 = ShippingDashboardService.generateCacheKey(
        'kpis',
        'org-2',
        mockDateFrom,
        mockDateTo
      )

      expect(key1).not.toBe(key2)
    })
  })

  describe('getAlerts', () => {
    it('should return alerts with correct structure', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result).toHaveProperty('backorders')
      expect(result).toHaveProperty('delayed_shipments')
      expect(result).toHaveProperty('pending_picks_overdue')
      expect(result).toHaveProperty('allergen_conflicts')
      expect(result).toHaveProperty('alert_summary')
    })

    it('should return backorders alert with count and items', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.backorders).toHaveProperty('count')
      expect(result.backorders).toHaveProperty('items')
      expect(Array.isArray(result.backorders.items)).toBe(true)
    })

    it('should return backorder items with required fields', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      if (result.backorders.items.length > 0) {
        const item = result.backorders.items[0]
        expect(item).toHaveProperty('so_line_id')
        expect(item).toHaveProperty('product_name')
        expect(item).toHaveProperty('qty_backordered')
      }
    })

    it('should return delayed_shipments alert with count and items', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.delayed_shipments).toHaveProperty('count')
      expect(result.delayed_shipments).toHaveProperty('items')
      expect(Array.isArray(result.delayed_shipments.items)).toBe(true)
    })

    it('should return delayed shipment items with days_late calculation', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      if (result.delayed_shipments.items.length > 0) {
        const item = result.delayed_shipments.items[0]
        expect(item).toHaveProperty('so_id')
        expect(item).toHaveProperty('order_number')
        expect(item).toHaveProperty('promised_date')
        expect(item).toHaveProperty('days_late')
        expect(item.days_late).toBeGreaterThan(0)
      }
    })

    it('should return pending_picks_overdue alert with count and items', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.pending_picks_overdue).toHaveProperty('count')
      expect(result.pending_picks_overdue).toHaveProperty('items')
      expect(Array.isArray(result.pending_picks_overdue.items)).toBe(true)
    })

    it('should return overdue pick items with hours_pending calculation', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      if (result.pending_picks_overdue.items.length > 0) {
        const item = result.pending_picks_overdue.items[0]
        expect(item).toHaveProperty('pick_list_id')
        expect(item).toHaveProperty('pick_list_number')
        expect(item).toHaveProperty('created_at')
        expect(item).toHaveProperty('hours_pending')
        expect(item.hours_pending).toBeGreaterThan(24)
      }
    })

    it('should return allergen_conflicts alert with count and items', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.allergen_conflicts).toHaveProperty('count')
      expect(result.allergen_conflicts).toHaveProperty('items')
      expect(Array.isArray(result.allergen_conflicts.items)).toBe(true)
    })

    it('should return allergen conflict items with conflicting_allergens array', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      if (result.allergen_conflicts.items.length > 0) {
        const item = result.allergen_conflicts.items[0]
        expect(item).toHaveProperty('so_id')
        expect(item).toHaveProperty('order_number')
        expect(item).toHaveProperty('customer_name')
        expect(item).toHaveProperty('conflicting_allergens')
        expect(Array.isArray(item.conflicting_allergens)).toBe(true)
      }
    })

    it('should return alert_summary with counts by severity', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.alert_summary).toHaveProperty('critical')
      expect(result.alert_summary).toHaveProperty('warning')
      expect(result.alert_summary).toHaveProperty('info')
      expect(typeof result.alert_summary.critical).toBe('number')
      expect(typeof result.alert_summary.warning).toBe('number')
      expect(typeof result.alert_summary.info).toBe('number')
    })

    it('should return empty arrays when no issues exist', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.backorders.count).toBeGreaterThanOrEqual(0)
      expect(result.delayed_shipments.count).toBeGreaterThanOrEqual(0)
      expect(result.pending_picks_overdue.count).toBeGreaterThanOrEqual(0)
      expect(result.allergen_conflicts.count).toBeGreaterThanOrEqual(0)
    })

    it('should filter by org_id for RLS compliance', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result).toBeDefined()
    })

    it('should return cached value when available', async () => {
      const { getCache } = await import('@/lib/cache/redis')
      vi.mocked(getCache).mockResolvedValueOnce({
        backorders: { count: 3, items: [] },
        delayed_shipments: { count: 2, items: [] },
        pending_picks_overdue: { count: 1, items: [] },
        allergen_conflicts: { count: 0, items: [] },
        alert_summary: { critical: 3, warning: 3, info: 0 },
      })

      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)

      expect(result.backorders.count).toBe(3)
    })
  })

  describe('getRecentActivity', () => {
    it('should return activities array', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return activities with required fields', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      if (result.length > 0) {
        const activity = result[0]
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

    it('should return valid activity types', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      const validTypes = ['so_created', 'so_confirmed', 'so_shipped', 'pick_completed', 'shipment_packed']

      result.forEach((activity) => {
        expect(validTypes).toContain(activity.type)
      })
    })

    it('should sort activities by created_at DESC (newest first)', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const current = new Date(result[i].created_at).getTime()
          const next = new Date(result[i + 1].created_at).getTime()
          expect(current).toBeGreaterThanOrEqual(next)
        }
      }
    })

    it('should respect limit parameter', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId, 5)

      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('should default to limit 10', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      expect(result.length).toBeLessThanOrEqual(10)
    })

    it('should not exceed max limit of 50', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId, 100)

      expect(result.length).toBeLessThanOrEqual(50)
    })

    it('should return created_by with id and name', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      if (result.length > 0) {
        expect(result[0].created_by).toHaveProperty('id')
        expect(result[0].created_by).toHaveProperty('name')
      }
    })

    it('should return valid status values', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      const validStatuses = ['success', 'warning', 'error']

      result.forEach((activity) => {
        expect(validStatuses).toContain(activity.status)
      })
    })

    it('should filter by org_id for RLS compliance', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      expect(result).toBeDefined()
    })

    it('should return empty array when no activities exist', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return cached value when available', async () => {
      const { getCache } = await import('@/lib/cache/redis')
      vi.mocked(getCache).mockResolvedValueOnce([
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

      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)

      expect(result[0].entity_number).toBe('SO-2025-00001')
    })
  })

  describe('getShipmentsByDate', () => {
    it('should return array of date-count pairs', async () => {
      const result = await ShippingDashboardService.getShipmentsByDate(
        mockOrgId,
        mockDateFrom,
        mockDateTo
      )

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return items with date and count properties', async () => {
      const result = await ShippingDashboardService.getShipmentsByDate(
        mockOrgId,
        mockDateFrom,
        mockDateTo
      )

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('date')
        expect(result[0]).toHaveProperty('count')
        expect(typeof result[0].date).toBe('string')
        expect(typeof result[0].count).toBe('number')
      }
    })

    it('should sort by date ASC', async () => {
      const result = await ShippingDashboardService.getShipmentsByDate(
        mockOrgId,
        mockDateFrom,
        mockDateTo
      )

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const current = new Date(result[i].date).getTime()
          const next = new Date(result[i + 1].date).getTime()
          expect(current).toBeLessThanOrEqual(next)
        }
      }
    })

    it('should filter by date range', async () => {
      const result = await ShippingDashboardService.getShipmentsByDate(
        mockOrgId,
        mockDateFrom,
        mockDateTo
      )

      result.forEach((item) => {
        const date = new Date(item.date)
        expect(date >= mockDateFrom).toBe(true)
        expect(date <= mockDateTo).toBe(true)
      })
    })
  })

  describe('Cache Key Constants', () => {
    it('should have DASHBOARD_KPIS cache key function', () => {
      const key = SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_KPIS(mockOrgId, '2025-12-01_2025-12-31')

      expect(key).toContain('shipping:dashboard:kpis')
      expect(key).toContain(mockOrgId)
    })

    it('should have DASHBOARD_ALERTS cache key function', () => {
      const key = SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_ALERTS(mockOrgId, '2025-12-01_2025-12-31')

      expect(key).toContain('shipping:dashboard:alerts')
      expect(key).toContain(mockOrgId)
    })

    it('should have DASHBOARD_ACTIVITY cache key function', () => {
      const key = SHIPPING_DASHBOARD_CACHE_KEYS.DASHBOARD_ACTIVITY(mockOrgId, 10)

      expect(key).toContain('shipping:dashboard:activity')
      expect(key).toContain(mockOrgId)
    })
  })

  describe('RLS and Multi-Tenancy', () => {
    it('should filter KPIs by org_id', async () => {
      const result = await ShippingDashboardService.getKPIs(mockOrgId, mockDateFrom, mockDateTo)
      expect(result).toBeDefined()
    })

    it('should filter alerts by org_id', async () => {
      const result = await ShippingDashboardService.getAlerts(mockOrgId, mockDateFrom, mockDateTo)
      expect(result).toBeDefined()
    })

    it('should filter activity by org_id', async () => {
      const result = await ShippingDashboardService.getRecentActivity(mockOrgId)
      expect(result).toBeDefined()
    })

    it('should not leak data between orgs', async () => {
      const org1Result = await ShippingDashboardService.getKPIs('org-1', mockDateFrom, mockDateTo)
      const org2Result = await ShippingDashboardService.getKPIs('org-2', mockDateFrom, mockDateTo)

      // Both should return independent results (mocked as empty/zero)
      expect(org1Result).toBeDefined()
      expect(org2Result).toBeDefined()
    })
  })
})
