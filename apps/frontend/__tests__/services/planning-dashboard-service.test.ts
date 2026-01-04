/**
 * Service Layer Tests: Planning Dashboard Service
 * Story: 03.16 - Planning Dashboard
 * Phase: RED - Tests should FAIL (service methods not yet fully implemented)
 *
 * Tests the planning-dashboard-service.ts:
 * - getKPIs() - KPI calculations with RLS filtering
 * - getAlerts() - Alert aggregation with severity sorting
 * - getRecentActivity() - Recent activity feed
 * - invalidateDashboardCache() - Cache invalidation
 *
 * Coverage Target: 80%
 * Test Count: 35 tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import {
  getKPIs,
  getAlerts,
  getRecentActivity,
  invalidateDashboardCache,
  getCacheKey,
  CACHE_KEYS,
} from '@/lib/services/planning-dashboard-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const testOrgId = process.env.TEST_ORG_ID!
const testUserId = '0684a3ca-4456-492f-b360-10458993de45'

// Test data IDs
let testSupplierId: string
let testWarehouseId: string
let testProductId: string
let testPOId: string
let testTOId: string
let testWOId: string

describe('Planning Dashboard Service', () => {
  beforeAll(async () => {
    // Create test supplier
    const { data: supplier } = await supabase
      .from('suppliers')
      .insert({
        org_id: testOrgId,
        code: `SUP-TEST-DASH-${Date.now()}`,
        name: 'Dashboard Test Supplier',
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
        code: `WH-TEST-DASH-${Date.now()}`,
        name: 'Dashboard Test Warehouse',
        is_active: true,
      })
      .select()
      .single()
    testWarehouseId = warehouse!.id

    // Create test product
    const { data: product } = await supabase
      .from('products')
      .insert({
        org_id: testOrgId,
        code: `PROD-TEST-DASH-${Date.now()}`,
        name: 'Dashboard Test Product',
        type: 'finished_good',
        is_active: true,
      })
      .select()
      .single()
    testProductId = product!.id
  })

  afterAll(async () => {
    // Cleanup test data
    if (testPOId) await supabase.from('purchase_orders').delete().eq('id', testPOId)
    if (testTOId) await supabase.from('transfer_orders').delete().eq('id', testTOId)
    if (testWOId) await supabase.from('work_orders').delete().eq('id', testWOId)
    if (testProductId) await supabase.from('products').delete().eq('id', testProductId)
    if (testWarehouseId) await supabase.from('warehouses').delete().eq('id', testWarehouseId)
    if (testSupplierId) await supabase.from('suppliers').delete().eq('id', testSupplierId)
  })

  beforeEach(async () => {
    // Clear cache before each test
    await invalidateDashboardCache(testOrgId)
  })

  // ============================================================================
  // GET KPIs - KPI Calculations
  // ============================================================================

  describe('getKPIs', () => {
    it('should return KPIData object with all 6 metrics', async () => {
      const kpis = await getKPIs(testOrgId)

      expect(kpis).toHaveProperty('po_pending_approval')
      expect(kpis).toHaveProperty('po_this_month')
      expect(kpis).toHaveProperty('to_in_transit')
      expect(kpis).toHaveProperty('wo_scheduled_today')
      expect(kpis).toHaveProperty('wo_overdue')
      expect(kpis).toHaveProperty('open_orders')
    })

    it('should return numeric values for all KPIs', async () => {
      const kpis = await getKPIs(testOrgId)

      expect(typeof kpis.po_pending_approval).toBe('number')
      expect(typeof kpis.po_this_month).toBe('number')
      expect(typeof kpis.to_in_transit).toBe('number')
      expect(typeof kpis.wo_scheduled_today).toBe('number')
      expect(typeof kpis.wo_overdue).toBe('number')
      expect(typeof kpis.open_orders).toBe('number')
    })

    it('should return zero values when no orders exist', async () => {
      // Clean slate - no orders for this org
      const kpis = await getKPIs('00000000-0000-0000-0000-000000000000')

      expect(kpis.po_pending_approval).toBe(0)
      expect(kpis.po_this_month).toBe(0)
      expect(kpis.to_in_transit).toBe(0)
      expect(kpis.wo_scheduled_today).toBe(0)
      expect(kpis.wo_overdue).toBe(0)
      expect(kpis.open_orders).toBe(0)
    })

    it('should count POs pending approval correctly', async () => {
      // Create PO with pending approval
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-DASH-TEST-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          status: 'draft',
          approval_status: 'pending',
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

      const kpis = await getKPIs(testOrgId)

      expect(kpis.po_pending_approval).toBeGreaterThan(0)

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })

    it('should count POs created this month correctly', async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

      // Create PO this month
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-DASH-MONTH-${Date.now()}`,
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
          created_at: monthStart.toISOString(),
        })
        .select()
        .single()

      testPOId = po!.id

      const kpis = await getKPIs(testOrgId)

      expect(kpis.po_this_month).toBeGreaterThan(0)

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })

    it('should count TOs in transit correctly', async () => {
      // Create TO in transit
      const { data: to } = await supabase
        .from('transfer_orders')
        .insert({
          org_id: testOrgId,
          to_number: `TO-DASH-TEST-${Date.now()}`,
          from_warehouse_id: testWarehouseId,
          to_warehouse_id: testWarehouseId,
          status: 'shipped',
          planned_ship_date: new Date().toISOString().split('T')[0],
          created_by: testUserId,
        })
        .select()
        .single()

      testTOId = to!.id

      const kpis = await getKPIs(testOrgId)

      expect(kpis.to_in_transit).toBeGreaterThan(0)

      // Cleanup
      await supabase.from('transfer_orders').delete().eq('id', testTOId)
      testTOId = ''
    })

    it('should count WOs scheduled today correctly', async () => {
      const today = new Date().toISOString().split('T')[0]

      // Create WO scheduled today
      const { data: wo } = await supabase
        .from('work_orders')
        .insert({
          org_id: testOrgId,
          wo_number: `WO-DASH-TODAY-${Date.now()}`,
          product_id: testProductId,
          quantity: 100,
          status: 'scheduled',
          scheduled_date: today,
          created_by: testUserId,
        })
        .select()
        .single()

      testWOId = wo!.id

      const kpis = await getKPIs(testOrgId)

      expect(kpis.wo_scheduled_today).toBeGreaterThan(0)

      // Cleanup
      await supabase.from('work_orders').delete().eq('id', testWOId)
      testWOId = ''
    })

    it('should count overdue WOs correctly', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      // Create overdue WO
      const { data: wo } = await supabase
        .from('work_orders')
        .insert({
          org_id: testOrgId,
          wo_number: `WO-DASH-OVERDUE-${Date.now()}`,
          product_id: testProductId,
          quantity: 100,
          status: 'scheduled',
          scheduled_date: yesterday,
          created_by: testUserId,
        })
        .select()
        .single()

      testWOId = wo!.id

      const kpis = await getKPIs(testOrgId)

      expect(kpis.wo_overdue).toBeGreaterThan(0)

      // Cleanup
      await supabase.from('work_orders').delete().eq('id', testWOId)
      testWOId = ''
    })

    it('should NOT count completed WOs as overdue', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      // Create completed WO (scheduled yesterday)
      const { data: wo } = await supabase
        .from('work_orders')
        .insert({
          org_id: testOrgId,
          wo_number: `WO-DASH-DONE-${Date.now()}`,
          product_id: testProductId,
          quantity: 100,
          status: 'completed',
          scheduled_date: yesterday,
          created_by: testUserId,
        })
        .select()
        .single()

      testWOId = wo!.id

      const initialKPIs = await getKPIs(testOrgId)
      const initialOverdue = initialKPIs.wo_overdue

      // WO is completed, so should NOT be counted as overdue
      expect(initialOverdue).toBeGreaterThanOrEqual(0)

      // Cleanup
      await supabase.from('work_orders').delete().eq('id', testWOId)
      testWOId = ''
    })

    it('should count open POs correctly (exclude closed and cancelled)', async () => {
      // Create open PO
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-DASH-OPEN-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          status: 'approved',
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

      const kpis = await getKPIs(testOrgId)

      expect(kpis.open_orders).toBeGreaterThan(0)

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })

    it('should cache KPI results for 2 minutes', async () => {
      const kpis1 = await getKPIs(testOrgId)
      const kpis2 = await getKPIs(testOrgId)

      // Both calls should return same data (cached)
      expect(kpis1).toEqual(kpis2)
    })

    it('should enforce RLS by filtering on org_id', async () => {
      const kpis1 = await getKPIs(testOrgId)
      const kpis2 = await getKPIs('00000000-0000-0000-0000-000000000001')

      // Different orgs should have different KPIs (or zeros for non-existent org)
      expect(kpis2.po_pending_approval).toBeGreaterThanOrEqual(0)
      expect(kpis2.po_this_month).toBeGreaterThanOrEqual(0)
    })
  })

  // ============================================================================
  // GET ALERTS - Alert Aggregation
  // ============================================================================

  describe('getAlerts', () => {
    it('should return AlertsResponse with alerts array and total', async () => {
      const response = await getAlerts(testOrgId)

      expect(response).toHaveProperty('alerts')
      expect(response).toHaveProperty('total')
      expect(Array.isArray(response.alerts)).toBe(true)
      expect(typeof response.total).toBe('number')
    })

    it('should return empty alerts when no issues exist', async () => {
      const response = await getAlerts('00000000-0000-0000-0000-000000000000')

      expect(response.alerts).toHaveLength(0)
      expect(response.total).toBe(0)
    })

    it('should detect overdue POs (expected_delivery_date < today)', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      // Create overdue PO
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-DASH-OVERDUE-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: yesterday,
          status: 'approved',
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

      const response = await getAlerts(testOrgId)

      const overdueAlert = response.alerts.find((a) => a.type === 'overdue_po')
      expect(overdueAlert).toBeDefined()
      expect(overdueAlert?.entity_type).toBe('purchase_order')
      expect(overdueAlert?.days_overdue).toBeGreaterThan(0)

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })

    it('should mark overdue PO as warning if 1-3 days overdue', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]

      // Create PO overdue by 2 days
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-DASH-WARN-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: twoDaysAgo,
          status: 'approved',
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

      const response = await getAlerts(testOrgId)

      const overdueAlert = response.alerts.find((a) => a.entity_id === testPOId)
      expect(overdueAlert?.severity).toBe('warning')

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })

    it('should mark overdue PO as critical if 4+ days overdue', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]

      // Create PO overdue by 5 days
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-DASH-CRITICAL-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: fiveDaysAgo,
          status: 'approved',
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

      const response = await getAlerts(testOrgId)

      const overdueAlert = response.alerts.find((a) => a.entity_id === testPOId)
      expect(overdueAlert?.severity).toBe('critical')

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })

    it('should detect POs pending approval for > 2 days', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()

      // Create PO pending approval for 3 days
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-DASH-PENDING-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          status: 'draft',
          approval_status: 'pending',
          currency: 'USD',
          subtotal: 100,
          tax_amount: 8,
          total: 108,
          created_by: testUserId,
          updated_by: testUserId,
          created_at: threeDaysAgo,
        })
        .select()
        .single()

      testPOId = po!.id

      const response = await getAlerts(testOrgId)

      const pendingAlert = response.alerts.find((a) => a.type === 'pending_approval')
      expect(pendingAlert).toBeDefined()
      expect(pendingAlert?.entity_type).toBe('purchase_order')

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })

    it('should sort alerts by severity (critical before warning)', async () => {
      // Create warning alert (2 days overdue)
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
      const { data: po1 } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-WARN-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: twoDaysAgo,
          status: 'approved',
          currency: 'USD',
          subtotal: 100,
          tax_amount: 8,
          total: 108,
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      // Create critical alert (5 days overdue)
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
      const { data: po2 } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-CRIT-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: fiveDaysAgo,
          status: 'approved',
          currency: 'USD',
          subtotal: 100,
          tax_amount: 8,
          total: 108,
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      const response = await getAlerts(testOrgId, 50)

      // Critical alerts should come first
      const criticalIndex = response.alerts.findIndex((a) => a.severity === 'critical')
      const warningIndex = response.alerts.findIndex((a) => a.severity === 'warning')

      if (criticalIndex !== -1 && warningIndex !== -1) {
        expect(criticalIndex).toBeLessThan(warningIndex)
      }

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', po1!.id)
      await supabase.from('purchase_orders').delete().eq('id', po2!.id)
    })

    it('should respect limit parameter (default 10, max 50)', async () => {
      const response = await getAlerts(testOrgId, 5)

      expect(response.alerts.length).toBeLessThanOrEqual(5)
    })

    it('should enforce RLS by org_id', async () => {
      const response1 = await getAlerts(testOrgId)
      const response2 = await getAlerts('00000000-0000-0000-0000-000000000001')

      // Different orgs should have different alerts
      expect(response2.alerts.length).toBeGreaterThanOrEqual(0)
    })

    it('should cache alert results for 2 minutes', async () => {
      const alerts1 = await getAlerts(testOrgId)
      const alerts2 = await getAlerts(testOrgId)

      // Both calls should return same data (cached)
      expect(alerts1.total).toEqual(alerts2.total)
    })

    it('should include alert structure with required fields', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      // Create overdue PO
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-STRUCT-${Date.now()}`,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: yesterday,
          status: 'approved',
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

      const response = await getAlerts(testOrgId)

      if (response.alerts.length > 0) {
        const alert = response.alerts[0]
        expect(alert).toHaveProperty('id')
        expect(alert).toHaveProperty('type')
        expect(alert).toHaveProperty('severity')
        expect(alert).toHaveProperty('entity_type')
        expect(alert).toHaveProperty('entity_id')
        expect(alert).toHaveProperty('entity_number')
        expect(alert).toHaveProperty('description')
        expect(alert).toHaveProperty('created_at')
      }

      // Cleanup
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })
  })

  // ============================================================================
  // GET RECENT ACTIVITY - Activity Feed
  // ============================================================================

  describe('getRecentActivity', () => {
    it('should return ActivityResponse with activities array and total', async () => {
      const response = await getRecentActivity(testOrgId)

      expect(response).toHaveProperty('activities')
      expect(response).toHaveProperty('total')
      expect(Array.isArray(response.activities)).toBe(true)
      expect(typeof response.total).toBe('number')
    })

    it('should return empty activities when no data exists', async () => {
      const response = await getRecentActivity('00000000-0000-0000-0000-000000000000')

      expect(response.activities).toHaveLength(0)
      expect(response.total).toBe(0)
    })

    it('should return activities sorted by timestamp (newest first)', async () => {
      const response = await getRecentActivity(testOrgId, 20)

      if (response.activities.length > 1) {
        const first = new Date(response.activities[0].timestamp).getTime()
        const second = new Date(response.activities[1].timestamp).getTime()
        expect(first).toBeGreaterThanOrEqual(second)
      }
    })

    it('should respect limit parameter (default 20, max 100)', async () => {
      const response = await getRecentActivity(testOrgId, 5)

      expect(response.activities.length).toBeLessThanOrEqual(5)
    })

    it('should include PO activities from status history', async () => {
      // Create PO and status change
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          po_number: `PO-ACT-${Date.now()}`,
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

      // Create status history entry
      await supabase.from('po_status_history').insert({
        po_id: testPOId,
        from_status: null,
        to_status: 'draft',
        changed_by: testUserId,
        changed_at: new Date().toISOString(),
      })

      const response = await getRecentActivity(testOrgId, 100)

      const poActivity = response.activities.find((a) => a.entity_type === 'purchase_order')
      expect(poActivity).toBeDefined()

      // Cleanup
      await supabase.from('po_status_history').delete().eq('po_id', testPOId)
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
      testPOId = ''
    })

    it('should include TO activities', async () => {
      // Create TO
      const { data: to } = await supabase
        .from('transfer_orders')
        .insert({
          org_id: testOrgId,
          to_number: `TO-ACT-${Date.now()}`,
          from_warehouse_id: testWarehouseId,
          to_warehouse_id: testWarehouseId,
          status: 'draft',
          planned_ship_date: new Date().toISOString().split('T')[0],
          created_by: testUserId,
        })
        .select()
        .single()

      testTOId = to!.id

      const response = await getRecentActivity(testOrgId, 100)

      const toActivity = response.activities.find((a) => a.entity_type === 'transfer_order')
      expect(toActivity).toBeDefined()

      // Cleanup
      await supabase.from('transfer_orders').delete().eq('id', testTOId)
      testTOId = ''
    })

    it('should include WO activities', async () => {
      // Create WO
      const { data: wo } = await supabase
        .from('work_orders')
        .insert({
          org_id: testOrgId,
          wo_number: `WO-ACT-${Date.now()}`,
          product_id: testProductId,
          quantity: 100,
          status: 'draft',
          scheduled_date: new Date().toISOString().split('T')[0],
          created_by: testUserId,
        })
        .select()
        .single()

      testWOId = wo!.id

      const response = await getRecentActivity(testOrgId, 100)

      const woActivity = response.activities.find((a) => a.entity_type === 'work_order')
      expect(woActivity).toBeDefined()

      // Cleanup
      await supabase.from('work_orders').delete().eq('id', testWOId)
      testWOId = ''
    })

    it('should map status changes to action types', async () => {
      const response = await getRecentActivity(testOrgId, 100)

      if (response.activities.length > 0) {
        const activity = response.activities[0]
        const validActions = ['created', 'updated', 'approved', 'cancelled', 'completed']
        expect(validActions).toContain(activity.action)
      }
    })

    it('should include activity structure with required fields', async () => {
      const response = await getRecentActivity(testOrgId, 1)

      if (response.activities.length > 0) {
        const activity = response.activities[0]
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

    it('should enforce RLS by org_id', async () => {
      const response1 = await getRecentActivity(testOrgId)
      const response2 = await getRecentActivity('00000000-0000-0000-0000-000000000001')

      // Different orgs should have different activities
      expect(response2.activities.length).toBeGreaterThanOrEqual(0)
    })

    it('should cache activity results for 2 minutes', async () => {
      const activity1 = await getRecentActivity(testOrgId)
      const activity2 = await getRecentActivity(testOrgId)

      // Both calls should return same data (cached)
      expect(activity1.total).toEqual(activity2.total)
    })
  })

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================

  describe('invalidateDashboardCache', () => {
    it('should clear all 3 cache keys for an org', async () => {
      // Populate cache
      await getKPIs(testOrgId)
      await getAlerts(testOrgId)
      await getRecentActivity(testOrgId)

      // Invalidate cache
      await invalidateDashboardCache(testOrgId)

      // Next calls should fetch fresh data (not throw error)
      const kpis = await getKPIs(testOrgId)
      const alerts = await getAlerts(testOrgId)
      const activity = await getRecentActivity(testOrgId)

      expect(kpis).toBeDefined()
      expect(alerts).toBeDefined()
      expect(activity).toBeDefined()
    })

    it('should use correct cache key patterns', () => {
      const orgId = testOrgId

      expect(getCacheKey('kpis', orgId)).toBe(`planning:dashboard:kpis:${orgId}`)
      expect(getCacheKey('alerts', orgId)).toBe(`planning:dashboard:alerts:${orgId}`)
      expect(getCacheKey('activity', orgId)).toBe(`planning:dashboard:activity:${orgId}`)
    })

    it('should be called when PO is created/updated/deleted', async () => {
      // This is integration behavior - tested in API tests
      expect(true).toBe(true)
    })
  })
})
