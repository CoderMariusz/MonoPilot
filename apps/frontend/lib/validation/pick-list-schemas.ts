/**
 * Pick List Validation Schemas
 * Story: 07.8 - Pick List Generation + Wave Picking
 *
 * Provides Zod schemas for pick list creation, assignment, filtering
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const pickListStatusEnum = z.enum([
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
])

export type PickListStatus = z.infer<typeof pickListStatusEnum>

export const pickListTypeEnum = z.enum(['single_order', 'wave'])

export type PickListType = z.infer<typeof pickListTypeEnum>

export const pickListPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent'])

export type PickListPriority = z.infer<typeof pickListPriorityEnum>

export const pickListLineStatusEnum = z.enum(['pending', 'picked', 'short'])

export type PickListLineStatus = z.infer<typeof pickListLineStatusEnum>

// =============================================================================
// Create Pick List Schema
// =============================================================================

export const createPickListSchema = z.object({
  sales_order_ids: z
    .array(z.string().uuid('Invalid sales order ID'))
    .min(1, 'At least one sales order is required'),
  priority: pickListPriorityEnum.default('normal'),
  assigned_to: z.string().uuid('Invalid user ID').optional().nullable(),
})

export type CreatePickListInput = z.infer<typeof createPickListSchema>

// =============================================================================
// Assign Picker Schema
// =============================================================================

export const assignPickerSchema = z.object({
  assigned_to: z.string().uuid('Invalid user ID'),
})

export type AssignPickerInput = z.infer<typeof assignPickerSchema>

// =============================================================================
// Pick List Filters Schema
// =============================================================================

export const pickListFiltersSchema = z.object({
  status: z.string().optional(), // Comma-separated statuses
  assigned_to: z.string().optional(), // UUID or 'unassigned'
  priority: pickListPriorityEnum.optional(),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z
    .enum(['pick_list_number', 'created_at', 'status', 'priority'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

export type PickListFilters = z.infer<typeof pickListFiltersSchema>

// =============================================================================
// Pick List Response Types
// =============================================================================

export interface PickList {
  id: string
  org_id: string
  pick_list_number: string
  pick_type: PickListType
  status: PickListStatus
  priority: PickListPriority
  assigned_to: string | null
  wave_id: string | null
  created_at: string
  created_by: string
  started_at: string | null
  completed_at: string | null
  assigned_user?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: string
    name: string
  }
  line_count?: number
  lines_picked?: number
  lines_short?: number
  sales_orders?: Array<{
    id: string
    order_number: string
    customer_name: string
  }>
}

export interface PickListLine {
  id: string
  org_id: string
  pick_list_id: string
  sales_order_line_id: string
  license_plate_id: string | null
  location_id: string
  product_id: string
  lot_number: string | null
  quantity_to_pick: number
  quantity_picked: number
  pick_sequence: number
  status: PickListLineStatus
  picked_license_plate_id: string | null
  picked_at: string | null
  picked_by: string | null
  short_pick_reason: string | null
  notes: string | null
  product?: {
    id: string
    code: string
    name: string
  }
  location?: {
    id: string
    zone: string
    aisle: string
    bin: string
    full_path: string
  }
  license_plate?: {
    id: string
    lp_number: string
    quantity: number
    expiry_date: string | null
  }
}

export interface CreatePickListResult {
  pick_list_id: string
  pick_list_number: string
  pick_type: PickListType
  line_count: number
  status: PickListStatus
}

export interface PickListsListResult {
  pick_lists: PickList[]
  total: number
  page: number
  pages: number
}

export interface PickListDetailResult {
  pick_list: PickList
  lines: PickListLine[]
}

// =============================================================================
// Priority Order for Sorting
// =============================================================================

export const PRIORITY_ORDER: Record<PickListPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

// =============================================================================
// Allowed Roles
// =============================================================================

export const PICK_LIST_CREATE_ROLES = [
  'owner',
  'admin',
  'super_admin',
  'superadmin',
  'manager',
  'warehouse_manager',
  'shipping_manager',
]

export const PICK_LIST_ASSIGN_ROLES = [
  'owner',
  'admin',
  'super_admin',
  'superadmin',
  'manager',
  'warehouse_manager',
  'shipping_manager',
]

export const PICKER_ROLES = [
  'owner',
  'admin',
  'super_admin',
  'superadmin',
  'manager',
  'warehouse_manager',
  'shipping_manager',
  'picker',
  'warehouse_operator',
]
