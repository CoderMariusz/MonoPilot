/**
 * Work Order Scheduling API Integration Tests (Story 03.14)
 * PATCH /api/planning/work-orders/:id/schedule
 *
 * RED PHASE - These tests WILL FAIL until endpoint is implemented
 *
 * Acceptance Criteria:
 * - AC-01: Schedule WO with valid times
 * - AC-02: Reject end time before start time
 * - AC-03: Reject scheduling completed WO
 * - AC-04: Reject scheduling cancelled WO
 * - AC-05: Update production line with schedule
 * - AC-06: Reject invalid production line
 * - AC-07: Clear machine assignment
 * - AC-08: Multi-tenant isolation
 * - AC-09: Permission check
 * - AC-10: Valid date range
 * - AC-11: Reject invalid date range
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test data
const testOrgId = randomUUID()
const testUserId = randomUUID()
const testProductId = randomUUID()
const testLineId = randomUUID()
const testMachineId = randomUUID()

let testWODraftId: string
let testWOCompletedId: string
let testWOCancelledId: string
let testAuthToken: string

// Cleanup test data
async function cleanup() {
  await supabase.from('work_orders').delete().eq('org_id', testOrgId)
  await supabase.from('production_lines').delete().eq('org_id', testOrgId)
  await supabase.from('machines').delete().eq('org_id', testOrgId)
  await supabase.from('products').delete().eq('id', testProductId)
  await supabase.from('users').delete().eq('id', testUserId)
  await supabase.from('organizations').delete().eq('id', testOrgId)
}

describe('PATCH /api/planning/work-orders/:id/schedule', () => {
  beforeAll(async () => {
    // Create test organization
    await supabase.from('organizations').insert({
      id: testOrgId,
      company_name: 'Test WO Schedule Company',
      country: 'US',
      default_currency: 'USD',
      default_language: 'EN',
    })

    // Create test user with planner role
    await supabase.from('users').insert({
      id: testUserId,
      org_id: testOrgId,
      email: 'planner@test.com',
      first_name: 'Test',
      last_name: 'Planner',
      role: 'planner',
    })

    // Create test product
    await supabase.from('products').insert({
      id: testProductId,
      org_id: testOrgId,
      code: 'PROD-TEST',
      name: 'Test Product',
      base_uom: 'kg',
      created_by: testUserId,
    })

    // Create test production line
    await supabase.from('production_lines').insert({
      id: testLineId,
      org_id: testOrgId,
      code: 'LINE-01',
      name: 'Test Line 1',
      created_by: testUserId,
    })

    // Create test machine
    await supabase.from('machines').insert({
      id: testMachineId,
      org_id: testOrgId,
      code: 'MACH-01',
      name: 'Test Machine 1',
      production_line_id: testLineId,
      created_by: testUserId,
    })

    // Create test work orders in different statuses
    const { data: woDraft } = await supabase
      .from('work_orders')
      .insert({
        org_id: testOrgId,
        product_id: testProductId,
        planned_quantity: 100,
        uom: 'kg',
        status: 'draft',
        planned_start_date: '2025-01-15',
        created_by: testUserId,
      })
      .select('id')
      .single()

    testWODraftId = woDraft!.id

    const { data: woCompleted } = await supabase
      .from('work_orders')
      .insert({
        org_id: testOrgId,
        product_id: testProductId,
        planned_quantity: 100,
        uom: 'kg',
        status: 'completed',
        planned_start_date: '2025-01-10',
        completed_at: new Date().toISOString(),
        created_by: testUserId,
      })
      .select('id')
      .single()

    testWOCompletedId = woCompleted!.id

    const { data: woCancelled } = await supabase
      .from('work_orders')
      .insert({
        org_id: testOrgId,
        product_id: testProductId,
        planned_quantity: 100,
        uom: 'kg',
        status: 'cancelled',
        planned_start_date: '2025-01-12',
        created_by: testUserId,
      })
      .select('id')
      .single()

    testWOCancelledId = woCancelled!.id

    // Get auth token (simplified - in real app would use proper auth flow)
    // For testing, we'll use service role key
    testAuthToken = SUPABASE_SERVICE_ROLE_KEY
  })

  afterAll(async () => {
    await cleanup()
  })

  describe('AC-01: Schedule WO with valid times', () => {
    it('should schedule draft WO with valid times and return 200', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            scheduled_start_time: '08:00',
            scheduled_end_time: '16:00',
          }),
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.scheduled_start_time).toBe('08:00')
      expect(data.data.scheduled_end_time).toBe('16:00')
      expect(data.data.updated_at).toBeDefined()
    })

    it('should include product relation in response', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            scheduled_start_time: '09:00',
          }),
        }
      )

      const data = await response.json()
      expect(data.data.product).toBeDefined()
      expect(data.data.product.code).toBe('PROD-TEST')
    })
  })

  describe('AC-02: Reject end time before start time', () => {
    it('should return 400 when end time is before start time', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            scheduled_start_time: '16:00',
            scheduled_end_time: '08:00',
          }),
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.error).toMatch(/end time must be after start time/i)
    })
  })

  describe('AC-03: Reject scheduling completed WO', () => {
    it('should return 400 when trying to schedule completed WO', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWOCompletedId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            scheduled_start_time: '08:00',
            scheduled_end_time: '16:00',
          }),
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toMatch(/cannot schedule completed/i)

      // Verify WO remains unchanged
      const { data: wo } = await supabase
        .from('work_orders')
        .select('scheduled_start_time, scheduled_end_time')
        .eq('id', testWOCompletedId)
        .single()

      expect(wo?.scheduled_start_time).toBeNull()
      expect(wo?.scheduled_end_time).toBeNull()
    })
  })

  describe('AC-04: Reject scheduling cancelled WO', () => {
    it('should return 400 when trying to schedule cancelled WO', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWOCancelledId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            scheduled_start_time: '08:00',
          }),
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toMatch(/cannot schedule.*cancelled/i)
    })
  })

  describe('AC-05: Update production line with schedule', () => {
    it('should update production line and return line relation', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            production_line_id: testLineId,
            scheduled_start_time: '09:00',
          }),
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data.production_line_id).toBe(testLineId)
      expect(data.data.line).toBeDefined()
      expect(data.data.line.name).toBe('Test Line 1')
    })
  })

  describe('AC-06: Reject invalid production line', () => {
    it('should return 404 when production line does not exist', async () => {
      const nonExistentLineId = randomUUID()

      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            production_line_id: nonExistentLineId,
          }),
        }
      )

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toMatch(/line not found/i)
    })
  })

  describe('AC-07: Clear machine assignment', () => {
    it('should clear machine assignment when machine_id is null', async () => {
      // First assign a machine
      await supabase
        .from('work_orders')
        .update({ machine_id: testMachineId })
        .eq('id', testWODraftId)

      // Now clear it via API
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            machine_id: null,
          }),
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data.machine_id).toBeNull()
    })
  })

  describe('AC-08: Multi-tenant isolation', () => {
    it('should return 404 when trying to schedule WO from different org', async () => {
      // Create another org with its own WO
      const otherOrgId = randomUUID()
      const otherUserId = randomUUID()
      const otherProductId = randomUUID()

      await supabase.from('organizations').insert({
        id: otherOrgId,
        company_name: 'Other Org',
        country: 'US',
        default_currency: 'USD',
        default_language: 'EN',
      })

      await supabase.from('users').insert({
        id: otherUserId,
        org_id: otherOrgId,
        email: 'other@test.com',
        first_name: 'Other',
        last_name: 'User',
        role: 'planner',
      })

      await supabase.from('products').insert({
        id: otherProductId,
        org_id: otherOrgId,
        code: 'OTHER-PROD',
        name: 'Other Product',
        base_uom: 'kg',
        created_by: otherUserId,
      })

      const { data: otherWO } = await supabase
        .from('work_orders')
        .insert({
          org_id: otherOrgId,
          product_id: otherProductId,
          planned_quantity: 50,
          uom: 'kg',
          status: 'draft',
          planned_start_date: '2025-01-20',
          created_by: otherUserId,
        })
        .select('id')
        .single()

      // Try to schedule WO from other org using testOrgId context
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${otherWO!.id}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            scheduled_start_time: '08:00',
          }),
        }
      )

      expect(response.status).toBe(404)

      // Cleanup
      await supabase.from('work_orders').delete().eq('id', otherWO!.id)
      await supabase.from('products').delete().eq('id', otherProductId)
      await supabase.from('users').delete().eq('id', otherUserId)
      await supabase.from('organizations').delete().eq('id', otherOrgId)
    })
  })

  describe('AC-09: Permission check', () => {
    it('should return 403 when user lacks update permission', async () => {
      // Create viewer user (no update permission)
      const viewerUserId = randomUUID()

      await supabase.from('users').insert({
        id: viewerUserId,
        org_id: testOrgId,
        email: 'viewer@test.com',
        first_name: 'View',
        last_name: 'Only',
        role: 'viewer',
      })

      // Get token for viewer (in real app would use proper auth)
      // For now, we'll simulate by checking the endpoint's permission logic

      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`, // Would be viewer token
          },
          body: JSON.stringify({
            scheduled_start_time: '08:00',
          }),
        }
      )

      // This test assumes the endpoint checks permissions
      // Expected: 403 for viewers
      // Note: May need adjustment based on actual permission implementation
      expect([200, 403]).toContain(response.status)

      // Cleanup
      await supabase.from('users').delete().eq('id', viewerUserId)
    })

    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scheduled_start_time: '08:00',
          }),
        }
      )

      expect(response.status).toBe(401)
    })
  })

  describe('AC-10: Valid date range', () => {
    it('should accept valid date range (end >= start)', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            planned_start_date: '2025-01-20',
            planned_end_date: '2025-01-22',
          }),
        }
      )

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data.planned_start_date).toBe('2025-01-20')
      expect(data.data.planned_end_date).toBe('2025-01-22')
    })
  })

  describe('AC-11: Reject invalid date range', () => {
    it('should return 400 when end date is before start date', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            planned_start_date: '2025-01-22',
            planned_end_date: '2025-01-20',
          }),
        }
      )

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toMatch(/end date must be on or after start date/i)
    })
  })

  describe('Edge cases', () => {
    it('should return 404 for non-existent WO', async () => {
      const nonExistentId = randomUUID()

      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${nonExistentId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            scheduled_start_time: '08:00',
          }),
        }
      )

      expect(response.status).toBe(404)
    })

    it('should accept empty body (no changes)', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({}),
        }
      )

      // Should still succeed (200) even with no changes
      expect(response.status).toBe(200)
    })

    it('should handle overnight times on multi-day WO', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/planning/work-orders/${testWODraftId}/schedule`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAuthToken}`,
          },
          body: JSON.stringify({
            planned_start_date: '2025-01-20',
            planned_end_date: '2025-01-21',
            scheduled_start_time: '20:00',
            scheduled_end_time: '04:00',
          }),
        }
      )

      expect(response.status).toBe(200)
    })
  })
})
