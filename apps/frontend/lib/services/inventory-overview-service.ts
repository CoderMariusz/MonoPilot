/**
 * Inventory Overview Service
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Purpose: Aggregate inventory data with grouping by product/location/warehouse
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level
 * - XSS: SAFE - React auto-escapes all rendered values
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Types
// =============================================================================

export interface InventoryFilters {
  warehouse_id?: string
  location_id?: string
  product_id?: string
  status?: 'available' | 'reserved' | 'blocked' | 'all'
  date_from?: string
  date_to?: string
  search?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

// Product grouping response
export interface InventoryByProduct {
  product_id: string
  product_name: string
  product_sku: string
  available_qty: number
  reserved_qty: number
  blocked_qty: number
  total_qty: number
  lp_count: number
  locations_count: number
  avg_age_days: number
  total_value: number
  uom: string
}

// Location grouping response
export interface InventoryByLocation {
  location_id: string
  location_code: string
  warehouse_id: string
  warehouse_name: string
  total_lps: number
  products_count: number
  total_qty: number
  occupancy_pct: number
  total_value: number
}

// Warehouse grouping response
export interface InventoryByWarehouse {
  warehouse_id: string
  warehouse_name: string
  total_lps: number
  products_count: number
  locations_count: number
  total_value: number
  expiring_soon: number
  expired: number
}

export interface InventorySummary {
  total_lps: number
  total_qty: number
  total_value: number
}

export interface InventoryOverviewResponse {
  data: (InventoryByProduct | InventoryByLocation | InventoryByWarehouse)[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: InventorySummary
}

// =============================================================================
// Service Methods
// =============================================================================

/**
 * Get inventory summary aggregated by grouping type
 */
export async function getInventorySummary(
  supabase: SupabaseClient,
  groupBy: 'product' | 'location' | 'warehouse',
  filters: InventoryFilters,
  pagination: PaginationParams
): Promise<InventoryOverviewResponse> {
  switch (groupBy) {
    case 'product':
      return getInventoryByProduct(supabase, filters, pagination)
    case 'location':
      return getInventoryByLocation(supabase, filters, pagination)
    case 'warehouse':
      return getInventoryByWarehouse(supabase, filters, pagination)
    default:
      throw new Error(`Invalid groupBy value: ${groupBy}`)
  }
}

/**
 * Group inventory by product
 * Query aggregates LP data by product_id
 */
