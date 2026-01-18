/**
 * Aging Report Service
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Handles aging calculations for inventory using FIFO/FEFO modes.
 *
 * FIFO Mode (First-In-First-Out):
 * - Aging based on created_at (receipt date)
 * - Bucket calculation: CURRENT_DATE - lp.created_at
 * - Sort: ORDER BY created_at ASC (oldest first)
 *
 * FEFO Mode (First-Expired-First-Out):
 * - Aging based on expiry_date
 * - Bucket calculation: lp.expiry_date - CURRENT_DATE
 * - Sort: ORDER BY expiry_date ASC (soonest expiry first)
 * - Filter: Only LPs with expiry_date NOT NULL
 */

import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Aging bucket breakdown
 */
export interface AgingBucketData {
  qty: number
  lp_count: number
  value: number
}

/**
 * Product aging data
 */
export interface ProductAgingData {
  product_id: string
  product_name: string
  product_sku: string
  uom: string

  bucket_0_7_days: AgingBucketData
  bucket_8_30_days: AgingBucketData
  bucket_31_90_days: AgingBucketData
  bucket_90_plus_days: AgingBucketData

  total_qty: number
  total_lps: number
  total_value: number
  oldest_lp_age_days: number | null
  soonest_expiry_days: number | null
}

/**
 * Aging report summary
 */
export interface AgingSummary {
  total_products: number
  bucket_0_7: { qty: number; value: number }
  bucket_8_30: { qty: number; value: number }
  bucket_31_90: { qty: number; value: number }
  bucket_90_plus: { qty: number; value: number }
}

/**
 * Aging report response
 */
export interface AgingReportResponse {
  mode: 'fifo' | 'fefo'
  data: ProductAgingData[]
  summary: AgingSummary
}

/**
 * Oldest stock item
 */
export interface OldestStockItem {
  product_name: string
  lp_number: string
  age_days: number | null
  expiry_days: number | null
  quantity: number
  uom: string
  location_code: string
  warehouse_name: string
}

/**
 * Aging filters
 */
export interface AgingFilters {
  warehouse_id?: string
  product_category_id?: string
  limit?: number
}

export class AgingReportService {
  /**
   * Calculate which aging bucket a given number of days falls into
   */
  static calculateAgingBucket(days: number): '0-7' | '8-30' | '31-90' | '90+' {
    if (days <= 7) return '0-7'
    if (days <= 30) return '8-30'
    if (days <= 90) return '31-90'
    return '90+'
  }

  /**
   * Get aging report with FIFO or FEFO mode
   */
  static async getAgingReport(
    orgId: string,
    mode: 'fifo' | 'fefo',
    filters: AgingFilters = {}
  ): Promise<AgingReportResponse> {
    const supabase = await createServerSupabase()
    const limit = Math.min(filters.limit ?? 50, 100)

    try {
      if (mode === 'fifo') {
        return await this.getFIFOAgingReport(supabase, orgId, filters, limit)
      } else {
        return await this.getFEFOAgingReport(supabase, orgId, filters, limit)
      }
    } catch (error) {
      console.error(`Error fetching ${mode.toUpperCase()} aging report:`, error)
      throw error
    }
  }

  /**
   * Get FIFO aging report (aging by receipt date)
   * Uses client-side aggregation for bucket calculations
   */
  private static async getFIFOAgingReport(
    supabase: any,
    orgId: string,
    filters: AgingFilters,
    limit: number
  ): Promise<AgingReportResponse> {
    // Fetch all available LPs with product info
    let query = supabase
      .from('license_plates')
      .select(`
        id,
        product_id,
        quantity,
        created_at,
        products!inner(id, name, code, uom, unit_cost, category_id)
      `)
      .eq('org_id', orgId)
      .eq('status', 'available')

    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }

    if (filters.product_category_id) {
      query = query.eq('products.category_id', filters.product_category_id)
    }

    const { data: licensePlates, error } = await query

    if (error) {
      console.error('FIFO query error:', error)
      throw new Error('Failed to fetch FIFO aging data')
    }

