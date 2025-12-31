/**
 * WO Materials Types - Story 03.11a
 *
 * TypeScript interfaces for WO Materials (BOM Snapshot):
 * - WOMaterial: Single material item from BOM snapshot
 * - WOMaterialsListResponse: Response from GET /materials endpoint
 * - CreateSnapshotResponse: Response from POST /snapshot endpoint
 * - MaterialStatus: Status enum for consumption tracking
 *
 * @module lib/types/wo-materials
 */

/**
 * Product summary for display in materials table
 */
export interface ProductSummary {
  id: string
  code: string
  name: string
  product_type: 'RM' | 'ING' | 'PKG' | 'WIP' | 'FG'
}

/**
 * Single WO material item from BOM snapshot
 */
export interface WOMaterial {
  id: string
  wo_id: string
  product_id: string
  material_name: string
  required_qty: number
  consumed_qty: number
  reserved_qty: number
  uom: string
  sequence: number
  consume_whole_lp: boolean
  is_by_product: boolean
  yield_percent: number | null
  scrap_percent: number
  condition_flags: Record<string, boolean> | null
  bom_item_id: string | null
  bom_version: number | null
  notes: string | null
  created_at: string
  product?: ProductSummary
}

/**
 * Response from GET /api/planning/work-orders/:id/materials
 */
export interface WOMaterialsListResponse {
  materials: WOMaterial[]
  total: number
  bom_version: number | null
  snapshot_at: string | null
}

/**
 * Response from POST /api/planning/work-orders/:id/snapshot
 */
export interface CreateSnapshotResponse {
  success: boolean
  materials_count: number
  message: string
}

/**
 * Material consumption status
 */
export type MaterialStatus =
  | 'pending'      // 0% consumed
  | 'in_progress'  // 0 < consumed < required
  | 'complete'     // consumed >= required
  | 'by_product'   // is_by_product = true

/**
 * Calculate material status from quantities
 */
export function getMaterialStatus(material: WOMaterial): MaterialStatus {
  if (material.is_by_product) {
    return 'by_product'
  }
  if (material.consumed_qty >= material.required_qty && material.required_qty > 0) {
    return 'complete'
  }
  if (material.consumed_qty > 0) {
    return 'in_progress'
  }
  return 'pending'
}

/**
 * Calculate consumption percentage
 */
export function getConsumptionPercent(material: WOMaterial): number {
  if (material.is_by_product || material.required_qty <= 0) {
    return 0
  }
  return Math.min(100, (material.consumed_qty / material.required_qty) * 100)
}

/**
 * Calculate remaining quantity
 */
export function getRemainingQty(material: WOMaterial): number {
  if (material.is_by_product) {
    return 0
  }
  return Math.max(0, material.required_qty - material.consumed_qty)
}
