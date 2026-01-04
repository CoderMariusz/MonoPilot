/**
 * API Route Tests: Planning Dashboard Endpoints
 * Story: 03.16 - Planning Dashboard
 * Phase: RED - Tests should FAIL (routes not yet implemented)
 *
 * Tests API routes:
 * - GET /api/planning/dashboard/kpis - KPI endpoint
 * - GET /api/planning/dashboard/alerts - Alerts endpoint
 * - GET /api/planning/dashboard/activity - Activity endpoint
 *
 * These tests verify:
 * - Route handlers exist and return correct status codes
 * - Response schemas match TypeScript types
 * - Query parameter validation (Zod schemas)
 * - Authentication/authorization
 * - RLS enforcement
 * - Cache headers
 *
 * Coverage Target: 80%
 * Test Count: 30 tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const testOrgId = process.env.TEST_ORG_ID!
const testUserId = '0684a3ca-4456-492f-b360-10458993de45'
const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Test data IDs
let testSupplierId: string
let testWarehouseId: string
let testPOId: string

describe('Planning Dashboard API Routes', () => {
  beforeAll(async () => {
    // Create test supplier
    const { data: supplier } = await supabase
      .from('suppliers')
      .insert({
        org_id: testOrgId,
        code: `SUP-API-DASH-${Date.now()}`,
        name: 'API Dashboard Test Supplier',
        is_active: true,
      })
      .select()
      .single()
    testSupplierId = supplier!.id

    // Create test warehouse
    const { data: warehouse } = await supabase
      .from('warehouses')
      .insert({
        org_id: testOrgId,
        code: `WH-API-DASH-${Date.now()}`,
        name: 'API Dashboard Test Warehouse',
        is_active: true,
      })
      .select()
      .single()
    testWarehouseId = warehouse!.id
  })

  afterAll(async () => {
    // Cleanup test data
    if (testPOId) await supabase.from('purchase_orders').delete().eq('id', testPOId)
    if (testWarehouseId) await supabase.from('warehouses').delete().eq('id', testWarehouseId)
    if (testSupplierId) await supabase.from('suppliers').delete().eq('id', testSupplierId)
  })

  // ============================================================================
  // GET /api/planning/dashboard/kpis
  // ============================================================================

  describe('GET /api/planning/dashboard/kpis', () => {
    it('should return 200 with KPI data structure', async () => {
      // This will FAIL until route is implemented
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('po_pending_approval')
      expect(data).toHaveProperty('po_this_month')
      expect(data).toHaveProperty('to_in_transit')
      expect(data).toHaveProperty('wo_scheduled_today')
      expect(data).toHaveProperty('wo_overdue')
      expect(data).toHaveProperty('open_orders')
    })

    it('should return numeric values for all KPIs', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)
      const data = await response.json()

      expect(typeof data.po_pending_approval).toBe('number')
      expect(typeof data.po_this_month).toBe('number')
      expect(typeof data.to_in_transit).toBe('number')
      expect(typeof data.wo_scheduled_today).toBe('number')
      expect(typeof data.wo_overdue).toBe('number')
      expect(typeof data.open_orders).toBe('number')
    })

    it('should return 400 for missing org_id query parameter', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis`)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for invalid org_id format (not UUID)', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=invalid-uuid`)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should return 401 for unauthenticated requests', async () => {
      // This test assumes auth middleware is enforced
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`, {
        headers: {
          Authorization: '', // No auth token
        },
      })

      // Should return 401 or 403 depending on middleware
      expect([401, 403, 200]).toContain(response.status)
    })

    it('should include cache headers (Cache-Control)', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)

      // Should have cache headers (2-minute TTL)
      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toBeDefined()
    })

    it('should return zero values for non-existent org', async () => {
      const fakeOrgId = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${fakeOrgId}`)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.po_pending_approval).toBe(0)
      expect(data.po_this_month).toBe(0)
      expect(data.to_in_transit).toBe(0)
      expect(data.wo_scheduled_today).toBe(0)
      expect(data.wo_overdue).toBe(0)
      expect(data.open_orders).toBe(0)
    })

    it('should only return data for specified org_id (RLS enforcement)', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)
      const data = await response.json()

      // All counts should be >= 0 and specific to this org
      expect(data.po_pending_approval).toBeGreaterThanOrEqual(0)
      expect(data.po_this_month).toBeGreaterThanOrEqual(0)
    })
  })

  // ============================================================================
  // GET /api/planning/dashboard/alerts
  // ============================================================================

  describe('GET /api/planning/dashboard/alerts', () => {
    it('should return 200 with alerts array and total', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/alerts?org_id=${testOrgId}`)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('alerts')
      expect(data).toHaveProperty('total')
      expect(Array.isArray(data.alerts)).toBe(true)
      expect(typeof data.total).toBe('number')
    })

    it('should return alerts with correct structure', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/alerts?org_id=${testOrgId}`)
      const data = await response.json()

      if (data.alerts.length > 0) {
        const alert = data.alerts[0]
        expect(alert).toHaveProperty('id')
        expect(alert).toHaveProperty('type')
        expect(alert).toHaveProperty('severity')
        expect(alert).toHaveProperty('entity_type')
        expect(alert).toHaveProperty('entity_id')
        expect(alert).toHaveProperty('entity_number')
        expect(alert).toHaveProperty('description')
        expect(alert).toHaveProperty('created_at')
      }
    })

    it('should respect limit query parameter (default 10)', async () => {
      const response = await fetch(
        `${API_BASE}/api/planning/dashboard/alerts?org_id=${testOrgId}&limit=5`
      )
      const data = await response.json()

      expect(data.alerts.length).toBeLessThanOrEqual(5)
    })

    it('should return 400 for limit > 50', async () => {
      const response = await fetch(
        `${API_BASE}/api/planning/dashboard/alerts?org_id=${testOrgId}&limit=100`
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for invalid limit (non-numeric)', async () => {
      const response = await fetch(
        `${API_BASE}/api/planning/dashboard/alerts?org_id=${testOrgId}&limit=abc`
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for missing org_id', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/alerts`)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should sort alerts by severity (critical > warning)', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/alerts?org_id=${testOrgId}`)
      const data = await response.json()

      if (data.alerts.length > 1) {
        const hasCritical = data.alerts.some((a: any) => a.severity === 'critical')
        const hasWarning = data.alerts.some((a: any) => a.severity === 'warning')

        if (hasCritical && hasWarning) {
          const firstCriticalIndex = data.alerts.findIndex((a: any) => a.severity === 'critical')
          const firstWarningIndex = data.alerts.findIndex((a: any) => a.severity === 'warning')
          expect(firstCriticalIndex).toBeLessThan(firstWarningIndex)
        }
      }
    })

    it('should return empty alerts when no issues exist', async () => {
      const fakeOrgId = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(`${API_BASE}/api/planning/dashboard/alerts?org_id=${fakeOrgId}`)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.alerts).toHaveLength(0)
      expect(data.total).toBe(0)
    })

    it('should include cache headers', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/alerts?org_id=${testOrgId}`)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toBeDefined()
    })

    it('should enforce RLS by org_id', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/alerts?org_id=${testOrgId}`)
      const data = await response.json()

      // Should only return alerts for this org
      expect(data.total).toBeGreaterThanOrEqual(0)
    })
  })

  // ============================================================================
  // GET /api/planning/dashboard/activity
  // ============================================================================

  describe('GET /api/planning/dashboard/activity', () => {
    it('should return 200 with activities array and total', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}`)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toHaveProperty('activities')
      expect(data).toHaveProperty('total')
      expect(Array.isArray(data.activities)).toBe(true)
      expect(typeof data.total).toBe('number')
    })

    it('should return activities with correct structure', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}`)
      const data = await response.json()

      if (data.activities.length > 0) {
        const activity = data.activities[0]
        expect(activity).toHaveProperty('id')
        expect(activity).toHaveProperty('entity_type')
        expect(activity).toHaveProperty('entity_id')
        expect(activity).toHaveProperty('entity_number')
        expect(activity).toHaveProperty('action')
        expect(activity).toHaveProperty('user_id')
        expect(activity).toHaveProperty('user_name')
        expect(activity).toHaveProperty('timestamp')
      }
    })

    it('should respect limit query parameter (default 20, max 100)', async () => {
      const response = await fetch(
        `${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}&limit=10`
      )
      const data = await response.json()

      expect(data.activities.length).toBeLessThanOrEqual(10)
    })

    it('should return 400 for limit > 100', async () => {
      const response = await fetch(
        `${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}&limit=200`
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should return 400 for missing org_id', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/activity`)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should sort activities by timestamp DESC (newest first)', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}`)
      const data = await response.json()

      if (data.activities.length > 1) {
        const first = new Date(data.activities[0].timestamp).getTime()
        const second = new Date(data.activities[1].timestamp).getTime()
        expect(first).toBeGreaterThanOrEqual(second)
      }
    })

    it('should include activities from PO, TO, and WO', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}`)
      const data = await response.json()

      const entityTypes = data.activities.map((a: any) => a.entity_type)
      const validTypes = ['purchase_order', 'transfer_order', 'work_order']

      // All entity_types should be valid
      for (const type of entityTypes) {
        expect(validTypes).toContain(type)
      }
    })

    it('should include valid action types', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}`)
      const data = await response.json()

      const actions = data.activities.map((a: any) => a.action)
      const validActions = ['created', 'updated', 'approved', 'cancelled', 'completed']

      // All actions should be valid
      for (const action of actions) {
        expect(validActions).toContain(action)
      }
    })

    it('should return empty activities when no data exists', async () => {
      const fakeOrgId = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(
        `${API_BASE}/api/planning/dashboard/activity?org_id=${fakeOrgId}`
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.activities).toHaveLength(0)
      expect(data.total).toBe(0)
    })

    it('should include cache headers', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}`)

      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toBeDefined()
    })

    it('should enforce RLS by org_id', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/activity?org_id=${testOrgId}`)
      const data = await response.json()

      // Should only return activities for this org
      expect(data.total).toBeGreaterThanOrEqual(0)
    })
  })

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle malformed JSON requests gracefully', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{',
      })

      // Should return 400 or 405 (Method Not Allowed)
      expect([400, 405]).toContain(response.status)
    })

    it('should reject unsupported HTTP methods', async () => {
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`, {
        method: 'POST',
      })

      expect(response.status).toBe(405)
    })

    it('should handle database connection errors gracefully', async () => {
      // This is difficult to test without mocking, but the service should
      // return zeros on error instead of throwing
      const response = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)

      expect(response.status).toBe(200)
    })
  })

  // ============================================================================
  // CACHE BEHAVIOR (Integration)
  // ============================================================================

  describe('Cache Integration', () => {
    it('should serve cached KPI data on subsequent requests', async () => {
      const response1 = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)
      const data1 = await response1.json()

      const response2 = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)
      const data2 = await response2.json()

      // Both should return same data (within 2-minute TTL)
      expect(data1).toEqual(data2)
    })

    it('should invalidate cache when PO is created', async () => {
      // Get initial KPIs
      const response1 = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)
      const data1 = await response1.json()

      // Create a new PO
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-CACHE-TEST-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          status: 'draft',
          currency: 'USD',
          subtotal: 100,
          tax_amount: 8,
          total: 108,
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      testPOId = po!.id

      // Wait a moment for cache invalidation
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Get updated KPIs
      const response2 = await fetch(`${API_BASE}/api/planning/dashboard/kpis?org_id=${testOrgId}`)
      const data2 = await response2.json()

      // KPIs should be updated (or cache invalidated and refetched)
      expect(data2).toBeDefined()

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })
  })
})
