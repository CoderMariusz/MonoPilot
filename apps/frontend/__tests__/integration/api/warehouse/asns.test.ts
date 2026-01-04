/**
 * ASN API Routes - Integration Tests (Story 05.8)
 * Purpose: Test ASN API endpoints and RLS policies
 * Phase: RED - Tests will fail until API routes are implemented
 *
 * Tests API endpoints:
 * - GET /api/warehouse/asns (list)
 * - GET /api/warehouse/asns/:id (detail)
 * - POST /api/warehouse/asns (create)
 * - PUT /api/warehouse/asns/:id (update)
 * - DELETE /api/warehouse/asns/:id (delete)
 * - POST /api/warehouse/asns/:id/cancel (cancel)
 * - POST /api/warehouse/asns/:id/items (add item)
 * - PUT /api/warehouse/asns/:id/items/:itemId (update item)
 * - DELETE /api/warehouse/asns/:id/items/:itemId (delete item)
 * - POST /api/warehouse/asns/from-po/:poId (create from PO)
 * - GET /api/warehouse/asns/expected-today (dashboard widget)
 *
 * Coverage Target: 80%+
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Settings Toggle (enable_asn)
 * - AC-2: ASN List Page
 * - AC-3: Create ASN Header
 * - AC-4: ASN-to-PO Linkage
 * - AC-5: ASN Item Management
 * - AC-6: ASN Status Lifecycle
 * - AC-8: Expected Today Dashboard Widget
 * - AC-10: ASN Detail View
 * - AC-11: ASN Edit and Delete
 * - RLS: Cross-tenant access returns 404
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('ASN API Routes - Integration Tests (Story 05.8)', () => {
  let supabase: any
  let orgId: string
  let orgId2: string
  // Use hardcoded test user UUIDs (no need to create users for service role tests)
  const userId = 'aaaabbbb-cccc-dddd-eeee-111111111111'
  const userId2 = 'aaaabbbb-cccc-dddd-eeee-222222222222'
  let warehouseId: string
  let productId1: string
  let productId2: string
  let supplierId: string
  let poId: string

  beforeAll(async () => {
    // Setup test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Clean up any leftover test data from previous runs
    await supabase.from('organizations').delete().eq('slug', 'test-org-asn-1')
    await supabase.from('organizations').delete().eq('slug', 'test-org-asn-2')

    // Create test org 1
    const { data: org1, error: org1Error } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org ASN 1', slug: 'test-org-asn-1' })
      .select()
      .single()
    if (org1Error || !org1) throw new Error(`Failed to create test org 1: ${org1Error?.message || 'No data returned'}`)
    orgId = org1.id

    // Create test org 2 (for RLS testing)
    const { data: org2, error: org2Error } = await supabase
      .from('organizations')
      .insert({ name: 'Test Org ASN 2', slug: 'test-org-asn-2' })
      .select()
      .single()
    if (org2Error || !org2) throw new Error(`Failed to create test org 2: ${org2Error?.message || 'No data returned'}`)
    orgId2 = org2.id

    // Create or update warehouse settings
    const { error: settingsError } = await supabase.from('warehouse_settings').upsert({
      org_id: orgId,
      enable_asn: true,
    }, {
      onConflict: 'org_id'
    })
    if (settingsError) throw new Error(`Failed to create warehouse settings: ${settingsError.message}`)

    // Create warehouse
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .insert({
        org_id: orgId,
        name: 'Test Warehouse ASN',
        code: 'TW-ASN',
      })
      .select()
      .single()
    if (warehouseError || !warehouse) throw new Error(`Failed to create warehouse: ${warehouseError?.message || 'No data returned'}`)
    warehouseId = warehouse.id

    // Get or create product_type for test products
    let productTypeId: string
    const { data: productType, error: productTypeError } = await supabase
      .from('product_types')
      .select('id')
      .eq('org_id', orgId)
      .limit(1)
      .single()

    if (!productType) {
      const { data: newType } = await supabase
        .from('product_types')
        .insert({
          org_id: orgId,
          code: 'RAW',
          name: 'Raw Material',
        })
        .select()
        .single()
      productTypeId = newType!.id
    } else {
      productTypeId = productType.id
    }

    // Create products
    const { data: product1, error: product1Error } = await supabase
      .from('products')
      .insert({
        org_id: orgId,
        code: 'ASN-PROD-001',
        name: 'Test Product 1',
        product_type_id: productTypeId,
        base_uom: 'KG',
      })
      .select()
      .single()
    if (product1Error || !product1) throw new Error(`Failed to create product 1: ${product1Error?.message || 'No data returned'}`)
    productId1 = product1.id

    const { data: product2, error: product2Error } = await supabase
      .from('products')
      .insert({
        org_id: orgId,
        code: 'ASN-PROD-002',
        name: 'Test Product 2',
        product_type_id: productTypeId,
        base_uom: 'KG',
      })
      .select()
      .single()
    if (product2Error || !product2) throw new Error(`Failed to create product 2: ${product2Error?.message || 'No data returned'}`)
    productId2 = product2.id

    // Create supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        org_id: orgId,
        code: 'SUP-ASN-001',
        name: 'Test Supplier ASN',
        payment_terms: 'Net 30',
        currency: 'PLN',
      })
      .select()
      .single()
    if (supplierError || !supplier) throw new Error(`Failed to create supplier: ${supplierError?.message || 'No data returned'}`)
    supplierId = supplier.id

    // Create PO with lines
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        org_id: orgId,
        po_number: 'PO-ASN-TEST-001',
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        status: 'approved',
        expected_delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      })
      .select()
      .single()
    if (poError || !po) throw new Error(`Failed to create PO: ${poError?.message || 'No data returned'}`)
    poId = po.id

    // Create PO lines
    const { error: poLinesError } = await supabase.from('purchase_order_lines').insert([
      {
        po_id: poId,
        line_number: 1,
        product_id: productId1,
        quantity: 100,
        received_qty: 20,
        uom: 'KG',
        unit_price: 10.00,
        line_total: 1000.00,
      },
      {
        po_id: poId,
        line_number: 2,
        product_id: productId2,
        quantity: 50,
        received_qty: 0,
        uom: 'KG',
        unit_price: 15.00,
        line_total: 750.00,
      },
    ])
    if (poLinesError) throw new Error(`Failed to create PO lines: ${poLinesError.message}`)
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('asn_items').delete().eq('asn_id', poId)
    await supabase.from('asns').delete().eq('org_id', orgId)
    await supabase.from('purchase_order_lines').delete().eq('po_id', poId)
    await supabase.from('purchase_orders').delete().eq('id', poId)
    await supabase.from('suppliers').delete().eq('id', supplierId)
    await supabase.from('products').delete().in('id', [productId1, productId2])
    await supabase.from('warehouses').delete().eq('id', warehouseId)
    await supabase.from('warehouse_settings').delete().eq('org_id', orgId)
    await supabase.from('organizations').delete().in('id', [orgId, orgId2])
  })

  // ==========================================================================
  // Feature Toggle (AC-1)
  // ==========================================================================
  describe('Feature Toggle - enable_asn', () => {
    it('should return 403 when enable_asn is false', async () => {
      // Disable ASN feature
      await supabase
        .from('warehouse_settings')
        .update({ enable_asn: false })
        .eq('org_id', orgId)

      const response = await fetch('/api/warehouse/asns', {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Feature disabled')

      // Re-enable for other tests
      await supabase
        .from('warehouse_settings')
        .update({ enable_asn: true })
        .eq('org_id', orgId)
    })

    it('should allow access when enable_asn is true', async () => {
      const response = await fetch('/api/warehouse/asns', {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(200)
    })
  })

  // ==========================================================================
  // List ASNs (AC-2)
  // ==========================================================================
  describe('GET /api/warehouse/asns', () => {
    beforeEach(async () => {
      // Clean existing ASNs
      await supabase.from('asns').delete().eq('org_id', orgId)

      // Create test ASNs
      await supabase.from('asns').insert([
        {
          org_id: orgId,
          asn_number: 'ASN-2025-00001',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: new Date().toISOString().split('T')[0],
          status: 'pending',
        },
        {
          org_id: orgId,
          asn_number: 'ASN-2025-00002',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          status: 'partial',
        },
      ])
    })

    it('should return paginated ASN list', async () => {
      const response = await fetch('/api/warehouse/asns?page=1&limit=20', {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.asns).toHaveLength(2)
      expect(data.pagination).toBeDefined()
    })

    it('should filter by status', async () => {
      const response = await fetch('/api/warehouse/asns?status=pending', {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.asns.every((asn: any) => asn.status === 'pending')).toBe(true)
    })

    it('should search by ASN number', async () => {
      const response = await fetch('/api/warehouse/asns?search=ASN-2025-00001', {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.asns).toHaveLength(1)
      expect(data.asns[0].asn_number).toBe('ASN-2025-00001')
    })

    it('should sort by expected_date', async () => {
      const response = await fetch('/api/warehouse/asns?sort=expected_date&order=asc', {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(new Date(data.asns[0].expected_date).getTime()).toBeLessThan(
        new Date(data.asns[1].expected_date).getTime()
      )
    })
  })

  // ==========================================================================
  // Create ASN (AC-3)
  // ==========================================================================
  describe('POST /api/warehouse/asns', () => {
    it('should create ASN with items', async () => {
      const input = {
        po_id: poId,
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        carrier: 'FedEx',
        tracking_number: '1234567890',
        items: [
          {
            product_id: productId1,
            expected_qty: 100,
            uom: 'KG',
          },
        ],
      }

      const response = await fetch('/api/warehouse/asns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.asn_number).toMatch(/^ASN-\d{4}-\d{5}$/)
      expect(data.status).toBe('pending')
      expect(data.items).toHaveLength(1)
    })

    it('should return 400 when po_id is missing', async () => {
      const input = {
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      }

      const response = await fetch('/api/warehouse/asns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 when items array is empty', async () => {
      const input = {
        po_id: poId,
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        items: [],
      }

      const response = await fetch('/api/warehouse/asns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      expect(response.status).toBe(400)
    })
  })

  // ==========================================================================
  // Create ASN from PO (AC-4)
  // ==========================================================================
  describe('POST /api/warehouse/asns/from-po/:poId', () => {
    it('should create ASN from PO with auto-populated items', async () => {
      const input = {
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        carrier: 'UPS',
      }

      const response = await fetch(`/api/warehouse/asns/from-po/${poId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.items).toHaveLength(2) // 2 unreceived lines
      expect(data.items[0].expected_qty).toBe(80) // 100 - 20
      expect(data.items[1].expected_qty).toBe(50) // 50 - 0
    })

    it('should return 400 for fully received PO', async () => {
      // Mark all lines as fully received
      await supabase
        .from('purchase_order_lines')
        .update({ received_qty: 100 })
        .eq('po_id', poId)
        .eq('product_id', productId1)

      await supabase
        .from('purchase_order_lines')
        .update({ received_qty: 50 })
        .eq('po_id', poId)
        .eq('product_id', productId2)

      const input = {
        expected_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      }

      const response = await fetch(`/api/warehouse/asns/from-po/${poId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Cannot create ASN for fully received PO')

      // Reset for other tests
      await supabase
        .from('purchase_order_lines')
        .update({ received_qty: 20 })
        .eq('po_id', poId)
        .eq('product_id', productId1)

      await supabase
        .from('purchase_order_lines')
        .update({ received_qty: 0 })
        .eq('po_id', poId)
        .eq('product_id', productId2)
    })
  })

  // ==========================================================================
  // Get ASN Detail (AC-10)
  // ==========================================================================
  describe('GET /api/warehouse/asns/:id', () => {
    let asnId: string

    beforeEach(async () => {
      const { data: asn, error: asnError } = await supabase
        .from('asns')
        .insert({
          org_id: orgId,
          asn_number: 'ASN-2025-TEST-001',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          
        })
        .select()
        .single()
      if (asnError || !asn) throw new Error(`Failed to create test ASN: ${asnError?.message || 'No data'}`)
      asnId = asn.id

      await supabase.from('asn_items').insert({
        asn_id: asnId,
        product_id: productId1,
        expected_qty: 100,
        received_qty: 0,
        uom: 'KG',
      })
    })

    it('should return ASN detail with items', async () => {
      const response = await fetch(`/api/warehouse/asns/${asnId}`, {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe(asnId)
      expect(data.items).toHaveLength(1)
    })

    it('should return 404 for non-existent ASN', async () => {
      const response = await fetch('/api/warehouse/asns/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(404)
    })

    it('should return 404 for cross-tenant access', async () => {
      const response = await fetch(`/api/warehouse/asns/${asnId}`, {
        headers: { Authorization: `Bearer ${userId2}` },
      })

      expect(response.status).toBe(404)
    })
  })

  // ==========================================================================
  // Update ASN (AC-11)
  // ==========================================================================
  describe('PUT /api/warehouse/asns/:id', () => {
    let asnId: string

    beforeEach(async () => {
      const { data: asn, error: asnError } = await supabase
        .from('asns')
        .insert({
          org_id: orgId,
          asn_number: 'ASN-2025-UPDATE-001',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          
        })
        .select()
        .single()
      if (asnError || !asn) throw new Error(`Failed to create test ASN: ${asnError?.message || 'No data'}`)
      asnId = asn.id
    })

    it('should update ASN header when status is pending', async () => {
      const input = {
        carrier: 'DHL',
        tracking_number: '9999999999',
      }

      const response = await fetch(`/api/warehouse/asns/${asnId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.carrier).toBe('DHL')
      expect(data.tracking_number).toBe('9999999999')
    })

    it('should return 400 when status is not pending', async () => {
      await supabase.from('asns').update({ status: 'partial' }).eq('id', asnId)

      const input = {
        carrier: 'DHL',
      }

      const response = await fetch(`/api/warehouse/asns/${asnId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${userId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Cannot modify ASN')
    })
  })

  // ==========================================================================
  // Delete ASN (AC-11)
  // ==========================================================================
  describe('DELETE /api/warehouse/asns/:id', () => {
    let asnId: string

    beforeEach(async () => {
      const { data: asn, error: asnError } = await supabase
        .from('asns')
        .insert({
          org_id: orgId,
          asn_number: 'ASN-2025-DELETE-001',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          
        })
        .select()
        .single()
      if (asnError || !asn) throw new Error(`Failed to create test ASN: ${asnError?.message || 'No data'}`)
      asnId = asn.id
    })

    it('should delete ASN when status is pending and no receipts', async () => {
      const response = await fetch(`/api/warehouse/asns/${asnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(204)
    })

    it('should return 400 when ASN has received items', async () => {
      await supabase.from('asns').update({ status: 'partial' }).eq('id', asnId)

      const response = await fetch(`/api/warehouse/asns/${asnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Cannot delete ASN with received items')
    })
  })

  // ==========================================================================
  // Cancel ASN (AC-6)
  // ==========================================================================
  describe('POST /api/warehouse/asns/:id/cancel', () => {
    let asnId: string

    beforeEach(async () => {
      const { data: asn, error: asnError } = await supabase
        .from('asns')
        .insert({
          org_id: orgId,
          asn_number: 'ASN-2025-CANCEL-001',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          
        })
        .select()
        .single()
      if (asnError || !asn) throw new Error(`Failed to create test ASN: ${asnError?.message || 'No data'}`)
      asnId = asn.id
    })

    it('should cancel ASN when status is pending', async () => {
      const response = await fetch(`/api/warehouse/asns/${asnId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('cancelled')
    })

    it('should return 400 when status is not pending', async () => {
      await supabase.from('asns').update({ status: 'partial' }).eq('id', asnId)

      const response = await fetch(`/api/warehouse/asns/${asnId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(400)
    })
  })

  // ==========================================================================
  // Expected Today (AC-8)
  // ==========================================================================
  describe('GET /api/warehouse/asns/expected-today', () => {
    beforeEach(async () => {
      await supabase.from('asns').delete().eq('org_id', orgId)

      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

      await supabase.from('asns').insert([
        {
          org_id: orgId,
          asn_number: 'ASN-TODAY-001',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: today,
          status: 'pending',
          
        },
        {
          org_id: orgId,
          asn_number: 'ASN-TODAY-002',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: today,
          status: 'partial',
          
        },
        {
          org_id: orgId,
          asn_number: 'ASN-TOMORROW-001',
          po_id: poId,
          supplier_id: supplierId,
          expected_date: tomorrow,
          status: 'pending',
        },
      ])
    })

    it('should return only ASNs expected today with pending or partial status', async () => {
      const response = await fetch('/api/warehouse/asns/expected-today', {
        headers: { Authorization: `Bearer ${userId}` },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.asns).toHaveLength(2)
      expect(data.asns.every((asn: any) => ['pending', 'partial'].includes(asn.status))).toBe(true)
    })
  })
})
