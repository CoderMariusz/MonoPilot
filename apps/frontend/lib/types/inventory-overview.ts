/**
 * Inventory Overview Types
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 */

// =============================================================================
// Grouping Types
// =============================================================================

export type InventoryGroupBy = 'product' | 'location' | 'warehouse'

export type InventoryStatus = 'available' | 'reserved' | 'blocked' | 'all'

// =============================================================================
// Filter Types
// =============================================================================

export interface InventoryFilters {
  warehouse_id?: string
  location_id?: string
  product_id?: string
  status: InventoryStatus
  date_from?: string
  date_to?: string
  search: string
}

// =============================================================================
// Response Types - By Product
// =============================================================================

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

// =============================================================================
// Response Types - By Location
// =============================================================================

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

// =============================================================================
// Response Types - By Warehouse
// =============================================================================

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

// =============================================================================
// API Response Types
// =============================================================================

export interface InventorySummary {
  total_lps: number
  total_qty: number
  total_value: number
}

export interface InventoryPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface InventoryOverviewResponse<T = InventoryByProduct | InventoryByLocation | InventoryByWarehouse> {
  success: boolean
  data: T[]
  pagination: InventoryPagination
  summary: InventorySummary
}

// =============================================================================
// Table Column Definitions
// =============================================================================

export interface InventoryTableColumn {
  key: string
  label: string
  sortable: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}

export const PRODUCT_COLUMNS: InventoryTableColumn[] = [
  { key: 'product_name', label: 'Product', sortable: true, align: 'left' },
  { key: 'available_qty', label: 'Available', sortable: true, align: 'right' },
  { key: 'reserved_qty', label: 'Reserved', sortable: true, align: 'right' },
  { key: 'blocked_qty', label: 'Blocked', sortable: true, align: 'right' },
  { key: 'total_qty', label: 'Total Qty', sortable: true, align: 'right' },
  { key: 'lp_count', label: 'LP Count', sortable: true, align: 'right' },
  { key: 'avg_age_days', label: 'Avg Age', sortable: true, align: 'right' },
  { key: 'total_value', label: 'Value', sortable: true, align: 'right' },
  { key: 'actions', label: 'Actions', sortable: false, align: 'center' },
]

export const LOCATION_COLUMNS: InventoryTableColumn[] = [
  { key: 'location_code', label: 'Location', sortable: true, align: 'left' },
  { key: 'warehouse_name', label: 'Warehouse', sortable: true, align: 'left' },
  { key: 'total_lps', label: 'Total LPs', sortable: true, align: 'right' },
  { key: 'products_count', label: 'Products', sortable: true, align: 'right' },
  { key: 'total_qty', label: 'Total Qty', sortable: true, align: 'right' },
  { key: 'occupancy_pct', label: 'Occupancy', sortable: true, align: 'right' },
  { key: 'total_value', label: 'Value', sortable: true, align: 'right' },
]

export const WAREHOUSE_COLUMNS: InventoryTableColumn[] = [
  { key: 'warehouse_name', label: 'Warehouse', sortable: true, align: 'left' },
  { key: 'total_lps', label: 'Total LPs', sortable: true, align: 'right' },
  { key: 'products_count', label: 'Products', sortable: true, align: 'right' },
  { key: 'locations_count', label: 'Locations', sortable: true, align: 'right' },
  { key: 'total_value', label: 'Value', sortable: true, align: 'right' },
  { key: 'expiring_soon', label: 'Expiring Soon', sortable: true, align: 'right' },
  { key: 'expired', label: 'Expired', sortable: true, align: 'right' },
]
