/**
 * Allocation Validation Schemas
 * Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)
 *
 * Zod schemas for:
 * - Allocation strategy enum
 * - Allocate request (POST /allocate)
 * - Release allocation request (POST /release-allocation)
 * - LP allocation details
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const allocationStrategyEnum = z.enum(['FIFO', 'FEFO'])
export type AllocationStrategy = z.infer<typeof allocationStrategyEnum>

export const releaseReasonEnum = z.enum([
  'undo_allocation',
  'manual_adjustment',
  'so_cancelled',
  'line_deleted',
  'other',
])
export type ReleaseReason = z.infer<typeof releaseReasonEnum>

// =============================================================================
// LP Allocation Schema
// =============================================================================

export const lpAllocationSchema = z.object({
  license_plate_id: z.string().uuid('Invalid license plate ID'),
  quantity_to_allocate: z.number().positive('Quantity must be greater than 0'),
})

export type LPAllocation = z.infer<typeof lpAllocationSchema>

// =============================================================================
// Line Allocation Schema
// =============================================================================

export const allocationLineSchema = z.object({
  sales_order_line_id: z.string().uuid('Invalid sales order line ID'),
  line_allocations: z.array(lpAllocationSchema).min(1, 'At least one LP allocation required'),
})

export type AllocationLine = z.infer<typeof allocationLineSchema>

// =============================================================================
// Allocate Request Schema (POST /api/shipping/sales-orders/:id/allocate)
// =============================================================================

export const allocateRequestSchema = z.object({
  allocation_strategy: allocationStrategyEnum,
  allocations: z.array(allocationLineSchema).min(1, 'At least one allocation required'),
  hold_if_insufficient: z.boolean().optional().default(false),
  create_backorder_for_shortfall: z.boolean().optional().default(true),
  backorder_reason: z.string().optional(),
})

export type AllocateRequest = z.infer<typeof allocateRequestSchema>

// =============================================================================
// Release Allocation Request Schema (POST /api/shipping/sales-orders/:id/release-allocation)
// =============================================================================

export const releaseAllocationSchema = z.object({
  allocation_ids: z.array(z.string().uuid('Invalid allocation ID')).optional(),
  reason: releaseReasonEnum.optional().default('manual_adjustment'),
})

export type ReleaseAllocationRequest = z.infer<typeof releaseAllocationSchema>

// =============================================================================
// Allocation Query Schema (GET /api/shipping/sales-orders/:id/allocations)
// =============================================================================

export const allocationQuerySchema = z.object({
  strategy: allocationStrategyEnum.optional(),
  include_suggestions: z.coerce.boolean().optional().default(true),
  include_last_updated: z.coerce.boolean().optional().default(true),
})

export type AllocationQuery = z.infer<typeof allocationQuerySchema>

// =============================================================================
// Response Types (TypeScript only - not Zod)
// =============================================================================

export interface AllocationRecord {
  allocation_id: string
  sales_order_line_id: string
  license_plate_id: string
  quantity_allocated: number
  allocated_at: string
  allocated_by: string
}

export interface BackorderRecord {
  backorder_id: string | null
  sales_order_line_id: string
  product_id: string
  quantity_backordered: number
  status: string
  created_at: string
}

export interface AllocationSummary {
  total_lines: number
  fully_allocated_lines: number
  partially_allocated_lines: number
  not_allocated_lines: number
  total_qty_required: number
  total_qty_allocated: number
  total_qty_available: number
  total_lps_selected: number
  coverage_percentage: number
  allocation_complete: boolean
  total_shortfall: number
}

export interface SOStatusUpdate {
  old_status: string
  new_status: string
  timestamp: string
}

export interface AllocateResponse {
  success: boolean
  sales_order_id: string
  order_number: string
  allocated_at: string
  undo_until: string
  allocations_created: AllocationRecord[]
  sales_order_status_updated: SOStatusUpdate
  backorder_created: BackorderRecord | null
  summary: {
    total_allocated: number
    total_required: number
    total_allocated_pct: number
    shortfall_qty: number
    allocation_complete: boolean
    held_on_insufficient_stock: boolean
  }
}

export interface ReleaseResponse {
  success: boolean
  allocations_released: AllocationRecord[]
  inventory_freed: number
  undo_window_expired: boolean
  summary: string
}

export interface AvailableLPForAllocation {
  license_plate_id: string
  lp_number: string
  location_code: string
  on_hand_quantity: number
  allocated_quantity: number
  available_quantity: number
  manufacturing_date: string | null
  receipt_date: string
  created_at: string  // Added for FIFO sorting verification
  best_before_date: string | null
  expiry_date: string | null  // Added for FEFO sorting verification
  expiry_days_remaining: number | null
  lot_number: string | null
  batch_number: string | null
  temperature_zone: string | null
  suggested_allocation_qty: number
  is_suggested: boolean
  reason: string
}

export interface AllocationLineData {
  line_id: string
  line_number: number
  product_id: string
  product_name: string
  product_size: string | null
  quantity_ordered: number
  quantity_currently_allocated: number
  unit_price: number
  line_total: number
  available_license_plates: AvailableLPForAllocation[]
  allocation_status: 'full' | 'partial' | 'none'
  total_available: number
  qty_short: number
  allocation_summary: {
    fully_allocated: boolean
    partially_allocated: boolean
    total_available_qty: number
    total_allocated_qty: number
    shortfall_qty: number
  }
}

export interface AllocationDataResponse {
  sales_order_id: string
  order_number: string
  last_updated: string
  lines: AllocationLineData[]
  allocation_summary: AllocationSummary
  fefo_warning_threshold_days: number
  strategy: 'fifo' | 'fefo'
  timestamp: string
}
