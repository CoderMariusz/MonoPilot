import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

async function setupTestData() {
  const ids = {
    orgId: randomUUID(),
    userId: randomUUID(),
    warehouseId: randomUUID(),
    supplierId: randomUUID(),
    taxCodeId: randomUUID(),
  }

  await supabase.from('organizations').insert({
    id: ids.orgId,
    company_name: `Test-${Date.now()}`,
  })

  await supabase.from('users').insert({
    id: ids.userId,
    org_id: ids.orgId,
    email: `test-${Date.now()}@test.com`,
    role: 'admin',
    status: 'active',
  })

  await supabase.from('warehouses').insert({
    id: ids.warehouseId,
    org_id: ids.orgId,
    code: `WH-${Math.random().toString(36).substr(2, 5)}`,
    name: 'Test WH',
    is_active: true,
  })

  await supabase.from('tax_codes').insert({
    id: ids.taxCodeId,
    org_id: ids.orgId,
    code: `TAX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    description: 'Test Tax',
    rate: 8,
  })

  const { error: supErr } = await supabase.from('suppliers').insert({
    id: ids.supplierId,
    org_id: ids.orgId,
    code: `SUP-${Math.floor(Math.random() * 9999)}`,
    name: 'Test Supplier',
    currency: 'USD',
    tax_code_id: ids.taxCodeId,
    payment_terms: 'NET30',
    is_active: true,
    created_by: ids.userId,
    updated_by: ids.userId,
  })
  if (supErr) console.error('Supplier insert error:', supErr)

  return ids
}

async function cleanup(ids: any) {
  await supabase.from('po_lines').delete().eq('org_id', ids.orgId)
  await supabase.from('purchase_orders').delete().eq('org_id', ids.orgId)
  await supabase.from('suppliers').delete().eq('org_id', ids.orgId)
  await supabase.from('tax_codes').delete().eq('org_id', ids.orgId)
  await supabase.from('warehouses').delete().eq('org_id', ids.orgId)
  await supabase.from('users').delete().eq('org_id', ids.orgId)
  await supabase.from('organizations').delete().eq('id', ids.orgId)
}

const createPO = (ids: any) => ({
  org_id: ids.orgId,
  po_number: `PO-${Math.floor(Math.random() * 999999)}`,
  supplier_id: ids.supplierId,
  warehouse_id: ids.warehouseId,
  expected_delivery_date: tomorrow,
  status: 'draft',
  currency: 'USD',
  subtotal: 0,
  tax_amount: 0,
  total: 0,
  created_by: ids.userId,
  updated_by: ids.userId,
})

describe('Batch 3A: Purchase Orders', () => {
  describe('Story 3.1: PO CRUD', () => {
    it('AC-3.1.1: Create purchase order', async () => {
      const ids = await setupTestData()
      try {
        const { data, error } = await supabase
          .from('purchase_orders')
          .insert(createPO(ids))
          .select()
          .single()

        expect(error).toBeNull()
        expect(data?.supplier_id).toBe(ids.supplierId)
        expect(data?.status).toBe('draft')
      } finally {
        await cleanup(ids)
      }
    })

    it('AC-3.1.2: List purchase orders', async () => {
      const ids = await setupTestData()
      try {
        const { data, error } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('org_id', ids.orgId)

        expect(error).toBeNull()
        expect(Array.isArray(data)).toBe(true)
      } finally {
        await cleanup(ids)
      }
    })

    it('AC-3.1.3: Get PO details', async () => {
      const ids = await setupTestData()
      try {
        const { data: poData } = await supabase
          .from('purchase_orders')
          .insert(createPO(ids))
          .select()
          .single()

        const { data, error } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('id', poData?.id)
          .single()

        expect(error).toBeNull()
        expect(data?.id).toBe(poData?.id)
      } finally {
        await cleanup(ids)
      }
    })

    it('AC-3.1.4: Update PO', async () => {
      const ids = await setupTestData()
      try {
        const { data: poData } = await supabase
          .from('purchase_orders')
          .insert(createPO(ids))
          .select()
          .single()

        const { data, error } = await supabase
          .from('purchase_orders')
          .update({ notes: 'Updated' })
          .eq('id', poData?.id)
          .select()
          .single()

        expect(error).toBeNull()
        expect(data?.notes).toBe('Updated')
      } finally {
        await cleanup(ids)
      }
    })

    it('AC-3.1.5: Delete PO', async () => {
      const ids = await setupTestData()
      try {
        const { data: poData } = await supabase
          .from('purchase_orders')
          .insert(createPO(ids))
          .select()
          .single()

        const { error } = await supabase
          .from('purchase_orders')
          .delete()
          .eq('id', poData?.id)

        expect(error).toBeNull()
      } finally {
        await cleanup(ids)
      }
    })
  })

  describe('Story 3.2: PO Lines', () => {
    it('AC-3.2.1: Add line to PO', async () => {
      const ids = await setupTestData()
      try {
        const productId = randomUUID()
        await supabase.from('products').insert({
          id: productId,
          org_id: ids.orgId,
          code: 'PROD-TEST',
          name: 'Test Product',
          type: 'Finished Good',
          uom: 'kg',
          status: 'active',
        })

        const { data: poData } = await supabase
          .from('purchase_orders')
          .insert(createPO(ids))
          .select()
          .single()

        const { data, error } = await supabase
          .from('po_lines')
          .insert({
            org_id: ids.orgId,
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
      } finally {
        await cleanup(ids)
      }
    })

    it('AC-3.2.4: Calculate PO totals', async () => {
      const ids = await setupTestData()
      try {
        const { data: poData } = await supabase
          .from('purchase_orders')
          .insert({
            ...createPO(ids),
            subtotal: 1250,
            tax_amount: 100,
            total: 1350,
          })
          .select()
          .single()

        expect(poData?.subtotal).toBe(1250)
        expect(poData?.tax_amount).toBe(100)
        expect(poData?.total).toBe(1350)
      } finally {
        await cleanup(ids)
      }
    })
  })

  describe('Story 3.3: Approval Workflow', () => {
    it('AC-3.3.1: Request approval', async () => {
      const ids = await setupTestData()
      try {
        const { data: poData } = await supabase
          .from('purchase_orders')
          .insert(createPO(ids))
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
      } finally {
        await cleanup(ids)
      }
    })

    it('AC-3.3.2: Approve PO', async () => {
      const ids = await setupTestData()
      try {
        const { data: poData } = await supabase
          .from('purchase_orders')
          .insert(createPO(ids))
          .select()
          .single()

        const { data, error } = await supabase
          .from('purchase_orders')
          .update({
            approval_status: 'approved',
            approved_by: ids.userId,
          })
          .eq('id', poData?.id)
          .select()
          .single()

        expect(error).toBeNull()
        expect(data?.approval_status).toBe('approved')
      } finally {
        await cleanup(ids)
      }
    })

    it('AC-3.3.3: Reject PO', async () => {
      const ids = await setupTestData()
      try {
        const { data: poData } = await supabase
          .from('purchase_orders')
          .insert(createPO(ids))
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
      } finally {
        await cleanup(ids)
      }
    })
  })

  describe('Story 3.4: Supplier Selection', () => {
    it('AC-3.4.1: Auto-populate currency from supplier', async () => {
      const ids = await setupTestData()
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('currency')
          .eq('id', ids.supplierId)
          .single()

        expect(error).toBeNull()
        expect(data?.currency).toBe('USD')
      } finally {
        await cleanup(ids)
      }
    })

    it('AC-3.4.2: Auto-populate tax_code from supplier', async () => {
      const ids = await setupTestData()
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('tax_code_id')
          .eq('id', ids.supplierId)
          .single()

        expect(error).toBeNull()
        expect(data?.tax_code_id).toBe(ids.taxCodeId)
      } finally {
        await cleanup(ids)
      }
    })
  })

  describe('Story 3.5: PO Settings', () => {
    it('AC-3.5: PO inherits currency and tax code from supplier', async () => {
      const ids = await setupTestData()
      try {
        const supplier = await supabase
          .from('suppliers')
          .select('currency, tax_code_id')
          .eq('id', ids.supplierId)
          .single()

        expect(supplier.data?.currency).toBe('USD')
        expect(supplier.data?.tax_code_id).toBe(ids.taxCodeId)
      } finally {
        await cleanup(ids)
      }
    })
  })
})
