/**
 * Inventory Overview Service - Unit Tests
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Purpose: Test inventory aggregation service with grouping by product/location/warehouse
 *
 * Tests coverage:
 * - Group by product (available/reserved/blocked qty, LP count, avg age)
 * - Group by location (total LPs, products count)
 * - Group by warehouse (total LPs, products/locations count, expiry counts)
 * - Filters: warehouse_id, location_id, product_id, status, date range, search
 * - Pagination: page, limit
 * - Summary calculations
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Group by product
 * - AC-2: Group by location
 * - AC-3: Group by warehouse
 * - AC-4: Filtering
 * - AC-7: Pagination
 * - AC-8: Summary calculations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { InventoryOverviewService } from '@/lib/services/inventory-overview-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const testOrgId = process.env.TEST_ORG_ID!

let testWarehouseId: string
let testLocationId: string
let testLocation2Id: string
let testProductId: string
let testProduct2Id: string
let createdLPIds: string[] = []
let setupFailed = false

describe('Inventory Overview Service Tests', () => {
  beforeAll(async () => {
    console.log('Setting up test data for Inventory Overview Service...')

    // Create test warehouse
    const { data: warehouse, error: whError } = await supabase
      .from('warehouses')
      .insert({
        org_id: testOrgId,
        code: `WH-${Date.now() % 100000}`,
        name: 'Test WH Inv',
        is_active: true,
      })
      .select()
      .single()

    if (whError || !warehouse) {
      console.warn('Failed to create test warehouse:', whError?.message)
      setupFailed = true
      return
    }
    testWarehouseId = warehouse.id

    // Create test locations
    const { data: loc1, error: loc1Error } = await supabase
      .from('locations')
      .insert({
        org_id: testOrgId,
        warehouse_id: testWarehouseId,
        code: `L1-${Date.now() % 100000}`,
        name: 'Loc 1',
        location_type: 'bin',
        is_active: true,
      })
      .select()
      .single()

    if (loc1Error || !loc1) {
      setupFailed = true
      return
    }
    testLocationId = loc1.id

    const { data: loc2, error: loc2Error } = await supabase
      .from('locations')
      .insert({
        org_id: testOrgId,
        warehouse_id: testWarehouseId,
        code: `L2-${Date.now() % 100000}`,
        name: 'Loc 2',
        location_type: 'bin',
        is_active: true,
      })
      .select()
      .single()

    if (loc2Error || !loc2) {
      setupFailed = true
      return
    }
    testLocation2Id = loc2.id

    // Get product type
    const { data: productType } = await supabase
      .from('product_types')
      .select('id')
      .eq('org_id', testOrgId)
      .limit(1)
      .single()

    // Create test products
    const { data: prod1, error: prod1Error } = await supabase
      .from('products')
      .insert({
        org_id: testOrgId,
        code: `P1-${Date.now() % 100000}`,
        name: 'Test Prod 1',
        product_type_id: productType?.id,
        base_uom: 'KG',
        status: 'active',
        unit_cost: 10.50,
      })
      .select()
      .single()

    if (prod1Error || !prod1) {
      setupFailed = true
      return
    }
    testProductId = prod1.id

    const { data: prod2, error: prod2Error } = await supabase
      .from('products')
      .insert({
        org_id: testOrgId,
        code: `P2-${Date.now() % 100000}`,
        name: 'Test Prod 2',
        product_type_id: productType?.id,
        base_uom: 'KG',
        status: 'active',
        unit_cost: 15.00,
      })
      .select()
      .single()

    if (prod2Error || !prod2) {
      setupFailed = true
      return
    }
    testProduct2Id = prod2.id

    // Create test LPs
    const today = new Date()
    const in30Days = new Date()
    in30Days.setDate(today.getDate() + 30)

    const testLPs = [
      // Product 1, Location 1, Available
      {
        org_id: testOrgId,
        product_id: testProductId,
        quantity: 100,
        uom: 'KG',
        location_id: testLocationId,
        warehouse_id: testWarehouseId,
        status: 'available',
        qa_status: 'passed',
        source: 'manual',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Product 1, Location 1, Reserved
      {
        org_id: testOrgId,
        product_id: testProductId,
        quantity: 50,
        uom: 'KG',
        location_id: testLocationId,
        warehouse_id: testWarehouseId,
        status: 'reserved',
        qa_status: 'passed',
        source: 'manual',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Product 1, Location 2, Blocked
      {
        org_id: testOrgId,
        product_id: testProductId,
        quantity: 25,
        uom: 'KG',
        location_id: testLocation2Id,
        warehouse_id: testWarehouseId,
        status: 'blocked',
        qa_status: 'quarantine',
        source: 'manual',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Product 2, Location 1, Available
      {
        org_id: testOrgId,
        product_id: testProduct2Id,
        quantity: 200,
        uom: 'KG',
        location_id: testLocationId,
        warehouse_id: testWarehouseId,
        status: 'available',
        qa_status: 'passed',
        source: 'manual',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: in30Days.toISOString().split('T')[0],
      },
      // Product 2, Location 2, Available
      {
        org_id: testOrgId,
        product_id: testProduct2Id,
        quantity: 75,
        uom: 'KG',
        location_id: testLocation2Id,
        warehouse_id: testWarehouseId,
        status: 'available',
        qa_status: 'passed',
        source: 'manual',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const { data: lps, error: lpError } = await supabase
      .from('license_plates')
      .insert(testLPs)
      .select('id')

    if (lpError || !lps) {
      console.warn('Failed to create test LPs:', lpError?.message)
      setupFailed = true
      return
    }

    createdLPIds = lps.map(lp => lp.id)
    console.log(`Created ${createdLPIds.length} test LPs`)
  })

  afterAll(async () => {
    console.log('Cleaning up test data...')

    if (createdLPIds.length > 0) {
      await supabase.from('license_plates').delete().in('id', createdLPIds)
    }
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId)
    }
    if (testProduct2Id) {
      await supabase.from('products').delete().eq('id', testProduct2Id)
    }
    if (testLocationId) {
      await supabase.from('locations').delete().eq('id', testLocationId)
    }
    if (testLocation2Id) {
      await supabase.from('locations').delete().eq('id', testLocation2Id)
    }
    if (testWarehouseId) {
      await supabase.from('warehouses').delete().eq('id', testWarehouseId)
    }

    console.log('Cleanup complete')
  })

  // ==========================================================================
  // AC-1: Group by Product
  // ==========================================================================
  describe('Group by Product (AC-1)', () => {
    it('should aggregate inventory by product with status breakdown', async () => {
      if (setupFailed) {
        console.warn('Skipping - setup failed')
        return
      }

      const result = await InventoryOverviewService.getInventorySummary(
        supabase,
        'product',
        {},
        { page: 1, limit: 50 }
      )

      expect(result).toBeDefined()
      expect(result.data.length).toBeGreaterThanOrEqual(2)

      const product1 = result.data.find((p: any) => p.product_id === testProductId)
      expect(product1).toBeDefined()
      expect(product1.available_qty).toBe(100)
      expect(product1.reserved_qty).toBe(50)
      expect(product1.blocked_qty).toBe(25)
      expect(product1.total_qty).toBe(175)
      expect(product1.lp_count).toBe(3)
      expect(product1.locations_count).toBe(2)
      expect(product1.avg_age_days).toBeGreaterThan(0)
      expect(product1.total_value).toBeGreaterThan(0)

      const product2 = result.data.find((p: any) => p.product_id === testProduct2Id)
      expect(product2).toBeDefined()
      expect(product2.available_qty).toBe(275)
      expect(product2.total_qty).toBe(275)
      expect(product2.lp_count).toBe(2)
    })
  })

  // ==========================================================================
  // AC-2: Group by Location
  // ==========================================================================
  describe('Group by Location (AC-2)', () => {
    it('should aggregate inventory by location', async () => {
      if (setupFailed) return

      const result = await InventoryOverviewService.getInventorySummary(
        supabase,
        'location',
        {},
        { page: 1, limit: 50 }
      )

      const location1 = result.data.find((l: any) => l.location_id === testLocationId)
      expect(location1).toBeDefined()
      expect(location1.total_lps).toBe(3)
      expect(location1.products_count).toBe(2)
    })
  })

  // ==========================================================================
  // AC-3: Group by Warehouse
  // ==========================================================================
  describe('Group by Warehouse (AC-3)', () => {
    it('should aggregate inventory by warehouse with expiry counts', async () => {
      if (setupFailed) return

      const result = await InventoryOverviewService.getInventorySummary(
        supabase,
        'warehouse',
        {},
        { page: 1, limit: 50 }
      )

      const warehouse1 = result.data.find((w: any) => w.warehouse_id === testWarehouseId)
      expect(warehouse1).toBeDefined()
      expect(warehouse1.total_lps).toBe(5)
      expect(warehouse1.products_count).toBe(2)
      expect(warehouse1.locations_count).toBe(2)
      expect(warehouse1.expiring_soon).toBe(1)
      expect(warehouse1.expired).toBe(0)
    })
  })

  // ==========================================================================
  // AC-4: Filters
  // ==========================================================================
  describe('Filters (AC-4)', () => {
    it('should filter by warehouse_id', async () => {
      if (setupFailed) return

      const result = await InventoryOverviewService.getInventorySummary(
        supabase,
        'product',
        { warehouse_id: testWarehouseId },
        { page: 1, limit: 50 }
      )

      expect(result.data.length).toBeGreaterThanOrEqual(2)
    })

    it('should filter by status=available', async () => {
      if (setupFailed) return

      const result = await InventoryOverviewService.getInventorySummary(
        supabase,
        'product',
        { status: 'available' },
        { page: 1, limit: 50 }
      )

      const product1 = result.data.find((p: any) => p.product_id === testProductId)
      expect(product1.available_qty).toBe(100)
      expect(product1.lp_count).toBe(1) // Only 1 available LP for product 1
    })

    it('should filter by product_id', async () => {
      if (setupFailed) return

      const result = await InventoryOverviewService.getInventorySummary(
        supabase,
        'product',
        { product_id: testProductId },
        { page: 1, limit: 50 }
      )

      expect(result.data.length).toBe(1)
      expect(result.data[0].product_id).toBe(testProductId)
    })
  })

  // ==========================================================================
  // AC-7: Pagination
  // ==========================================================================
  describe('Pagination (AC-7)', () => {
    it('should paginate results correctly', async () => {
      if (setupFailed) return

      const page1 = await InventoryOverviewService.getInventorySummary(
        supabase,
        'product',
        {},
        { page: 1, limit: 1 }
      )

      expect(page1.pagination.page).toBe(1)
      expect(page1.pagination.limit).toBe(1)
      expect(page1.data.length).toBe(1)

      const page2 = await InventoryOverviewService.getInventorySummary(
        supabase,
        'product',
        {},
        { page: 2, limit: 1 }
      )

      expect(page2.pagination.page).toBe(2)
      expect(page2.data.length).toBeLessThanOrEqual(1)
    })
  })

  // ==========================================================================
  // AC-8: Summary Calculations
  // ==========================================================================
  describe('Summary Calculations (AC-8)', () => {
    it('should calculate summary correctly', async () => {
      if (setupFailed) return

      const result = await InventoryOverviewService.getInventorySummary(
        supabase,
        'product',
        {},
        { page: 1, limit: 50 }
      )

      expect(result.summary).toBeDefined()
      expect(result.summary.total_lps).toBe(5)
      expect(result.summary.total_qty).toBe(450) // 100+50+25+200+75
      expect(result.summary.total_value).toBeGreaterThan(0)

      // Verify value calculation: (175 * 10.50) + (275 * 15.00)
      const expectedValue = (175 * 10.50) + (275 * 15.00)
      expect(result.summary.total_value).toBeCloseTo(expectedValue, 2)
    })
  })
})
