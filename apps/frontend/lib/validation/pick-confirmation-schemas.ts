/**
 * Pick Confirmation Validation Schemas
 * Story: 07.9 - Pick Confirmation Desktop
 * Phase: RED - Schema definitions for test compilation
 *
 * These schemas will be implemented in the GREEN phase.
 * Currently defined for test compilation only.
 */

import { z } from 'zod'

/**
 * Short pick reason enum
 */
export const shortPickReasonEnum = z.enum([
  'insufficient_inventory',
  'damaged',
  'expired',
  'location_empty',
  'quality_hold',
  'other',
])

export type ShortPickReason = z.infer<typeof shortPickReasonEnum>

/**
 * Confirm pick input schema
 * Used for PUT /api/shipping/pick-lists/:id/lines/:lineId/pick
 */
export const confirmPickSchema = z.object({
  quantity_picked: z
    .number()
    .positive('Quantity must be positive')
    .max(999999, 'Quantity too large'),
  picked_license_plate_id: z
    .string()
    .uuid('Invalid license plate ID'),
})

export type ConfirmPickInput = z.infer<typeof confirmPickSchema>

/**
 * Short pick input schema
 * Used for POST /api/shipping/pick-lists/:id/lines/:lineId/short-pick
 */
export const shortPickSchema = z.object({
  quantity_picked: z
    .number()
    .positive('Quantity must be positive'),
  reason: shortPickReasonEnum,
  notes: z
    .string()
    .max(500, 'Notes max 500 characters')
    .optional(),
  picked_license_plate_id: z
    .string()
    .uuid()
    .optional(),
})

export type ShortPickInput = z.infer<typeof shortPickSchema>

/**
 * Pick list status enum
 */
export const pickListStatusEnum = z.enum([
  'pending',
  'assigned',
  'in_progress',
  'completed',
])

export type PickListStatus = z.infer<typeof pickListStatusEnum>

/**
 * Pick list line status enum
 */
export const pickListLineStatusEnum = z.enum([
  'pending',
  'picked',
  'short',
])

export type PickListLineStatus = z.infer<typeof pickListLineStatusEnum>

/**
 * Pick list interface
 */
export interface PickList {
  id: string
  org_id: string
  pick_list_number: string
  status: PickListStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assigned_to: string
  assigned_user_name?: string
  started_at: string | null
  completed_at: string | null
  created_at: string
}

/**
 * Pick list line interface
 */
export interface PickListLine {
  id: string
  pick_list_id: string
  sales_order_line_id: string
  license_plate_id: string
  location_id: string
  product_id: string
  product_name: string
  product_sku: string
  product_allergens: string[]
  quantity_to_pick: number
  quantity_picked: number
  status: PickListLineStatus
  lot_number: string
  best_before_date: string
  pick_sequence: number
  picked_at: string | null
  picked_by: string | null
  notes?: string
  location?: {
    zone: string
    aisle: string
    bin: string
    name?: string
  }
  lp?: {
    id: string
    lp_number: string
    quantity_on_hand: number
  }
}

/**
 * Pick progress metrics interface
 */
export interface PickProgress {
  picked_count: number
  short_count: number
  total_count: number
  percentage: number
}

/**
 * Confirm pick result interface
 */
export interface PickConfirmationResult {
  success: boolean
  line: {
    id: string
    status: PickListLineStatus
    quantity_picked: number
    picked_at: string
  }
  progress: PickProgress
}

/**
 * Short pick result interface
 */
export interface ShortPickResult {
  success: boolean
  line: {
    id: string
    status: 'short'
    quantity_picked: number
    picked_at: string
  }
  short_quantity: number
  backorder_created: boolean
  backorder_quantity?: number
  progress: PickProgress
}

/**
 * Complete pick list result interface
 */
export interface CompletionResult {
  success: boolean
  pick_list: {
    id: string
    status: 'completed'
    completed_at: string
  }
  summary: {
    total_lines: number
    picked_lines: number
    short_lines: number
    total_units_picked: number
  }
  sales_orders_updated: Array<{
    id: string
    order_number: string
    status: 'packing' | 'partial'
  }>
}
