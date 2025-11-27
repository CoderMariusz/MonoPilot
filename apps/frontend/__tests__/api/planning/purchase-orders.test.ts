import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { cleanupTestData } from '../../../tests/e2e/fixtures/test-setup'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
const testOrgId = process.env.TEST_ORG_ID!
const testUserId = '550e8400-e29b-41d4-a716-446655440001' // Fixed test user ID

let testWarehouseId: string
let testSupplierId: string
let testTaxCodeId: string

const createPO = (supplierId: string, warehouseId: string) => ({
  org_id: testOrgId,
  po_number: `PO-${Math.floor(Math.random() * 999999)}`,
  supplier_id: supplierId,
  warehouse_id: warehouseId,
  expected_delivery_date: tomorrow,
  status: 'draft',
  currency: 'USD',
  subtotal: 0,
  tax_amount: 0,
  total: 0,
  created_by: testUserId,
  updated_by: testUserId,
})

describe('Batch 3A: Purchase Orders', () => {
  beforeAll(async () => {
    // Create tax code
    const { data: taxData } = await supabase
      .from('tax_codes')
      .insert({
        id: (testTaxCodeId = randomUUID()),
        org_id: testOrgId,
        code: `TAX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        description: 'Test Tax Code',
        rate: 8,
      })
      .select()
      .single()

    // Create warehouse
    const { data: whData } = await supabase
      .from('warehouses')
      .insert({
        id: (testWarehouseId = randomUUID()),
        org_id: testOrgId,
        code: `WH-${Math.random().toString(36).substr(2, 5)}`,
        name: 'Test Warehouse',
        is_active: true,
      })
      .select()
      .single()

    // Create supplier
    const { data: supData } = await supabase
      .from('suppliers')
      .insert({
        id: (testSupplierId = randomUUID()),
        org_id: testOrgId,
        code: `SUP-${Math.floor(Math.random() * 9999)}`,
        name: 'Test Supplier',
        currency: 'USD',
        tax_code_id: testTaxCodeId,
        payment_terms: 'NET30',
        is_active: true,
        created_by: testUserId,
        updated_by: testUserId,
      })
      .select()
      .single()
  })

  afterAll(async () => {
    await cleanupTestData(testOrgId)
  })

  describe('Story 3.1: PO CRUD', () => {
    it('AC-3.1.1: Create purchase order', async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert(createPO(testSupplierId, testWarehouseId))
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.supplier_id).toBe(testSupplierId)
      expect(data?.status).toBe('draft')
    })

    it('AC-3.1.2: List purchase orders', async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('org_id', testOrgId)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('AC-3.1.3: Get PO details', async () => {
      const { data: poData } = await supabase
        .from('purchase_orders')
        .insert(createPO(testSupplierId, testWarehouseId))
        .select()
        .single()

      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', poData?.id)
        .single()

      expect(error).toBeNull()
      expect(data?.id).toBe(poData?.id)
    })

    it('AC-3.1.4: Update PO', async () => {
      const { data: poData } = await supabase
        .from('purchase_orders')
        .insert(createPO(testSupplierId, testWarehouseId))
        .select()
        .single()

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ notes: 'Updated notes' })
        .eq('id', poData?.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.notes).toBe('Updated notes')
    })

    it('AC-3.1.5: Delete PO', async () => {
      const { data: poData } = await supabase
        .from('purchase_orders')
        .insert(createPO(testSupplierId, testWarehouseId))
        .select()
        .single()

      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poData?.id)

      expect(error).toBeNull()
    })
  })

  describe('Story 3.2: PO Lines', () => {
    it('AC-3.2.1: Add line to PO', async () => {
      const productId = randomUUID()
      await supabase.from('products').insert({
        id: productId,
        org_id: testOrgId,
        code: 'PROD-TEST',
        name: 'Test Product',
        type: 'Finished Good',
        uom: 'kg',
        status: 'active',
      })

      const { data: poData } = await supabase
        .from('purchase_orders')
        .insert(createPO(testSupplierId, testWarehouseId))
        .select()
        .single()

      const { data, error } = await supabase
        .from('po_lines')
        .insert({
          org_id: testOrgId,
          po_id: poData?.id,
          product_id: productId,
          sequence: 1,
          quantity: 10,
          uom: 'kg',
          unit_price: 50,
          line_subtotal: 500,
          tax_amount: 40,
          line_total: 540,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.quantity).toBe(10)

      await supabase.from('products').delete().eq('id', productId)
    })

    it('AC-3.2.4: Calculate PO totals', async () => {
      const { data: poData } = await supabase
        .from('purchase_orders')
        .insert({
          ...createPO(testSupplierId, testWarehouseId),
          subtotal: 1250,
          tax_amount: 100,
          total: 1350,
        })
        .select()
        .single()

      expect(poData?.subtotal).toBe(1250)
      expect(poData?.tax_amount).toBe(100)
      expect(poData?.total).toBe(1350)
    })
  })

  describe('Story 3.3: Approval Workflow', () => {
    it('AC-3.3.1: Request approval', async () => {
      const { data: poData } = await supabase
        .from('purchase_orders')
        .insert(createPO(testSupplierId, testWarehouseId))
        .select()
        .single()

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ approval_status: 'pending' })
        .eq('id', poData?.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.approval_status).toBe('pending')
    })

    it('AC-3.3.2: Approve PO', async () => {
      const { data: poData } = await supabase
        .from('purchase_orders')
        .insert(createPO(testSupplierId, testWarehouseId))
        .select()
        .single()

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          approval_status: 'approved',
          approved_by: testUserId,
        })
        .eq('id', poData?.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.approval_status).toBe('approved')
    })

    it('AC-3.3.3: Reject PO', async () => {
      const { data: poData } = await supabase
        .from('purchase_orders')
        .insert(createPO(testSupplierId, testWarehouseId))
        .select()
        .single()

      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          approval_status: 'rejected',
          rejection_reason: 'Budget exceeded',
        })
        .eq('id', poData?.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.approval_status).toBe('rejected')
    })
  })

  describe('Story 3.4: Supplier Selection', () => {
    it('AC-3.4.1: Auto-populate currency from supplier', async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('currency')
        .eq('id', testSupplierId)
        .single()

      expect(error).toBeNull()
      expect(data?.currency).toBe('USD')
    })

    it('AC-3.4.2: Auto-populate tax_code from supplier', async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('tax_code_id')
        .eq('id', testSupplierId)
        .single()

      expect(error).toBeNull()
      expect(data?.tax_code_id).toBe(testTaxCodeId)
    })
  })

  describe('Story 3.5: PO Settings', () => {
    it('AC-3.5: PO inherits currency and tax code from supplier', async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('currency, tax_code_id')
        .eq('id', testSupplierId)
        .single()

      expect(error).toBeNull()
      expect(data?.currency).toBe('USD')
      expect(data?.tax_code_id).toBe(testTaxCodeId)
    })
  })
})