async function getInventoryByProduct(
  supabase: SupabaseClient,
  filters: InventoryFilters,
  pagination: PaginationParams
): Promise<InventoryOverviewResponse> {
  const { page, limit } = pagination
  const offset = (page - 1) * limit

  // Build base query - get all non-consumed LPs with product info
  let query = supabase
    .from('license_plates')
    .select(`
      product_id,
      quantity,
      uom,
      status,
      location_id,
      created_at,
      products!inner(name, code, cost_per_unit)
    `, { count: 'exact' })
    .neq('status', 'consumed')

  // Apply filters
  query = applyFilters(query, filters)

  // Execute query to get raw data
  const { data: rawData, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch inventory by product: ${error.message}`)
  }

  if (!rawData || rawData.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
      summary: {
        total_lps: 0,
        total_qty: 0,
        total_value: 0,
      },
    }
  }

  // Aggregate by product in application layer
  const productMap = new Map<string, {
    product_id: string
    product_name: string
    product_sku: string
    available_qty: number
    reserved_qty: number
    blocked_qty: number
    total_qty: number
    lp_count: number
    locations: Set<string>
    created_dates: Date[]
    total_value: number
    uom: string
  }>()

  for (const row of rawData as any[]) {
    const productId = row.product_id
    const product = row.products

    if (!productMap.has(productId)) {
      productMap.set(productId, {
        product_id: productId,
        product_name: product?.name || 'Unknown',
        product_sku: product?.code || 'N/A',
        available_qty: 0,
        reserved_qty: 0,
        blocked_qty: 0,
        total_qty: 0,
        lp_count: 0,
        locations: new Set(),
        created_dates: [],
        total_value: 0,
        uom: row.uom || 'kg',
      })
    }

    const item = productMap.get(productId)!
    const qty = parseFloat(row.quantity) || 0
    const unitCost = parseFloat(product?.cost_per_unit) || 0

    item.lp_count++
    item.total_qty += qty
    item.total_value += qty * unitCost

    if (row.status === 'available') item.available_qty += qty
    else if (row.status === 'reserved') item.reserved_qty += qty
    else if (row.status === 'blocked') item.blocked_qty += qty

    if (row.location_id) item.locations.add(row.location_id)
    if (row.created_at) item.created_dates.push(new Date(row.created_at))
  }

  // Convert to array and calculate avg_age_days
  const today = new Date()
  const aggregated: InventoryByProduct[] = Array.from(productMap.values()).map(item => ({
    product_id: item.product_id,
    product_name: item.product_name,
    product_sku: item.product_sku,
    available_qty: item.available_qty,
    reserved_qty: item.reserved_qty,
    blocked_qty: item.blocked_qty,
    total_qty: item.total_qty,
    lp_count: item.lp_count,
    locations_count: item.locations.size,
    avg_age_days: item.created_dates.length > 0
      ? Math.floor(item.created_dates.reduce((sum, date) => {
          const diffTime = today.getTime() - date.getTime()
          return sum + (diffTime / (1000 * 60 * 60 * 24))
        }, 0) / item.created_dates.length)
      : 0,
    total_value: Math.round(item.total_value * 100) / 100,
    uom: item.uom,
  }))

  // Sort by total_value DESC
  aggregated.sort((a, b) => b.total_value - a.total_value)

  // Apply pagination
  const totalProducts = aggregated.length
  const paginatedData = aggregated.slice(offset, offset + limit)

  // Calculate summary
  const summary = calculateSummary(rawData)

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: totalProducts,
      pages: Math.ceil(totalProducts / limit),
    },
    summary,
  }
}

/**
 * Group inventory by location
 */
async function getInventoryByLocation(
  supabase: SupabaseClient,
  filters: InventoryFilters,
  pagination: PaginationParams
): Promise<InventoryOverviewResponse> {
  const { page, limit } = pagination
  const offset = (page - 1) * limit

  // Build base query
  let query = supabase
    .from('license_plates')
    .select(`
      location_id,
      quantity,
      product_id,
      locations!inner(code, warehouse_id, warehouses(name)),
      products(cost_per_unit)
    `, { count: 'exact' })
    .neq('status', 'consumed')

  // Apply filters
  query = applyFilters(query, filters)

  const { data: rawData, error } = await query

  if (error) {
    throw new Error(`Failed to fetch inventory by location: ${error.message}`)
  }

  if (!rawData || rawData.length === 0) {
    return {
      data: [],
      pagination: { page, limit, total: 0, pages: 0 },
      summary: { total_lps: 0, total_qty: 0, total_value: 0 },
    }
  }

  // Aggregate by location
  const locationMap = new Map<string, {
    location_id: string
    location_code: string
    warehouse_id: string
    warehouse_name: string
    total_lps: number
    products: Set<string>
    total_qty: number
    total_value: number
  }>()

  for (const row of rawData as any[]) {
    const locationId = row.location_id
    const location = row.locations

    if (!locationMap.has(locationId)) {
      locationMap.set(locationId, {
        location_id: locationId,
        location_code: location?.code || 'Unknown',
        warehouse_id: location?.warehouse_id || '',
        warehouse_name: location?.warehouses?.name || 'Unknown',
        total_lps: 0,
        products: new Set(),
        total_qty: 0,
        total_value: 0,
      })
    }

    const item = locationMap.get(locationId)!
    const qty = parseFloat(row.quantity) || 0
    const unitCost = parseFloat(row.products?.cost_per_unit) || 0

    item.total_lps++
    item.total_qty += qty
    item.total_value += qty * unitCost
    if (row.product_id) item.products.add(row.product_id)
  }

  // Convert to array
  const aggregated: InventoryByLocation[] = Array.from(locationMap.values()).map(item => ({
    location_id: item.location_id,
    location_code: item.location_code,
    warehouse_id: item.warehouse_id,
    warehouse_name: item.warehouse_name,
    total_lps: item.total_lps,
    products_count: item.products.size,
    total_qty: item.total_qty,
    occupancy_pct: 0, // TODO: Calculate based on location max_capacity
    total_value: Math.round(item.total_value * 100) / 100,
  }))

  // Sort by total_value DESC
  aggregated.sort((a, b) => b.total_value - a.total_value)

  // Apply pagination
  const totalLocations = aggregated.length
  const paginatedData = aggregated.slice(offset, offset + limit)

  const summary = calculateSummary(rawData)

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: totalLocations,
      pages: Math.ceil(totalLocations / limit),
    },
    summary,
  }
}

/**
 * Group inventory by warehouse
 */
async function getInventoryByWarehouse(
  supabase: SupabaseClient,
  filters: InventoryFilters,
  pagination: PaginationParams
): Promise<InventoryOverviewResponse> {
  const { page, limit } = pagination
  const offset = (page - 1) * limit

  // Build base query
  let query = supabase
    .from('license_plates')
    .select(`
      warehouse_id,
      quantity,
      product_id,
      location_id,
      expiry_date,
      warehouses!inner(name),
      products(cost_per_unit)
    `, { count: 'exact' })
    .neq('status', 'consumed')

  // Apply filters
  query = applyFilters(query, filters)

  const { data: rawData, error } = await query

  if (error) {
    throw new Error(`Failed to fetch inventory by warehouse: ${error.message}`)
  }

  if (!rawData || rawData.length === 0) {
    return {
      data: [],
      pagination: { page, limit, total: 0, pages: 0 },
      summary: { total_lps: 0, total_qty: 0, total_value: 0 },
    }
  }

  // Aggregate by warehouse
  const warehouseMap = new Map<string, {
    warehouse_id: string
    warehouse_name: string
    total_lps: number
    products: Set<string>
    locations: Set<string>
    total_value: number
    expiring_soon: number
    expired: number
  }>()

  const today = new Date()
  const in30Days = new Date()
  in30Days.setDate(today.getDate() + 30)

  for (const row of rawData as any[]) {
    const warehouseId = row.warehouse_id
    const warehouse = row.warehouses

    if (!warehouseMap.has(warehouseId)) {
      warehouseMap.set(warehouseId, {
        warehouse_id: warehouseId,
        warehouse_name: warehouse?.name || 'Unknown',
        total_lps: 0,
        products: new Set(),
        locations: new Set(),
        total_value: 0,
        expiring_soon: 0,
        expired: 0,
      })
    }

    const item = warehouseMap.get(warehouseId)!
    const qty = parseFloat(row.quantity) || 0
    const unitCost = parseFloat(row.products?.cost_per_unit) || 0

    item.total_lps++
    item.total_value += qty * unitCost
    if (row.product_id) item.products.add(row.product_id)
    if (row.location_id) item.locations.add(row.location_id)

    // Check expiry
    if (row.expiry_date) {
      const expiryDate = new Date(row.expiry_date)
      if (expiryDate < today) {
        item.expired++
      } else if (expiryDate <= in30Days) {
        item.expiring_soon++
      }
    }
  }

  // Convert to array
  const aggregated: InventoryByWarehouse[] = Array.from(warehouseMap.values()).map(item => ({
    warehouse_id: item.warehouse_id,
    warehouse_name: item.warehouse_name,
    total_lps: item.total_lps,
    products_count: item.products.size,
    locations_count: item.locations.size,
    total_value: Math.round(item.total_value * 100) / 100,
    expiring_soon: item.expiring_soon,
    expired: item.expired,
  }))

  // Sort by total_value DESC
  aggregated.sort((a, b) => b.total_value - a.total_value)

  // Apply pagination
  const totalWarehouses = aggregated.length
  const paginatedData = aggregated.slice(offset, offset + limit)

  const summary = calculateSummary(rawData)

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: totalWarehouses,
      pages: Math.ceil(totalWarehouses / limit),
    },
    summary,
  }
}

/**
 * Apply filters to query
 */
function applyFilters(query: any, filters: InventoryFilters): any {
  const { warehouse_id, location_id, product_id, status, date_from, date_to, search } = filters

  if (warehouse_id) {
    query = query.eq('warehouse_id', warehouse_id)
  }

  if (location_id) {
    query = query.eq('location_id', location_id)
  }

  if (product_id) {
    query = query.eq('product_id', product_id)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (date_from) {
    query = query.gte('created_at', date_from)
  }

  if (date_to) {
    query = query.lte('created_at', date_to)
  }

  if (search) {
    // Search by LP number prefix
    query = query.ilike('lp_number', `${search}%`)
  }

  return query
}

/**
 * Calculate summary from raw data
 */
function calculateSummary(rawData: any[]): InventorySummary {
  let total_qty = 0
  let total_value = 0

  for (const row of rawData) {
    const qty = parseFloat(row.quantity) || 0
    const unitCost = parseFloat(row.products?.cost_per_unit || row.cost_per_unit) || 0
    total_qty += qty
    total_value += qty * unitCost
  }

  return {
    total_lps: rawData.length,
    total_qty: Math.round(total_qty * 100) / 100,
    total_value: Math.round(total_value * 100) / 100,
  }
}

/**
 * Calculate overall summary (for all filters)
 */
export async function calculateInventorySummary(
  supabase: SupabaseClient,
  filters: InventoryFilters
): Promise<InventorySummary> {
  let query = supabase
    .from('license_plates')
    .select('quantity, products(cost_per_unit)')
    .neq('status', 'consumed')

  query = applyFilters(query, filters)

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to calculate summary: ${error.message}`)
  }

  return calculateSummary(data || [])
}

// Export as InventoryOverviewService
export const InventoryOverviewService = {
  getInventorySummary,
  calculateInventorySummary,
}
