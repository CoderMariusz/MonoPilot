/**
 * BOM Advanced Features Type Definitions
 * Story: 02.14 - BOM Advanced Features: Version Comparison, Yield & Scaling
 *
 * Types for:
 * - BOM version comparison (FR-2.25)
 * - Multi-level BOM explosion (FR-2.29)
 * - BOM yield calculation (FR-2.34)
 * - BOM scaling (FR-2.35)
 */

// =============================================================================
// BOM Item Summary (for comparison)
// =============================================================================

export interface BomItemSummary {
  id: string
  component_id: string
  component_code: string
  component_name: string
  quantity: number
  uom: string
  sequence: number
  operation_seq: number | null
  scrap_percent: number
  is_output: boolean
}

// =============================================================================
// BOM Version Comparison (FR-2.25)
// =============================================================================

export interface ModifiedItem {
  item_id: string
  component_id: string
  component_code: string
  component_name: string
  field: 'quantity' | 'uom' | 'scrap_percent' | 'sequence' | 'operation_seq'
  old_value: string | number
  new_value: string | number
  change_percent: number | null
}

export interface BomVersionSummary {
  id: string
  version: string
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  status: string
  items: BomItemSummary[]
}

export interface BomComparisonDifferences {
  added: BomItemSummary[]
  removed: BomItemSummary[]
  modified: ModifiedItem[]
}

export interface BomComparisonSummary {
  total_items_v1: number
  total_items_v2: number
  total_added: number
  total_removed: number
  total_modified: number
  weight_change_kg: number
  weight_change_percent: number
}

export interface BomComparisonResponse {
  bom_1: BomVersionSummary
  bom_2: BomVersionSummary
  differences: BomComparisonDifferences
  summary: BomComparisonSummary
}

// =============================================================================
// Multi-Level BOM Explosion (FR-2.29)
// =============================================================================

export interface ExplosionItem {
  item_id: string
  component_id: string
  component_code: string
  component_name: string
  component_type: string // 'raw' | 'wip' | 'finished' | 'packaging'
  quantity: number
  cumulative_qty: number
  uom: string
  scrap_percent: number
  has_sub_bom: boolean
  path: string[]
}

export interface ExplosionLevel {
  level: number
  items: ExplosionItem[]
}

export interface RawMaterialSummary {
  component_id: string
  component_code: string
  component_name: string
  total_qty: number
  uom: string
}

export interface BomExplosionResponse {
  bom_id: string
  product_code: string
  product_name: string
  output_qty: number
  output_uom: string
  levels: ExplosionLevel[]
  total_levels: number
  total_items: number
  raw_materials_summary: RawMaterialSummary[]
}

// =============================================================================
// BOM Scaling (FR-2.35)
// =============================================================================

export interface ScaledItem {
  id: string
  component_code: string
  component_name: string
  original_quantity: number
  new_quantity: number
  uom: string
  rounded: boolean
}

export interface ScaleBomResponse {
  original_batch_size: number
  new_batch_size: number
  scale_factor: number
  items: ScaledItem[]
  warnings: string[]
  applied: boolean
}

export interface ScaleBomRequest {
  target_batch_size?: number
  target_uom?: string
  scale_factor?: number
  preview_only?: boolean
  round_decimals?: number
}

// =============================================================================
// BOM Yield Calculation (FR-2.34)
// =============================================================================

export interface LossFactor {
  type: 'moisture' | 'trim' | 'process' | 'custom'
  description: string
  loss_percent: number
}

export interface BomYieldResponse {
  bom_id: string
  theoretical_yield_percent: number
  expected_yield_percent: number | null
  input_total_kg: number
  output_qty_kg: number
  loss_factors: LossFactor[]
  actual_yield_avg: number | null
  variance_from_expected: number | null
  variance_warning: boolean
}

export interface UpdateYieldRequest {
  expected_yield_percent: number
  variance_threshold_percent?: number
}

// =============================================================================
// Query Parameters
// =============================================================================

export interface ExplosionQuery {
  maxDepth?: number
  includeQuantities?: boolean
}

// =============================================================================
// UI Helper Types
// =============================================================================

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface DiffRow {
  type: DiffType
  item: BomItemSummary
  oldItem?: BomItemSummary
  changes?: ModifiedItem[]
}

// Tree node for explosion view with children support
export interface ExplosionTreeNode extends ExplosionItem {
  level: number
  children: ExplosionTreeNode[]
  isExpanded?: boolean
  parent_id?: string
}

// BOM version for selector dropdown
export interface BomVersionOption {
  id: string
  version: string
  status: string
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
}

// Scale parameters for mutation
export interface ScaleParams {
  bomId: string
  request: ScaleBomRequest
}

// Yield update parameters for mutation
export interface YieldUpdateParams {
  bomId: string
  request: UpdateYieldRequest
}
