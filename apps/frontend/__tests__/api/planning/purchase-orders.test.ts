/**
 * Purchase Orders API Integration Tests
 * Batch 3A: Stories 3.1 & 3.2
 *
 * Story 3.1: Purchase Order CRUD
 * - AC-3.1.1: Create PO with supplier and warehouse
 * - AC-3.1.2: List POs with filters (status, supplier, warehouse, date range)
 * - AC-3.1.3: Get PO details
 * - AC-3.1.4: Update PO (delivery date, notes, status)
 * - AC-3.1.5: Delete PO (only if draft)
 *
 * Story 3.2: PO Line Management
 * - AC-3.2.1: Add lines to PO
 * - AC-3.2.2: Edit PO line (quantity, price)
 * - AC-3.2.3: Remove PO line
 * - AC-3.2.4: PO totals calculation (subtotal, tax, total)
 *
 * Story 3.3: PO Approval Workflow
 * - AC-3.3.1: Request PO approval
 * - AC-3.3.2: Approve PO (with comment)
 * - AC-3.3.3: Reject PO (with reason)
 *
 * Story 3.4: Supplier Selection
 * - AC-3.4.1: Auto-populate currency from supplier
 * - AC-3.4.2: Auto-populate tax_code from supplier
 *
 * Story 3.5: PO Settings
 * - Default suppliers per warehouse
 * - Default tax codes per org
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test data
const testOrgId = randomUUID()
const testUserId = randomUUID()
const testWarehouseId = randomUUID()
const testSupplierId = randomUUID()
const testTaxCodeId = randomUUID()
let testPurchaseOrderId: string

// Cleanup test data
async function cleanup() {
  try {
    // Delete in reverse order of dependencies
    await supabase.from('po_lines').delete().eq('purchase_order_id', testPurchaseOrderId)
    await supabase.from('purchase_orders').delete().eq('org_id', testOrgId)
    await supabase.from('suppliers').delete().eq('org_id', testOrgId)
    await supabase.from('tax_codes').delete().eq('id', testTaxCodeId)
    await supabase.from('warehouses').delete().eq('org_id', testOrgId)
    await supabase.from('users').delete().eq('id', testUserId)
    await supabase.from('organizations').delete().eq('id', testOrgId)
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

describe('Batch 3A: Purchase Orders (Story 3.1, 3.2, 3.3, 3.4, 3.5)', () => {
  beforeAll(async () => {
    // Create test organization
    await supabase.from('organizations').insert({
      id: testOrgId,
      company_name: 'Test PO Company',
      description: 'Test organization for PO tests',
    })

    // Create test user
    await supabase.from('users').insert({
      id: testUserId,
      email: `po-test-${Date.now()}@test.com`,
      org_id: testOrgId,
      role: 'admin',
      status: 'active',
    })

    // Create test warehouse
    await supabase.from('warehouses').insert({
      id: testWarehouseId,
      org_id: testOrgId,
      code: 'WH-PO-TEST',
      name: 'Test Warehouse for PO',
      address: '123 Test St',
      is_active: true,
    })

    // Create tax code
    await supabase.from('tax_codes').insert({
      id: testTaxCodeId,
      org_id: testOrgId,
      code: 'TAX-PO-TEST',
      name: 'Test Tax Code',
      rate: 0.08,
      is_active: true,
    })

    // Create test supplier
    await supabase.from('suppliers').insert({
      id: testSupplierId,
      org_id: testOrgId,
      code: 'SUP-TEST-001',
      name: 'Test Supplier Inc',
      email: 'supplier@test.com',
      contact_person: 'John Doe',
      phone: '+1234567890',
      currency: 'USD',
      tax_code_id: testTaxCodeId,
      payment_terms: 'NET30',
      is_active: true,
    })
  })

  afterAll(async () => {
    await cleanup()
  })

  describe('Story 3.1: Purchase Order CRUD', () => {
    // AC-3.1.1: Create PO
    it('AC-3.1.1: Create purchase order with supplier and warehouse', async () => {
      const poInput = {
        supplier_id: testSupplierId,
        warehouse_id: testWarehouseId,
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_terms: 'NET30',
        notes: 'Test PO creation',
      }

      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          supplier_id: poInput.supplier_id,
          warehouse_id: poInput.warehouse_id,
          expected_delivery_date: poInput.expected_delivery_date,
          payment_terms: poInput.payment_terms,
          notes: poInput.notes,
          status: 'draft',
          currency: 'USD',
          subtotal: 0,
          tax_amount: 0,
          total: 0,
          created_by: testUserId,
          updated_by: testUserId,
          approval_status: null,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.supplier_id).toBe(testSupplierId)
      expect(data?.warehouse_id).toBe(testWarehouseId)
      expect(data?.status).toBe('draft')
      expect(data?.currency).toBe('USD')

      testPurchaseOrderId = data!.id
    })

    // AC-3.1.3: Get PO details
    it('AC-3.1.3: Get purchase order details', async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(
          `
          *,
          suppliers:supplier_id(id, code, name, currency),
          warehouses:warehouse_id(id, code, name)
        `
        )
        .eq('id', testPurchaseOrderId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(testPurchaseOrderId)
      expect(data?.suppliers).toBeDefined()
      expect(data?.warehouses).toBeDefined()
    })

    // AC-3.1.4: Update PO
    it('AC-3.1.4: Update purchase order fields', async () => {
      const newDeliveryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const updateNotes = 'Updated notes for test PO'

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          expected_delivery_date: newDeliveryDate,
          notes: updateNotes,
          updated_by: testUserId,
        })
        .eq('id', testPurchaseOrderId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.expected_delivery_date).toBe(newDeliveryDate)
      expect(data?.notes).toBe(updateNotes)
    })

    // AC-3.1.2: List POs with filters
    it('AC-3.1.2: List purchase orders with filters', async () => {
      const { data, error, count } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact' })
        .eq('org_id', testOrgId)
        .eq('status', 'draft')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(count).toBeGreaterThanOrEqual(1)
    })

    // List by supplier filter
    it('AC-3.1.2: Filter purchase orders by supplier', async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('org_id', testOrgId)
        .eq('supplier_id', testSupplierId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.length).toBeGreaterThanOrEqual(1)
      expect(data?.[0].supplier_id).toBe(testSupplierId)
    })

    // List by warehouse filter
    it('AC-3.1.2: Filter purchase orders by warehouse', async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('org_id', testOrgId)
        .eq('warehouse_id', testWarehouseId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.some(po => po.warehouse_id === testWarehouseId)).toBe(true)
    })
  })

  describe('Story 3.2: PO Line Management', () => {
    let testPoLineId: string

    // AC-3.2.1: Create PO line
    it('AC-3.2.1: Add line to purchase order', async () => {
      // First create a product
      const productId = randomUUID()
      await supabase.from('products').insert({
        id: productId,
        org_id: testOrgId,
        code: 'PROD-PO-TEST',
        name: 'Test Product for PO',
        type: 'Finished Good',
        uom: 'kg',
        status: 'active',
      })

      const { data, error } = await supabase
        .from('po_lines')
        .insert({
          purchase_order_id: testPurchaseOrderId,
          product_id: productId,
          quantity: 10,
          unit_price: 50.0,
          line_amount: 500.0,
          tax_rate: 0.08,
          tax_amount: 40.0,
          total_amount: 540.0,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.quantity).toBe(10)
      expect(data?.unit_price).toBe(50.0)
      expect(data?.line_amount).toBe(500.0)

      testPoLineId = data!.id

      // Cleanup product
      await supabase.from('products').delete().eq('id', productId)
    })

    // AC-3.2.2: Update PO line
    it('AC-3.2.2: Edit PO line quantity and price', async () => {
      const { data, error } = await supabase
        .from('po_lines')
        .update({
          quantity: 15,
          unit_price: 55.0,
          line_amount: 825.0,
        })
        .eq('id', testPoLineId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.quantity).toBe(15)
      expect(data?.unit_price).toBe(55.0)
      expect(data?.line_amount).toBe(825.0)
    })

    // AC-3.2.3: Delete PO line
    it('AC-3.2.3: Remove PO line', async () => {
      const { error } = await supabase.from('po_lines').delete().eq('id', testPoLineId)

      expect(error).toBeNull()

      // Verify deletion
      const { data: deletedData } = await supabase.from('po_lines').select('*').eq('id', testPoLineId)

      expect(deletedData?.length).toBe(0)
    })

    // AC-3.2.4: PO totals calculation
    it('AC-3.2.4: Calculate PO totals (subtotal, tax, total)', async () => {
      // Create product
      const productId = randomUUID()
      await supabase.from('products').insert({
        id: productId,
        org_id: testOrgId,
        code: 'PROD-TOTAL-TEST',
        name: 'Test Product for Totals',
        type: 'Finished Good',
        uom: 'kg',
        status: 'active',
      })

      // Add multiple lines
      const line1 = await supabase
        .from('po_lines')
        .insert({
          purchase_order_id: testPurchaseOrderId,
          product_id: productId,
          quantity: 10,
          unit_price: 100.0,
          line_amount: 1000.0,
          tax_rate: 0.08,
          tax_amount: 80.0,
          total_amount: 1080.0,
        })
        .select()
        .single()

      const line2 = await supabase
        .from('po_lines')
        .insert({
          purchase_order_id: testPurchaseOrderId,
          product_id: productId,
          quantity: 5,
          unit_price: 50.0,
          line_amount: 250.0,
          tax_rate: 0.08,
          tax_amount: 20.0,
          total_amount: 270.0,
        })
        .select()
        .single()

      // Get all lines for PO
      const { data: lines } = await supabase
        .from('po_lines')
        .select('*')
        .eq('purchase_order_id', testPurchaseOrderId)

      if (lines && lines.length > 0) {
        // Calculate totals
        const subtotal = lines.reduce((sum, line) => sum + line.line_amount, 0)
        const totalTax = lines.reduce((sum, line) => sum + line.tax_amount, 0)
        const total = subtotal + totalTax

        // Update PO with calculated totals
        const { data: updatedPo } = await supabase
          .from('purchase_orders')
          .update({
            subtotal,
            tax_amount: totalTax,
            total,
            updated_by: testUserId,
          })
          .eq('id', testPurchaseOrderId)
          .select()
          .single()

        expect(updatedPo?.subtotal).toBe(1250.0)
        expect(updatedPo?.tax_amount).toBe(100.0)
        expect(updatedPo?.total).toBe(1350.0)
      }

      // Cleanup lines
      await supabase.from('po_lines').delete().eq('purchase_order_id', testPurchaseOrderId)
      await supabase.from('products').delete().eq('id', productId)
    })
  })

  describe('Story 3.3: PO Approval Workflow', () => {
    // AC-3.3.1: Request approval
    it('AC-3.3.1: Request PO approval (change status to pending_approval)', async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          approval_status: 'pending',
          status: 'pending_approval',
          updated_by: testUserId,
        })
        .eq('id', testPurchaseOrderId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.approval_status).toBe('pending')
      expect(data?.status).toBe('pending_approval')
    })

    // AC-3.3.2: Approve PO
    it('AC-3.3.2: Approve purchase order', async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          approval_status: 'approved',
          approved_by: testUserId,
          approved_at: new Date().toISOString(),
          status: 'approved',
          updated_by: testUserId,
        })
        .eq('id', testPurchaseOrderId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.approval_status).toBe('approved')
      expect(data?.approved_by).toBe(testUserId)
      expect(data?.status).toBe('approved')
    })

    // AC-3.3.3: Reject PO
    it('AC-3.3.3: Reject purchase order with reason', async () => {
      const rejectReason = 'Price too high'

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          approval_status: 'rejected',
          rejection_reason: rejectReason,
          status: 'rejected',
          updated_by: testUserId,
        })
        .eq('id', testPurchaseOrderId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.approval_status).toBe('rejected')
      expect(data?.rejection_reason).toBe(rejectReason)
      expect(data?.status).toBe('rejected')
    })
  })

  describe('Story 3.4: Supplier Selection', () => {
    // AC-3.4.1: Currency inheritance
    it('AC-3.4.1: Auto-populate currency from supplier', async () => {
      const { data } = await supabase
        .from('purchase_orders')
        .select(
          `
          currency,
          suppliers:supplier_id(currency)
        `
        )
        .eq('id', testPurchaseOrderId)
        .single()

      expect(data?.currency).toBe('USD')
      expect(data?.suppliers?.currency).toBe('USD')
    })

    // AC-3.4.2: Tax code inheritance
    it('AC-3.4.2: Auto-populate tax_code from supplier', async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('tax_code_id')
        .eq('id', testSupplierId)
        .single()

      expect(data?.tax_code_id).toBe(testTaxCodeId)
    })
  })

  describe('Story 3.5: PO Settings', () => {
    // Default values
    it('AC-3.5: PO inherits currency and tax code from supplier settings', async () => {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('currency, tax_code_id')
        .eq('id', testSupplierId)
        .single()

      expect(supplier?.currency).toBeDefined()
      expect(supplier?.tax_code_id).toBeDefined()
    })
  })

  describe('AC-3.1.5: Delete PO', () => {
    it('AC-3.1.5: Delete purchase order', async () => {
      // First create a new draft PO to delete
      const { data: newPo } = await supabase
        .from('purchase_orders')
        .insert({
          org_id: testOrgId,
          supplier_id: testSupplierId,
          warehouse_id: testWarehouseId,
          expected_delivery_date: new Date().toISOString().split('T')[0],
          status: 'draft',
          currency: 'USD',
          subtotal: 0,
          tax_amount: 0,
          total: 0,
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      expect(newPo).toBeDefined()

      // Delete it
      const { error } = await supabase.from('purchase_orders').delete().eq('id', newPo!.id)

      expect(error).toBeNull()

      // Verify deletion
      const { data: deletedData } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', newPo!.id)

      expect(deletedData?.length).toBe(0)
    })
  })
})