    // Group by product and calculate buckets
    const productMap = new Map<string, ProductAgingData>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const lp of licensePlates || []) {
      const product = (lp as any).products
      if (!product) continue

      const productId = product.id
      const createdAt = new Date(lp.created_at)
      createdAt.setHours(0, 0, 0, 0)
      const ageDays = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

      // Get or create product entry
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          product_name: product.name,
          product_sku: product.code,
          uom: product.uom,
          bucket_0_7_days: { qty: 0, lp_count: 0, value: 0 },
          bucket_8_30_days: { qty: 0, lp_count: 0, value: 0 },
          bucket_31_90_days: { qty: 0, lp_count: 0, value: 0 },
          bucket_90_plus_days: { qty: 0, lp_count: 0, value: 0 },
          total_qty: 0,
          total_lps: 0,
          total_value: 0,
          oldest_lp_age_days: null,
          soonest_expiry_days: null,
        })
      }

      const productData = productMap.get(productId)!
      const qty = parseFloat(lp.quantity.toString())
      const unitCost = parseFloat(product.unit_cost?.toString() || '0')
      const value = qty * unitCost

      // Determine bucket
      const bucket = this.calculateAgingBucket(ageDays)

      // Update bucket data
      if (bucket === '0-7') {
        productData.bucket_0_7_days.qty += qty
        productData.bucket_0_7_days.lp_count += 1
        productData.bucket_0_7_days.value += value
      } else if (bucket === '8-30') {
        productData.bucket_8_30_days.qty += qty
        productData.bucket_8_30_days.lp_count += 1
        productData.bucket_8_30_days.value += value
      } else if (bucket === '31-90') {
        productData.bucket_31_90_days.qty += qty
        productData.bucket_31_90_days.lp_count += 1
        productData.bucket_31_90_days.value += value
      } else {
        productData.bucket_90_plus_days.qty += qty
        productData.bucket_90_plus_days.lp_count += 1
        productData.bucket_90_plus_days.value += value
      }

      // Update totals
      productData.total_qty += qty
      productData.total_lps += 1
      productData.total_value += value

      // Track oldest age
      if (productData.oldest_lp_age_days === null || ageDays > productData.oldest_lp_age_days) {
        productData.oldest_lp_age_days = ageDays
      }
    }

    // Convert map to array and sort by total value (descending)
    const products = Array.from(productMap.values())
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, limit)

    // Calculate summary
    const summary = this.calculateSummary(products)

    return {
      mode: 'fifo',
      data: products,
      summary,
    }
  }

  /**
   * Get FEFO aging report (aging by expiry date)
   * Uses client-side aggregation for bucket calculations
   */
  private static async getFEFOAgingReport(
    supabase: any,
    orgId: string,
    filters: AgingFilters,
    limit: number
  ): Promise<AgingReportResponse> {
    // Fetch all available LPs with expiry_date
    let query = supabase
      .from('license_plates')
      .select(`
        id,
        product_id,
        quantity,
        expiry_date,
        products!inner(id, name, code, uom, unit_cost, category_id)
      `)
      .eq('org_id', orgId)
      .eq('status', 'available')
      .not('expiry_date', 'is', null)

    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }

    if (filters.product_category_id) {
      query = query.eq('products.category_id', filters.product_category_id)
    }

    const { data: licensePlates, error } = await query

    if (error) {
      console.error('FEFO query error:', error)
      throw new Error('Failed to fetch FEFO aging data')
    }

    // Group by product and calculate buckets
    const productMap = new Map<string, ProductAgingData>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const lp of licensePlates || []) {
      const product = (lp as any).products
      if (!product || !lp.expiry_date) continue

      const productId = product.id
      const expiryDate = new Date(lp.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Get or create product entry
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product_id: productId,
          product_name: product.name,
          product_sku: product.code,
          uom: product.uom,
          bucket_0_7_days: { qty: 0, lp_count: 0, value: 0 },
          bucket_8_30_days: { qty: 0, lp_count: 0, value: 0 },
          bucket_31_90_days: { qty: 0, lp_count: 0, value: 0 },
          bucket_90_plus_days: { qty: 0, lp_count: 0, value: 0 },
          total_qty: 0,
          total_lps: 0,
          total_value: 0,
          oldest_lp_age_days: null,
          soonest_expiry_days: null,
        })
      }

      const productData = productMap.get(productId)!
      const qty = parseFloat(lp.quantity.toString())
      const unitCost = parseFloat(product.unit_cost?.toString() || '0')
      const value = qty * unitCost

      // Determine bucket (same logic but based on days until expiry)
      const bucket = this.calculateAgingBucket(Math.max(0, daysUntilExpiry))

      // Update bucket data
      if (bucket === '0-7') {
        productData.bucket_0_7_days.qty += qty
        productData.bucket_0_7_days.lp_count += 1
        productData.bucket_0_7_days.value += value
      } else if (bucket === '8-30') {
        productData.bucket_8_30_days.qty += qty
        productData.bucket_8_30_days.lp_count += 1
        productData.bucket_8_30_days.value += value
      } else if (bucket === '31-90') {
        productData.bucket_31_90_days.qty += qty
        productData.bucket_31_90_days.lp_count += 1
        productData.bucket_31_90_days.value += value
      } else {
        productData.bucket_90_plus_days.qty += qty
        productData.bucket_90_plus_days.lp_count += 1
        productData.bucket_90_plus_days.value += value
      }

      // Update totals
      productData.total_qty += qty
      productData.total_lps += 1
      productData.total_value += value

      // Track soonest expiry
      if (productData.soonest_expiry_days === null || daysUntilExpiry < productData.soonest_expiry_days) {
        productData.soonest_expiry_days = daysUntilExpiry
      }
    }

    // Convert map to array and sort by soonest expiry (ascending)
    const products = Array.from(productMap.values())
      .sort((a, b) => {
        const aExpiry = a.soonest_expiry_days ?? Infinity
        const bExpiry = b.soonest_expiry_days ?? Infinity
        return aExpiry - bExpiry
      })
      .slice(0, limit)

    // Calculate summary
    const summary = this.calculateSummary(products)

    return {
      mode: 'fefo',
      data: products,
      summary,
    }
  }

  /**
   * Calculate summary aggregates from product data
   */
  private static calculateSummary(products: ProductAgingData[]): AgingSummary {
    const summary: AgingSummary = {
      total_products: products.length,
      bucket_0_7: { qty: 0, value: 0 },
      bucket_8_30: { qty: 0, value: 0 },
      bucket_31_90: { qty: 0, value: 0 },
      bucket_90_plus: { qty: 0, value: 0 },
    }

    for (const product of products) {
      summary.bucket_0_7.qty += product.bucket_0_7_days.qty
      summary.bucket_0_7.value += product.bucket_0_7_days.value

      summary.bucket_8_30.qty += product.bucket_8_30_days.qty
      summary.bucket_8_30.value += product.bucket_8_30_days.value

      summary.bucket_31_90.qty += product.bucket_31_90_days.qty
      summary.bucket_31_90.value += product.bucket_31_90_days.value

      summary.bucket_90_plus.qty += product.bucket_90_plus_days.qty
      summary.bucket_90_plus.value += product.bucket_90_plus_days.value
    }

    return summary
  }

  /**
   * Get top N oldest stock items
   */
  static async getTopOldestStock(
    orgId: string,
    mode: 'fifo' | 'fefo',
    limit: number = 10
  ): Promise<OldestStockItem[]> {
    const supabase = await createServerSupabase()

    try {
      if (mode === 'fifo') {
        // Get oldest by created_at
        const { data, error } = await supabase
          .from('license_plates')
          .select(`
            lp_number,
            quantity,
            created_at,
            products!inner(name, uom),
            locations!inner(location_code),
            warehouses!inner(name)
          `)
          .eq('org_id', orgId)
          .eq('status', 'available')
          .order('created_at', { ascending: true })
          .limit(Math.min(limit, 50))

        if (error) throw error

        return (data || []).map((lp: any) => {
          const ageMs = Date.now() - new Date(lp.created_at).getTime()
          const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))

          return {
            product_name: lp.products?.name ?? 'Unknown',
            lp_number: lp.lp_number,
            age_days: ageDays,
            expiry_days: null,
            quantity: lp.quantity,
            uom: lp.products?.uom ?? '',
            location_code: lp.locations?.location_code ?? '',
            warehouse_name: lp.warehouses?.name ?? '',
          }
        })
      } else {
        // Get soonest expiry
        const { data, error } = await supabase
          .from('license_plates')
          .select(`
            lp_number,
            quantity,
            expiry_date,
            products!inner(name, uom),
            locations!inner(location_code),
            warehouses!inner(name)
          `)
          .eq('org_id', orgId)
          .eq('status', 'available')
          .not('expiry_date', 'is', null)
          .order('expiry_date', { ascending: true })
          .limit(Math.min(limit, 50))

        if (error) throw error

        return (data || []).map((lp: any) => {
          const expiryMs = new Date(lp.expiry_date).getTime() - Date.now()
          const expiryDays = Math.floor(expiryMs / (1000 * 60 * 60 * 24))

          return {
            product_name: lp.products?.name ?? 'Unknown',
            lp_number: lp.lp_number,
            age_days: null,
            expiry_days: expiryDays,
            quantity: lp.quantity,
            uom: lp.products?.uom ?? '',
            location_code: lp.locations?.location_code ?? '',
            warehouse_name: lp.warehouses?.name ?? '',
          }
        })
      }
    } catch (error) {
      console.error(`Error fetching top oldest stock (${mode}):`, error)
      return []
    }
  }
}
