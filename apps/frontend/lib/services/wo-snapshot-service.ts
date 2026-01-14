/**
 * WO Snapshot Service - Story 03.11a
 * Handles BOM snapshot creation and management for Work Orders
 *
 * Key functionality:
 * - Scale BOM item quantities based on WO planned quantity
 * - Apply scrap percentages to scaled quantities
 * - Check if WO snapshot can be modified (status-based)
 * - Create BOM snapshots (copy bom_items to wo_materials)
 * - Refresh snapshots for draft/planned WOs
 * - Get WO materials with product details
 *
 * ADR-002: BOM Snapshot Pattern
 * ADR-013: RLS org isolation pattern
 */

import { createServerSupabase } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface WOMaterial {
  id: string
  wo_id: string
  organization_id: string
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
  condition_flags: Record<string, unknown> | null
  bom_item_id: string | null
  bom_version: number | null
  notes: string | null
  created_at: string
  product?: {
    id: string
    code: string
    name: string
    product_type: string
  }
}

export interface BOMItem {
  id: string
  product_id: string
  quantity: number
  uom: string
  sequence: number
  scrap_percent: number
  consume_whole_lp: boolean
  is_by_product: boolean
  yield_percent: number | null
  condition_flags: Record<string, unknown> | null
  notes: string | null
  product?: {
    id: string
    name: string
    code: string
    product_type: string
  }
}

export interface BOM {
  id: string
  version: number
  output_qty: number
  bom_items: BOMItem[]
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Scales BOM item quantity for WO.
 * Formula: (wo_qty / bom_output_qty) * item_qty * (1 + scrap_percent/100)
 *
 * @param itemQty - Original BOM item quantity
 * @param woQty - Work Order planned quantity
 * @param bomOutputQty - BOM output quantity
 * @param scrapPercent - Scrap percentage (0-100)
 * @returns Scaled quantity rounded to 6 decimal places
 */
export function scaleQuantity(
  itemQty: number,
  woQty: number,
  bomOutputQty: number,
  scrapPercent: number = 0
): number {
  const scaleFactor = woQty / bomOutputQty
  const scrapMultiplier = 1 + scrapPercent / 100
  const result = itemQty * scaleFactor * scrapMultiplier
  // Round to 6 decimal places to avoid floating point precision issues
  return Math.round(result * 1000000) / 1000000
}

/**
 * Checks if WO snapshot can be modified.
 * Only draft and planned WOs allow snapshot modification.
 *
 * @param woStatus - Work Order status
 * @returns true if snapshot can be modified
 */
export function canModifySnapshot(woStatus: string): boolean {
  return ['draft', 'planned'].includes(woStatus.toLowerCase())
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get WO materials for a Work Order, ordered by sequence
 *
 * @param supabase - Supabase client
 * @param woId - Work Order ID
 * @returns Array of WO materials with product details
 */
export async function getWOMaterials(
  supabase: SupabaseClient,
  woId: string
): Promise<WOMaterial[]> {
  const { data: materials, error } = await supabase
    .from('wo_materials')
    .select(`
      *,
      product:products(id, code, name, product_type:product_types(id, code, name))
    `)
    .eq('wo_id', woId)
    .order('sequence', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch materials: ${error.message}`)
  }

  return (materials || []) as WOMaterial[]
}

/**
 * Create BOM snapshot for a Work Order
 * Copies bom_items to wo_materials with scaled quantities
 *
 * @param supabase - Supabase client
 * @param woId - Work Order ID
 * @param bomId - BOM ID to snapshot
 * @param woPlannedQty - Work Order planned quantity
 * @param orgId - Organization ID
 * @returns Array of created WO materials
 */
export async function createBOMSnapshot(
  supabase: SupabaseClient,
  woId: string,
  bomId: string,
  woPlannedQty: number,
  orgId: string
): Promise<WOMaterial[]> {
  // Get BOM with items and product details
  const { data: bom, error: bomError } = await supabase
    .from('boms')
    .select(`
      id,
      version,
      output_qty,
      bom_items (
        id,
        product_id,
        quantity,
        uom,
        sequence,
        scrap_percent,
        consume_whole_lp,
        is_by_product,
        yield_percent,
        condition_flags,
        notes,
        product:products(id, name, code, product_type:product_types(id, code, name))
      )
    `)
    .eq('id', bomId)
    .single()

  if (bomError || !bom) {
    throw new Error('BOM not found')
  }

  const typedBom = bom as unknown as BOM

  // Map and scale BOM items to WO materials
  const woMaterials = typedBom.bom_items.map((item: BOMItem) => ({
    wo_id: woId,
    organization_id: orgId,
    product_id: item.product_id,
    material_name: item.product?.name || 'Unknown',
    required_qty: item.is_by_product
      ? 0 // By-products have no required qty
      : scaleQuantity(
          item.quantity,
          woPlannedQty,
          typedBom.output_qty,
          item.scrap_percent || 0
        ),
    consumed_qty: 0,
    reserved_qty: 0,
    uom: item.uom,
    sequence: item.sequence || 0,
    consume_whole_lp: item.consume_whole_lp || false,
    is_by_product: item.is_by_product || false,
    yield_percent: item.yield_percent,
    scrap_percent: item.scrap_percent || 0,
    condition_flags: item.condition_flags,
    bom_item_id: item.id,
    bom_version: typedBom.version,
    notes: item.notes,
  }))

  // Bulk insert materials
  const { data, error } = await supabase
    .from('wo_materials')
    .insert(woMaterials)
    .select(`
      *,
      product:products(id, code, name, product_type:product_types(id, code, name))
    `)

  if (error) {
    throw new Error(`Failed to create snapshot: ${error.message}`)
  }

  return (data || []) as WOMaterial[]
}

/**
 * Refresh BOM snapshot for a Work Order
 * Deletes existing materials and recreates from current BOM
 *
 * @param supabase - Supabase client
 * @param woId - Work Order ID
 * @param bomId - BOM ID
 * @param woPlannedQty - Work Order planned quantity
 * @param orgId - Organization ID
 * @returns Array of created WO materials
 */
export async function refreshSnapshot(
  supabase: SupabaseClient,
  woId: string,
  bomId: string,
  woPlannedQty: number,
  orgId: string
): Promise<WOMaterial[]> {
  // Delete existing materials
  const { error: deleteError } = await supabase
    .from('wo_materials')
    .delete()
    .eq('wo_id', woId)

  if (deleteError) {
    throw new Error(`Failed to delete existing materials: ${deleteError.message}`)
  }

  // Create new snapshot
  return createBOMSnapshot(supabase, woId, bomId, woPlannedQty, orgId)
}
