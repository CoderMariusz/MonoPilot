/**
 * Expiry Alert Service
 * Story: 05.28 - Expiry Alerts Dashboard
 * Extended for: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Handles expiring and expired inventory queries with pagination, filtering,
 * and tier-based categorization.
 */

import { createServerSupabase } from '@/lib/supabase/server'
import type {
  ExpiringLP,
  ExpirySummary,
  ExpiringPaginatedResponse,
  ExpiryTier,
} from '../validation/expiry-alert-schema'

/**
 * Calculate days until expiry from expiry date
 * @param expiryDate Expiry date string (YYYY-MM-DD)
 * @returns Number of days (positive = future, negative = past, 0 = today)
 */
export function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Determine expiry tier based on days remaining
 * @param daysRemaining Number of days until expiry
 * @returns ExpiryTier classification
 */
export function calculateExpiryTier(daysRemaining: number): ExpiryTier {
  if (daysRemaining < 0) {
    return 'expired'
  } else if (daysRemaining >= 0 && daysRemaining <= 7) {
    return 'critical'
  } else if (daysRemaining > 7 && daysRemaining <= 30) {
    return 'warning'
  } else {
    return 'ok'
  }
}

interface ExpiryFilters {
  warehouse_id?: string
  location_id?: string
  product_id?: string
  tier?: 'expired' | 'critical' | 'warning' | 'ok' | 'all'
}

interface PaginationParams {
  page: number
  limit: number
}

/**
 * Get expiring LPs with pagination and filtering
 * @param orgId Organization ID for RLS filtering
 * @param days Days threshold (items expiring within X days)
 * @param filters Optional filters (warehouse, location, product, tier)
 * @param pagination Pagination parameters
 * @returns Paginated response with summary and data
 */
