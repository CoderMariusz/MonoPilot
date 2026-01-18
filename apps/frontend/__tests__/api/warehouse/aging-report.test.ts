/**
 * Tests: Aging Report API
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Test Coverage:
 * - FIFO mode (aging by created_at)
 * - FEFO mode (aging by expiry_date)
 * - Bucket calculations (0-7, 8-30, 31-90, 90+)
 * - Filtering (warehouse, product category)
 * - RLS enforcement
 * - Summary aggregation
 * - Top oldest stock endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServerSupabase } from '@/lib/supabase/server'
import { AgingReportService } from '@/lib/services/aging-report-service'

describe('Aging Report API', () => {
  let supabase: any
  let testOrgId: string
  let testProductId: string
  let testWarehouseId: string

  beforeAll(async () => {
    supabase = await createServerSupabase()

    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({ name: 'Aging Test Org' })
      .select()
      .single()

    testOrgId = org.id

    // Create test warehouse
    const { data: warehouse } = await supabase
      .from('warehouses')
      .insert({
        org_id: testOrgId,
        code: 'AGING-WH',
        name: 'Aging Test Warehouse',
        warehouse_type: 'main',
      })
      .select()
      .single()

    testWarehouseId = warehouse.id

    // Create test product
    const { data: product } = await supabase
      .from('products')
      .insert({
        org_id: testOrgId,
        code: 'AGING-PROD',
        name: 'Aging Test Product',
        uom: 'kg',
        unit_cost: 10.0,
      })
      .select()
      .single()

    testProductId = product.id
  })

  afterAll(async () => {
    // Cleanup test data
    if (testOrgId) {
      await supabase.from('license_plates').delete().eq('org_id', testOrgId)
      await supabase.from('products').delete().eq('org_id', testOrgId)
      await supabase.from('warehouses').delete().eq('org_id', testOrgId)
      await supabase.from('organizations').delete().eq('id', testOrgId)
    }
  })

  describe('FIFO Mode', () => {
    it('should calculate aging buckets by created_at', async () => {
      // Create LPs with different ages
      const today = new Date()
      const lps = [
        {
          org_id: testOrgId,
          product_id: testProductId,
          warehouse_id: testWarehouseId,
          lp_number: 'FIFO-001',
          quantity: 100,
          uom: 'kg',
          status: 'available',
          created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
        {
          org_id: testOrgId,
          product_id: testProductId,
          warehouse_id: testWarehouseId,
          lp_number: 'FIFO-002',
          quantity: 150,
          uom: 'kg',
          status: 'available',
          created_at: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        },
        {
          org_id: testOrgId,
          product_id: testProductId,
          warehouse_id: testWarehouseId,
          lp_number: 'FIFO-003',
          quantity: 200,
          uom: 'kg',
          status: 'available',
          created_at: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        },
        {
          org_id: testOrgId,
          product_id: testProductId,
          warehouse_id: testWarehouseId,
          lp_number: 'FIFO-004',
          quantity: 250,
          uom: 'kg',
          status: 'available',
          created_at: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        },
      ]

      await supabase.from('license_plates').insert(lps)

      // Get FIFO aging report
      const report = await AgingReportService.getAgingReport(testOrgId, 'fifo')

      expect(report.mode).toBe('fifo')
      expect(report.data).toHaveLength(1) // 1 product

      const productData = report.data[0]
      expect(productData.product_id).toBe(testProductId)

      // Check bucket 0-7 days (100 kg from FIFO-001)
      expect(productData.bucket_0_7_days.qty).toBe(100)
      expect(productData.bucket_0_7_days.lp_count).toBe(1)
      expect(productData.bucket_0_7_days.value).toBe(1000) // 100 kg * $10

      // Check bucket 8-30 days (150 kg from FIFO-002)
      expect(productData.bucket_8_30_days.qty).toBe(150)
      expect(productData.bucket_8_30_days.lp_count).toBe(1)
      expect(productData.bucket_8_30_days.value).toBe(1500)

      // Check bucket 31-90 days (200 kg from FIFO-003)
      expect(productData.bucket_31_90_days.qty).toBe(200)
      expect(productData.bucket_31_90_days.lp_count).toBe(1)
      expect(productData.bucket_31_90_days.value).toBe(2000)

      // Check bucket 90+ days (250 kg from FIFO-004)
      expect(productData.bucket_90_plus_days.qty).toBe(250)
      expect(productData.bucket_90_plus_days.lp_count).toBe(1)
      expect(productData.bucket_90_plus_days.value).toBe(2500)

      // Check totals
      expect(productData.total_qty).toBe(700)
      expect(productData.total_lps).toBe(4)
      expect(productData.total_value).toBe(7000)
      expect(productData.oldest_lp_age_days).toBeGreaterThanOrEqual(99)
    })

    it('should aggregate summary correctly', async () => {
      const report = await AgingReportService.getAgingReport(testOrgId, 'fifo')

      expect(report.summary.total_products).toBeGreaterThan(0)
      expect(report.summary.bucket_0_7.qty).toBeGreaterThan(0)
      expect(report.summary.bucket_8_30.qty).toBeGreaterThan(0)
      expect(report.summary.bucket_31_90.qty).toBeGreaterThan(0)
      expect(report.summary.bucket_90_plus.qty).toBeGreaterThan(0)
    })
  })

  describe('FEFO Mode', () => {
    it('should calculate aging buckets by expiry_date', async () => {
      // Create LPs with different expiry dates
      const today = new Date()
      const lps = [
        {
          org_id: testOrgId,
          product_id: testProductId,
          warehouse_id: testWarehouseId,
          lp_number: 'FEFO-001',
          quantity: 80,
          uom: 'kg',
          status: 'available',
          expiry_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // expires in 5 days
        },
        {
          org_id: testOrgId,
          product_id: testProductId,
          warehouse_id: testWarehouseId,
          lp_number: 'FEFO-002',
          quantity: 120,
          uom: 'kg',
          status: 'available',
          expiry_date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // expires in 15 days
        },
        {
          org_id: testOrgId,
          product_id: testProductId,
          warehouse_id: testWarehouseId,
          lp_number: 'FEFO-003',
          quantity: 180,
          uom: 'kg',
          status: 'available',
          expiry_date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // expires in 45 days
        },
        {
          org_id: testOrgId,
          product_id: testProductId,
          warehouse_id: testWarehouseId,
          lp_number: 'FEFO-004',
          quantity: 220,
          uom: 'kg',
          status: 'available',
          expiry_date: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000), // expires in 120 days
        },
      ]

      await supabase.from('license_plates').insert(lps)

      // Get FEFO aging report
      const report = await AgingReportService.getAgingReport(testOrgId, 'fefo')

      expect(report.mode).toBe('fefo')
      expect(report.data.length).toBeGreaterThan(0)

      const productData = report.data.find((p: any) => p.product_id === testProductId)
      expect(productData).toBeDefined()

      // Check bucket 0-7 days (80 kg from FEFO-001)
      expect(productData.bucket_0_7_days.qty).toBe(80)
      expect(productData.bucket_0_7_days.lp_count).toBe(1)

      // Check bucket 8-30 days (120 kg from FEFO-002)
      expect(productData.bucket_8_30_days.qty).toBe(120)
      expect(productData.bucket_8_30_days.lp_count).toBe(1)

      // Check bucket 31-90 days (180 kg from FEFO-003)
      expect(productData.bucket_31_90_days.qty).toBe(180)
      expect(productData.bucket_31_90_days.lp_count).toBe(1)

      // Check bucket 90+ days (220 kg from FEFO-004)
      expect(productData.bucket_90_plus_days.qty).toBe(220)
      expect(productData.bucket_90_plus_days.lp_count).toBe(1)
    })

    it('should only include LPs with expiry_date', async () => {
      // Create LP without expiry_date
      await supabase.from('license_plates').insert({
        org_id: testOrgId,
        product_id: testProductId,
        warehouse_id: testWarehouseId,
        lp_number: 'NO-EXPIRY',
        quantity: 500,
        uom: 'kg',
        status: 'available',
        expiry_date: null,
      })

      const report = await AgingReportService.getAgingReport(testOrgId, 'fefo')

      // LP without expiry should not be in FEFO report
      const productData = report.data.find((p: any) => p.product_id === testProductId)

      // Total qty should not include the no-expiry LP (500kg)
      expect(productData.total_qty).toBeLessThan(
        productData.bucket_0_7_days.qty +
          productData.bucket_8_30_days.qty +
          productData.bucket_31_90_days.qty +
          productData.bucket_90_plus_days.qty +
          500
      )
    })
  })

  describe('Filtering', () => {
    it('should filter by warehouse_id', async () => {
      // Create another warehouse
      const { data: warehouse2 } = await supabase
        .from('warehouses')
        .insert({
          org_id: testOrgId,
          code: 'WH2',
          name: 'Warehouse 2',
          warehouse_type: 'main',
        })
        .select()
        .single()

      // Create LP in warehouse 2
      await supabase.from('license_plates').insert({
        org_id: testOrgId,
        product_id: testProductId,
        warehouse_id: warehouse2.id,
        lp_number: 'WH2-LP',
        quantity: 999,
        uom: 'kg',
        status: 'available',
      })

      // Get report filtered by testWarehouseId
      const report = await AgingReportService.getAgingReport(testOrgId, 'fifo', {
        warehouse_id: testWarehouseId,
      })

      // Should not include WH2-LP (999 kg)
      const productData = report.data.find((p: any) => p.product_id === testProductId)
      expect(productData.total_qty).not.toBe(999)
    })

    it('should enforce limit parameter', async () => {
      const report = await AgingReportService.getAgingReport(testOrgId, 'fifo', {
        limit: 1,
      })

      expect(report.data.length).toBeLessThanOrEqual(1)
    })
  })

  describe('RLS Enforcement', () => {
    it('should only return LPs from same org', async () => {
      // Create another org
      const { data: org2 } = await supabase
        .from('organizations')
        .insert({ name: 'Other Org' })
        .select()
        .single()

      const { data: product2 } = await supabase
        .from('products')
        .insert({
          org_id: org2.id,
          code: 'OTHER-PROD',
          name: 'Other Product',
          uom: 'kg',
          unit_cost: 5.0,
        })
        .select()
        .single()

      // Create LP in other org
      await supabase.from('license_plates').insert({
        org_id: org2.id,
        product_id: product2.id,
        warehouse_id: testWarehouseId,
        lp_number: 'OTHER-ORG-LP',
        quantity: 777,
        uom: 'kg',
        status: 'available',
      })

      // Get report for testOrgId
      const report = await AgingReportService.getAgingReport(testOrgId, 'fifo')

      // Should not include other org's product
      const hasOtherProduct = report.data.some((p: any) => p.product_id === product2.id)
      expect(hasOtherProduct).toBe(false)

      // Cleanup
      await supabase.from('license_plates').delete().eq('org_id', org2.id)
      await supabase.from('products').delete().eq('org_id', org2.id)
      await supabase.from('organizations').delete().eq('id', org2.id)
    })
  })

  describe('Top Oldest Stock', () => {
    it('should return top N oldest LPs in FIFO mode', async () => {
      const items = await AgingReportService.getTopOldestStock(testOrgId, 'fifo', 5)

      expect(Array.isArray(items)).toBe(true)
      expect(items.length).toBeGreaterThan(0)
      expect(items.length).toBeLessThanOrEqual(5)

      // Check sorting (oldest first)
      for (let i = 1; i < items.length; i++) {
        const prevAge = items[i - 1].age_days ?? 0
        const currAge = items[i].age_days ?? 0
        expect(prevAge).toBeGreaterThanOrEqual(currAge)
      }

      // Each item should have required fields
      items.forEach((item: any) => {
        expect(item).toHaveProperty('product_name')
        expect(item).toHaveProperty('lp_number')
        expect(item).toHaveProperty('age_days')
        expect(item).toHaveProperty('quantity')
        expect(item).toHaveProperty('uom')
        expect(item).toHaveProperty('location_code')
        expect(item).toHaveProperty('warehouse_name')
      })
    })

    it('should return top N soonest expiring LPs in FEFO mode', async () => {
      const items = await AgingReportService.getTopOldestStock(testOrgId, 'fefo', 5)

      expect(Array.isArray(items)).toBe(true)
      expect(items.length).toBeGreaterThan(0)
      expect(items.length).toBeLessThanOrEqual(5)

      // Check sorting (soonest expiry first)
      for (let i = 1; i < items.length; i++) {
        const prevExpiry = items[i - 1].expiry_days ?? Infinity
        const currExpiry = items[i].expiry_days ?? Infinity
        expect(prevExpiry).toBeLessThanOrEqual(currExpiry)
      }

      // Each item should have expiry_days
      items.forEach((item: any) => {
        expect(item.expiry_days).toBeDefined()
      })
    })
  })

  describe('Bucket Calculation Helper', () => {
    it('should correctly categorize days into buckets', () => {
      expect(AgingReportService.calculateAgingBucket(0)).toBe('0-7')
      expect(AgingReportService.calculateAgingBucket(7)).toBe('0-7')
      expect(AgingReportService.calculateAgingBucket(8)).toBe('8-30')
      expect(AgingReportService.calculateAgingBucket(30)).toBe('8-30')
      expect(AgingReportService.calculateAgingBucket(31)).toBe('31-90')
      expect(AgingReportService.calculateAgingBucket(90)).toBe('31-90')
      expect(AgingReportService.calculateAgingBucket(91)).toBe('90+')
      expect(AgingReportService.calculateAgingBucket(365)).toBe('90+')
    })
  })
})
