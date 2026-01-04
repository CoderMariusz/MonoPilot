/**
 * Purchase Order Approval Workflow API Tests
 * Story: 03.5b - PO Approval Workflow (Submit/Approve/Reject)
 *
 * Tests the approval workflow API endpoints:
 * - POST /api/planning/purchase-orders/:id/submit
 * - POST /api/planning/purchase-orders/:id/approve
 * - POST /api/planning/purchase-orders/:id/reject
 * - GET /api/planning/purchase-orders/:id/approval-history
 *
 * These tests verify the HTTP layer, request/response handling,
 * and integration between routes and service layer.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const testOrgId = process.env.TEST_ORG_ID!
const testUserId = '0684a3ca-4456-492f-b360-10458993de45' // Test user (planner role)
const testManagerId = '0684a3ca-4456-492f-b360-10458993de45' // Manager user for approval (same as planner for now)
const testAdminId = '0684a3ca-4456-492f-b360-10458993de45' // Admin user for approval (same as planner for now)

let testPOId: string
let testSupplierId: string
let testWarehouseId: string
let testProductId: string

describe('POST /api/planning/purchase-orders/:id/submit', () => {
  beforeAll(async () => {
    // Setup test data - supplier, warehouse, product
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('org_id', testOrgId)
      .eq('is_active', true)
      .limit(1)
      .single()
    testSupplierId = supplier!.id

    const { data: warehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('org_id', testOrgId)
      .eq('is_active', true)
      .limit(1)
      .single()
    testWarehouseId = warehouse!.id

    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('org_id', testOrgId)
      .eq('is_active', true)
      .limit(1)
      .single()
    testProductId = product!.id
  })

  beforeEach(async () => {
    // Create fresh PO for each test
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data: po } = await supabase
      .from('purchase_orders')
      .insert({
        org_id: testOrgId,
        po_number: `PO-TEST-${Date.now()}`,
        supplier_id: testSupplierId,
        warehouse_id: testWarehouseId,
        expected_delivery_date: tomorrow,
        status: 'draft',
        currency: 'USD',
        subtotal: 15000,
        tax_amount: 0,
        total: 15000, // Above threshold
        created_by: testUserId,
        updated_by: testUserId,
      })
      .select()
      .single()
    testPOId = po!.id

    // Add at least one line
    await supabase.from('purchase_order_lines').insert({
      po_id: testPOId,
      line_number: 1,
      product_id: testProductId,
      quantity: 100,
      uom: 'kg',
      unit_price: 150,
      line_total: 15000,
      received_qty: 0,
    })
  })

  afterAll(async () => {
    // Cleanup
    if (testPOId) {
      await supabase.from('purchase_order_lines').delete().eq('po_id', testPOId)
      await supabase.from('purchase_orders').delete().eq('id', testPOId)
    }
  })

  it('should submit PO below threshold directly to submitted status', async () => {
    // Test case: AC-01 - Submit below threshold
    // Update PO total to be below threshold ($10,000)
    await supabase
      .from('purchase_orders')
      .update({ total: 5000, subtotal: 5000 })
      .eq('id', testPOId)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('submitted')
    expect(data.approvalRequired).toBe(false)
    expect(data.notificationSent).toBe(false)

    // Verify PO status updated
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('status, approval_status')
      .eq('id', testPOId)
      .single()

    expect(po!.status).toBe('submitted')
    expect(po!.approval_status).toBeNull()
  })

  it('should submit PO above threshold to pending_approval status', async () => {
    // Test case: AC-02 - Submit above threshold
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('pending_approval')
    expect(data.approvalRequired).toBe(true)
    expect(data.notificationSent).toBe(true)
    expect(data.notificationCount).toBeGreaterThan(0)

    // Verify PO status updated
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('status, approval_status')
      .eq('id', testPOId)
      .single()

    expect(po!.status).toBe('pending_approval')
    expect(po!.approval_status).toBe('pending')
  })

  it('should create approval history record on submission', async () => {
    // Test case: AC-02 - History tracking
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    // Verify history record created
    const { data: history } = await supabase
      .from('po_approval_history')
      .select('*')
      .eq('po_id', testPOId)
      .eq('action', 'submitted')
      .single()

    expect(history).toBeDefined()
    expect(history!.user_id).toBe(testUserId)
    expect(history!.action).toBe('submitted')
  })

  it('should return 400 if PO not in draft status', async () => {
    // Test case: AC-04 - Invalid status
    await supabase
      .from('purchase_orders')
      .update({ status: 'submitted' })
      .eq('id', testPOId)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('draft status')
  })

  it('should return 400 if PO has no lines', async () => {
    // Test case: AC-04 - Validation error
    await supabase.from('purchase_order_lines').delete().eq('po_id', testPOId)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('at least one line item')
  })

  it('should return 404 if PO not found', async () => {
    // Test case: Error handling
    const fakeId = '00000000-0000-0000-0000-000000000000'

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${fakeId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(404)
  })

  it('should complete within 300ms (performance)', async () => {
    // Test case: AC-09 - Performance requirement
    const start = performance.now()

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    const duration = performance.now() - start
    expect(duration).toBeLessThan(300)
  })
})

describe('POST /api/planning/purchase-orders/:id/approve', () => {
  beforeEach(async () => {
    // Create PO in pending_approval status
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data: po } = await supabase
      .from('purchase_orders')
      .insert({
        org_id: testOrgId,
        po_number: `PO-TEST-${Date.now()}`,
        supplier_id: testSupplierId,
        warehouse_id: testWarehouseId,
        expected_delivery_date: tomorrow,
        status: 'pending_approval',
        approval_status: 'pending',
        currency: 'USD',
        subtotal: 15000,
        tax_amount: 0,
        total: 15000,
        created_by: testUserId,
        updated_by: testUserId,
      })
      .select()
      .single()
    testPOId = po!.id
  })

  it('should approve PO successfully with notes', async () => {
    // Test case: AC-05 - Approve with notes
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_MANAGER_TOKEN}`,
        },
        body: JSON.stringify({
          notes: 'Approved for Q4 stock replenishment. Good pricing.',
        }),
      }
    )

    expect(response.status).toBe(200)

    // Verify PO updated
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('status, approval_status, approved_by, approved_at, approval_notes')
      .eq('id', testPOId)
      .single()

    expect(po!.status).toBe('approved')
    expect(po!.approval_status).toBe('approved')
    expect(po!.approved_by).toBe(testManagerId)
    expect(po!.approved_at).toBeDefined()
    expect(po!.approval_notes).toBe('Approved for Q4 stock replenishment. Good pricing.')
  })

  it('should approve PO without notes (optional)', async () => {
    // Test case: AC-05 - Notes optional
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_MANAGER_TOKEN}`,
        },
        body: JSON.stringify({}),
      }
    )

    expect(response.status).toBe(200)

    const { data: po } = await supabase
      .from('purchase_orders')
      .select('approval_notes')
      .eq('id', testPOId)
      .single()

    expect(po!.approval_notes).toBeNull()
  })

  it('should create approval history record', async () => {
    // Test case: AC-05 - History tracking
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_MANAGER_TOKEN}`,
        },
        body: JSON.stringify({
          notes: 'Budget approved',
        }),
      }
    )

    const { data: history } = await supabase
      .from('po_approval_history')
      .select('*')
      .eq('po_id', testPOId)
      .eq('action', 'approved')
      .single()

    expect(history).toBeDefined()
    expect(history!.user_id).toBe(testManagerId)
    expect(history!.action).toBe('approved')
    expect(history!.notes).toBe('Budget approved')
  })

  it('should return 403 if user lacks approval permission', async () => {
    // Test case: AC-06 - Permission denied
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`, // Planner, not approver
        },
        body: JSON.stringify({}),
      }
    )

    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.error).toContain('permission')
  })

  it('should return 400 if PO not in pending_approval status', async () => {
    // Test case: AC-06 - Wrong status
    await supabase
      .from('purchase_orders')
      .update({ status: 'draft' })
      .eq('id', testPOId)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_MANAGER_TOKEN}`,
        },
        body: JSON.stringify({}),
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('pending approval status')
  })

  it('should return 400 if notes exceed 1000 characters', async () => {
    // Test case: Validation - Max length
    const longNotes = 'x'.repeat(1001)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_MANAGER_TOKEN}`,
        },
        body: JSON.stringify({
          notes: longNotes,
        }),
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('1000')
  })

  it('should handle concurrent approval attempts', async () => {
    // Test case: RISK-01 - Race condition
    // Approve once
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_MANAGER_TOKEN}`,
        },
        body: JSON.stringify({}),
      }
    )

    // Try to approve again
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({}),
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('already been approved')
  })

  it('should complete within 500ms (performance)', async () => {
    // Test case: AC-09 - Performance requirement
    const start = performance.now()

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_MANAGER_TOKEN}`,
        },
        body: JSON.stringify({}),
      }
    )

    const duration = performance.now() - start
    expect(duration).toBeLessThan(500)
  })
})

describe('POST /api/planning/purchase-orders/:id/reject', () => {
  beforeEach(async () => {
    // Create PO in pending_approval status
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data: po } = await supabase
      .from('purchase_orders')
      .insert({
        org_id: testOrgId,
        po_number: `PO-TEST-${Date.now()}`,
        supplier_id: testSupplierId,
        warehouse_id: testWarehouseId,
        expected_delivery_date: tomorrow,
        status: 'pending_approval',
        approval_status: 'pending',
        currency: 'USD',
        subtotal: 15000,
        tax_amount: 0,
        total: 15000,
        created_by: testUserId,
        updated_by: testUserId,
      })
      .select()
      .single()
    testPOId = po!.id
  })

  it('should reject PO with reason', async () => {
    // Test case: AC-07 - Reject with reason
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          rejection_reason: 'Exceeds quarterly budget. Please reduce quantity or defer to Q2.',
        }),
      }
    )

    expect(response.status).toBe(200)

    // Verify PO updated
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('status, approval_status, approved_by, approved_at, approval_notes, rejection_reason')
      .eq('id', testPOId)
      .single()

    expect(po!.status).toBe('rejected')
    expect(po!.approval_status).toBe('rejected')
    expect(po!.approved_by).toBe(testAdminId)
    expect(po!.approved_at).toBeDefined()
    expect(po!.rejection_reason).toBe('Exceeds quarterly budget. Please reduce quantity or defer to Q2.')
  })

  it('should create approval history record with rejection', async () => {
    // Test case: AC-07 - History tracking
    const reason = 'Budget exceeded by 30%'

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          rejection_reason: reason,
        }),
      }
    )

    const { data: history } = await supabase
      .from('po_approval_history')
      .select('*')
      .eq('po_id', testPOId)
      .eq('action', 'rejected')
      .single()

    expect(history).toBeDefined()
    expect(history!.user_id).toBe(testAdminId)
    expect(history!.action).toBe('rejected')
    expect(history!.notes).toBe(reason)
  })

  it('should return 400 if rejection reason missing', async () => {
    // Test case: AC-08 - Reason required
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({}),
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('required')
  })

  it('should return 400 if rejection reason less than 10 chars', async () => {
    // Test case: AC-09 - Min length
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          rejection_reason: 'Too short', // 9 chars
        }),
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('10')
  })

  it('should return 400 if rejection reason exceeds 1000 chars', async () => {
    // Test case: Validation - Max length
    const longReason = 'x'.repeat(1001)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          rejection_reason: longReason,
        }),
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('1000')
  })

  it('should return 403 if user lacks approval permission', async () => {
    // Test case: AC-07 - Permission denied
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`, // Planner, not approver
        },
        body: JSON.stringify({
          rejection_reason: 'Budget exceeded significantly',
        }),
      }
    )

    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.error).toContain('permission')
  })

  it('should return 400 if PO not in pending_approval status', async () => {
    // Test case: AC-07 - Wrong status
    await supabase
      .from('purchase_orders')
      .update({ status: 'draft' })
      .eq('id', testPOId)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          rejection_reason: 'Budget exceeded significantly',
        }),
      }
    )

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('pending approval status')
  })

  it('should preserve rejection reason exactly as provided', async () => {
    // Test case: AC-07 - Accuracy
    const reason =
      'Quantity too high for current inventory capacity. Please reduce to 500kg Sugar White and 250kg Brown.'

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          rejection_reason: reason,
        }),
      }
    )

    const { data: po } = await supabase
      .from('purchase_orders')
      .select('rejection_reason')
      .eq('id', testPOId)
      .single()

    expect(po!.rejection_reason).toBe(reason)
  })
})

describe('GET /api/planning/purchase-orders/:id/approval-history', () => {
  beforeEach(async () => {
    // Create PO with approval history
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data: po } = await supabase
      .from('purchase_orders')
      .insert({
        org_id: testOrgId,
        po_number: `PO-TEST-${Date.now()}`,
        supplier_id: testSupplierId,
        warehouse_id: testWarehouseId,
        expected_delivery_date: tomorrow,
        status: 'approved',
        approval_status: 'approved',
        currency: 'USD',
        subtotal: 15000,
        tax_amount: 0,
        total: 15000,
        created_by: testUserId,
        updated_by: testUserId,
      })
      .select()
      .single()
    testPOId = po!.id

    // Add history records
    await supabase.from('po_approval_history').insert([
      {
        org_id: testOrgId,
        po_id: testPOId,
        action: 'submitted',
        user_id: testUserId,
        user_name: 'John Doe',
        user_role: 'planner',
        notes: null,
      },
      {
        org_id: testOrgId,
        po_id: testPOId,
        action: 'approved',
        user_id: testManagerId,
        user_name: 'Jane Manager',
        user_role: 'manager',
        notes: 'Budget approved by finance team',
      },
    ])
  })

  it('should return approval history sorted by timestamp desc', async () => {
    // Test case: AC-04 - History display
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approval-history`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.history).toBeInstanceOf(Array)
    expect(data.history.length).toBe(2)

    // Check sorted descending (newest first)
    const timestamps = data.history.map((h: any) => new Date(h.created_at).getTime())
    expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1])

    // Check structure
    expect(data.history[0]).toHaveProperty('id')
    expect(data.history[0]).toHaveProperty('action')
    expect(data.history[0]).toHaveProperty('user_name')
    expect(data.history[0]).toHaveProperty('user_role')
    expect(data.history[0]).toHaveProperty('notes')
    expect(data.history[0]).toHaveProperty('created_at')
  })

  it('should return empty array if no history', async () => {
    // Test case: Edge case - No history
    await supabase.from('po_approval_history').delete().eq('po_id', testPOId)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approval-history`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.history).toEqual([])
  })

  it('should support pagination', async () => {
    // Test case: AC-09 - Pagination
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approval-history?page=1&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.history.length).toBe(1)
    expect(data.pagination).toHaveProperty('page', 1)
    expect(data.pagination).toHaveProperty('limit', 1)
    expect(data.pagination).toHaveProperty('total', 2)
    expect(data.pagination).toHaveProperty('total_pages', 2)
  })

  it('should enforce org_id RLS isolation', async () => {
    // Test case: Multi-tenancy
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approval-history`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_DIFFERENT_ORG_TOKEN}`,
        },
      }
    )

    // Should return 404 (not 403) per security best practice
    expect(response.status).toBe(404)
  })

  it('should return 404 if PO not found', async () => {
    // Test case: Error handling
    const fakeId = '00000000-0000-0000-0000-000000000000'

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${fakeId}/approval-history`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    expect(response.status).toBe(404)
  })

  it('should load within 200ms (performance)', async () => {
    // Test case: AC-09 - Performance requirement
    const start = performance.now()

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/planning/purchase-orders/${testPOId}/approval-history`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_USER_TOKEN}`,
        },
      }
    )

    const duration = performance.now() - start
    expect(duration).toBeLessThan(200)
  })
})