export async function getExpiringWithPagination(
  orgId: string,
  days: number,
  filters: ExpiryFilters = {},
  pagination: PaginationParams = { page: 1, limit: 50 }
): Promise<ExpiringPaginatedResponse> {
  const supabase = await createServerSupabase()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  const futureDateStr = futureDate.toISOString().split('T')[0]

  try {
    // Build base query for data
    let dataQuery = supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        uom,
        location_id,
        warehouse_id,
        batch_number,
        expiry_date,
        products!inner(name, sku, unit_cost),
        locations!inner(code),
        warehouses!inner(name)
      `)
      .eq('org_id', orgId)
      .eq('status', 'available')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDateStr)

    // Build count query (same filters, no joins needed)
    let countQuery = supabase
      .from('license_plates')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'available')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDateStr)

    // Apply optional filters
    if (filters.warehouse_id) {
      dataQuery = dataQuery.eq('warehouse_id', filters.warehouse_id)
      countQuery = countQuery.eq('warehouse_id', filters.warehouse_id)
    }

    if (filters.location_id) {
      dataQuery = dataQuery.eq('location_id', filters.location_id)
      countQuery = countQuery.eq('location_id', filters.location_id)
    }

    if (filters.product_id) {
      dataQuery = dataQuery.eq('product_id', filters.product_id)
      countQuery = countQuery.eq('product_id', filters.product_id)
    }

    // Execute count query
    const { count, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    const total = count ?? 0

    // Calculate pagination
    const offset = (pagination.page - 1) * pagination.limit
    const pages = Math.ceil(total / pagination.limit)

    // Execute data query with pagination
    dataQuery = dataQuery
      .order('expiry_date', { ascending: true })
      .range(offset, offset + pagination.limit - 1)

    const { data: lpData, error: dataError } = await dataQuery

    if (dataError) {
      throw dataError
    }

    // Transform data and calculate tiers
    const items: ExpiringLP[] = (lpData || []).map((lp) => {
      const daysUntilExpiry = calculateDaysUntilExpiry(lp.expiry_date!)
      const tier = calculateExpiryTier(daysUntilExpiry)
      const product = lp.products as any
      const location = lp.locations as any
      const warehouse = lp.warehouses as any
      const unitCost = product?.unit_cost ?? 0
      const value = lp.quantity * unitCost

      return {
        lp_id: lp.id,
        lp_number: lp.lp_number,
        product_id: lp.product_id,
        product_name: product?.name ?? 'Unknown',
        product_sku: product?.sku,
        quantity: lp.quantity,
        uom: lp.uom,
        location_id: lp.location_id,
        location_code: location?.code ?? 'Unknown',
        warehouse_id: lp.warehouse_id,
        warehouse_name: warehouse?.name ?? 'Unknown',
        batch_number: lp.batch_number,
        expiry_date: lp.expiry_date!,
        days_until_expiry: daysUntilExpiry,
        tier,
        unit_cost: unitCost,
        value,
      }
    })

    // Filter by tier if specified (client-side for now)
    let filteredItems = items
    if (filters.tier && filters.tier !== 'all') {
      filteredItems = items.filter((item) => item.tier === filters.tier)
    }

    // Calculate summary from all items (not just current page)
    const summary = await getExpirySummary(orgId, days)

    return {
      days_threshold: days,
      summary,
      data: filteredItems,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages,
      },
    }
  } catch (error) {
    console.error('Error fetching expiring LPs:', error)
    throw error
  }
}

/**
 * Get expiry summary with tier breakdown
 * @param orgId Organization ID for RLS filtering
 * @param days Days threshold (items expiring within X days)
 * @returns ExpirySummary with counts per tier and total value
 */
export async function getExpirySummary(
  orgId: string,
  days: number
): Promise<ExpirySummary> {
  const supabase = await createServerSupabase()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  const futureDateStr = futureDate.toISOString().split('T')[0]

  try {
    // Get all expiring LPs with minimal data for summary
    const { data: lpData, error } = await supabase
      .from('license_plates')
      .select(`
        expiry_date,
        quantity,
        products!inner(unit_cost)
      `)
      .eq('org_id', orgId)
      .eq('status', 'available')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDateStr)

    if (error) {
      throw error
    }

    // Calculate tier counts and total value
    let expired = 0
    let critical = 0
    let warning = 0
    let ok = 0
    let totalValue = 0

    for (const lp of lpData || []) {
      const daysUntilExpiry = calculateDaysUntilExpiry(lp.expiry_date!)
      const tier = calculateExpiryTier(daysUntilExpiry)
      const unitCost = (lp.products as any)?.unit_cost ?? 0
      const value = lp.quantity * unitCost

      totalValue += value

      switch (tier) {
        case 'expired':
          expired++
          break
        case 'critical':
          critical++
          break
        case 'warning':
          warning++
          break
        case 'ok':
          ok++
          break
      }
    }

    return {
      expired,
      critical,
      warning,
      ok,
      total_value: totalValue,
    }
  } catch (error) {
    console.error('Error fetching expiry summary:', error)
    return {
      expired: 0,
      critical: 0,
      warning: 0,
      ok: 0,
      total_value: 0,
    }
  }
}

/**
 * Get expired LPs (past expiry date)
 * @param orgId Organization ID for RLS filtering
 * @param limit Maximum number of results
 * @returns Array of expired LPs
 */
export async function getExpiredLPs(
  orgId: string,
  limit: number = 50
): Promise<ExpiringLP[]> {
  const supabase = await createServerSupabase()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  try {
    const { data: lpData, error } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        uom,
        location_id,
        warehouse_id,
        batch_number,
        expiry_date,
        products!inner(name, sku, unit_cost),
        locations!inner(code),
        warehouses!inner(name)
      `)
      .eq('org_id', orgId)
      .eq('status', 'available')
      .not('expiry_date', 'is', null)
      .lt('expiry_date', todayStr)
      .order('expiry_date', { ascending: true })
      .limit(limit)

    if (error) {
      throw error
    }

    return (lpData || []).map((lp) => {
      const daysUntilExpiry = calculateDaysUntilExpiry(lp.expiry_date!)
      const product = lp.products as any
      const location = lp.locations as any
      const warehouse = lp.warehouses as any
      const unitCost = product?.unit_cost ?? 0
      const value = lp.quantity * unitCost

      return {
        lp_id: lp.id,
        lp_number: lp.lp_number,
        product_id: lp.product_id,
        product_name: product?.name ?? 'Unknown',
        product_sku: product?.sku,
        quantity: lp.quantity,
        uom: lp.uom,
        location_id: lp.location_id,
        location_code: location?.code ?? 'Unknown',
        warehouse_id: lp.warehouse_id,
        warehouse_name: warehouse?.name ?? 'Unknown',
        batch_number: lp.batch_number,
        expiry_date: lp.expiry_date!,
        days_until_expiry: daysUntilExpiry,
        tier: 'expired',
        unit_cost: unitCost,
        value,
      }
    })
  } catch (error) {
    console.error('Error fetching expired LPs:', error)
    return []
  }
}

/**
 * Export expiring items to CSV format
 * @param orgId Organization ID for RLS filtering
 * @param days Days threshold
 * @returns CSV string buffer
 */
export async function exportExpiringToCSV(
  orgId: string,
  days: number
): Promise<string> {
  const result = await getExpiringWithPagination(
    orgId,
    days,
    {},
    { page: 1, limit: 10000 } // Large limit for export
  )

  // CSV header
  const headers = [
    'LP Number',
    'Product',
    'SKU',
    'Qty',
    'UoM',
    'Expiry Date',
    'Days Remaining',
    'Location',
    'Warehouse',
    'Value',
  ]

  // CSV rows
  const rows = result.data.map((item) => [
    item.lp_number,
    item.product_name,
    item.product_sku || '',
    item.quantity.toString(),
    item.uom,
    item.expiry_date,
    item.days_until_expiry.toString(),
    item.location_code,
    item.warehouse_name,
    item.value.toFixed(2),
  ])

  // Combine into CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  return csvContent
}
