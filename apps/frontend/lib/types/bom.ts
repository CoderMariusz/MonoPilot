/**
 * BOM (Bill of Materials) Types (Story 02.4)
 * Type definitions for BOM management
 */

export type BOMStatus = 'draft' | 'active' | 'phased_out' | 'inactive'

export interface BOM {
  id: string
  org_id: string
  product_id: string
  version: number
  bom_type: string
  routing_id: string | null
  effective_from: string
  effective_to: string | null
  status: BOMStatus
  output_qty: number
  output_uom: string
  units_per_box: number | null
  boxes_per_pallet: number | null
  yield_percent: number
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface BOMWithProduct extends BOM {
  product: {
    id: string
    code: string
    name: string
    type: string
    uom: string
  }
}

export interface BOMsListResponse {
  boms: BOMWithProduct[]
  total: number
  page: number
  limit: number
}

export interface BOMFilters {
  page?: number
  limit?: number
  search?: string
  status?: BOMStatus
  product_type?: string
  effective_date?: 'current' | 'future' | 'expired'
  product_id?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateBOMRequest {
  product_id: string
  effective_from: string
  effective_to?: string | null
  status?: 'draft' | 'active'
  output_qty: number
  output_uom: string
  yield_percent?: number
  notes?: string | null
}

export interface UpdateBOMRequest {
  effective_from?: string
  effective_to?: string | null
  status?: BOMStatus
  output_qty?: number
  output_uom?: string
  yield_percent?: number
  notes?: string | null
}

export interface BOMTimelineResponse {
  product: {
    id: string
    code: string
    name: string
  }
  versions: BOMTimelineVersion[]
  current_date: string
}

export interface BOMTimelineVersion {
  id: string
  version: number
  status: BOMStatus
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  notes: string | null
  is_currently_active: boolean
  has_overlap: boolean
}

export interface BOMFormData {
  product_id: string
  effective_from: string
  effective_to: string | null
  status: 'draft' | 'active'
  output_qty: number
  output_uom: string
  yield_percent: number
  notes: string | null
}

export interface DateOverlapResult {
  overlaps: boolean
  conflictingBom?: BOM
}

export interface WorkOrderReference {
  id: string
  wo_number: string
}

// ========================================
// BOM Items Types (Story 02.5a - MVP + 02.5b Phase 1B)
// ========================================

/**
 * Product type for BOM items (components)
 * Only RM, ING, PKG, WIP allowed as components in MVP
 */
export type BOMItemProductType = 'RM' | 'ING' | 'PKG' | 'WIP'

/**
 * Conditional flags stored as JSONB
 * Default flags: organic, vegan, gluten_free, kosher, halal
 * Allows custom flags via index signature
 */
export interface ConditionFlags {
  organic?: boolean
  vegan?: boolean
  gluten_free?: boolean
  kosher?: boolean
  halal?: boolean
  [key: string]: boolean | undefined
}

/**
 * BOM Item with product details
 * Represents a single component/ingredient in a BOM
 * Includes Phase 1B fields (consume_whole_lp, line_ids, is_by_product, etc.)
 */
export interface BOMItem {
  id: string
  bom_id: string
  product_id: string
  product_code: string
  product_name: string
  product_type: BOMItemProductType | string // Allow 'BP' for byproducts
  product_base_uom: string
  quantity: number
  uom: string
  sequence: number
  operation_seq: number | null
  operation_name: string | null
  scrap_percent: number
  notes: string | null
  created_at: string
  updated_at: string
  // Phase 1B fields
  consume_whole_lp: boolean
  line_ids: string[] | null
  line_names: string[] | null
  is_by_product: boolean
  is_output: boolean
  yield_percent: number | null
  condition_flags: ConditionFlags | null
}

/**
 * Request body for creating a BOM item
 * Includes Phase 1B fields (consume_whole_lp, line_ids, is_by_product, etc.)
 */
export interface CreateBOMItemRequest {
  product_id: string
  quantity: number
  uom: string
  sequence?: number
  operation_seq?: number | null
  scrap_percent?: number
  notes?: string | null
  // Phase 1B fields
  consume_whole_lp?: boolean
  line_ids?: string[] | null
  is_by_product?: boolean
  yield_percent?: number | null
  condition_flags?: ConditionFlags | null
}

/**
 * Request body for updating a BOM item
 * Note: product_id cannot be changed after creation
 * Includes Phase 1B fields
 */
export interface UpdateBOMItemRequest {
  quantity?: number
  uom?: string
  sequence?: number
  operation_seq?: number | null
  scrap_percent?: number
  notes?: string | null
  // Phase 1B fields
  consume_whole_lp?: boolean
  line_ids?: string[] | null
  is_by_product?: boolean
  yield_percent?: number | null
  condition_flags?: ConditionFlags | null
}

/**
 * Response for listing BOM items
 */
export interface BOMItemsListResponse {
  items: BOMItem[]
  total: number
  bom_output_qty: number
  bom_output_uom: string
}

/**
 * Response for single BOM item with potential warnings
 */
export interface BOMItemResponse {
  item: BOMItem
  warnings?: BOMItemWarning[]
}

/**
 * Warning structure for BOM item operations
 */
export interface BOMItemWarning {
  code: string
  message: string
  details?: string
}

/**
 * Summary statistics for BOM items
 */
export interface BOMItemsSummary {
  total_items: number
  total_input_by_uom: Record<string, number>
  expected_output: string
}

/**
 * Operation for operation dropdown (from routing)
 */
export interface RoutingOperationOption {
  id: string
  sequence: number
  name: string
  display_name: string // "Op {seq}: {name}"
}

// ========================================
// Phase 1B Additional Types (Story 02.5b)
// ========================================

/**
 * Production line for dropdown selection
 */
export interface ProductionLine {
  id: string
  org_id: string
  code: string
  name: string
  is_active: boolean
}

/**
 * Conditional flag for multi-select dropdown
 */
export interface ConditionalFlag {
  id: string
  code: string
  name: string
  is_active: boolean
}

/**
 * Bulk import response
 */
export interface BulkImportResponse {
  created: number
  total: number
  items: BOMItem[]
  errors: Array<{ row: number; error: string }>
}
