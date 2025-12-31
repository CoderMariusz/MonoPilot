// Validation schemas for Work Orders (Epic 3 Batch 3B)
// Story 3.10: Work Order CRUD
// Date: 2025-01-24

import { z } from 'zod'

// ===== Work Order Schemas =====

export const createWorkOrderSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  planned_quantity: z.number().positive('Quantity must be > 0'),
  planned_start_date: z.coerce.date().optional(),
  planned_end_date: z.coerce.date().optional(),
  production_line_id: z.string().uuid('Invalid production line ID').optional().nullable(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
}).refine(data => {
  // If both dates provided, end must be >= start
  if (data.planned_start_date && data.planned_end_date) {
    return data.planned_end_date >= data.planned_start_date
  }
  return true
}, {
  message: 'Planned end date must be on or after start date',
  path: ['planned_end_date'],
})

export type CreateWorkOrderInput = z.input<typeof createWorkOrderSchema>

export const updateWorkOrderSchema = z.object({
  planned_quantity: z.number().positive('Quantity must be > 0').optional(),
  planned_start_date: z.coerce.date().optional().nullable(),
  planned_end_date: z.coerce.date().optional().nullable(),
  actual_start_date: z.coerce.date().optional().nullable(),
  actual_end_date: z.coerce.date().optional().nullable(),
  production_line_id: z.string().uuid('Invalid production line ID').optional().nullable(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
  status: z.enum(['draft', 'released', 'in_progress', 'completed', 'closed', 'cancelled']).optional(),
}).refine(data => {
  // If both planned dates provided, end must be >= start
  if (data.planned_start_date && data.planned_end_date) {
    return data.planned_end_date >= data.planned_start_date
  }
  return true
}, {
  message: 'Planned end date must be on or after start date',
  path: ['planned_end_date'],
}).refine(data => {
  // If both actual dates provided, end must be >= start
  if (data.actual_start_date && data.actual_end_date) {
    return data.actual_end_date >= data.actual_start_date
  }
  return true
}, {
  message: 'Actual end date must be on or after start date',
  path: ['actual_end_date'],
})

export type UpdateWorkOrderInput = z.input<typeof updateWorkOrderSchema>

// ===== Work Order Filters =====

export const workOrderFiltersSchema = z.object({
  search: z.string().optional(), // Search by WO number or product name
  status: z.string().optional(),
  product_id: z.string().uuid().optional(),
  production_line_id: z.string().uuid().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  sort_by: z.enum(['wo_number', 'planned_start_date', 'status', 'created_at']).optional().default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type WorkOrderFilters = z.input<typeof workOrderFiltersSchema>

// ===== Work Order Scheduling (Story 03.14) =====

// Time string regex (HH:mm format)
const timeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
  message: 'Time must be in HH:mm format (00:00-23:59)'
})

// ISO date format regex (YYYY-MM-DD)
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format'
})

export const scheduleWOSchema = z.object({
  planned_start_date: dateString.optional(),
  planned_end_date: dateString.optional().nullable(),
  scheduled_start_time: timeString.optional().nullable(),
  scheduled_end_time: timeString.optional().nullable(),
  production_line_id: z.string().uuid('Invalid production line ID').optional().nullable(),
  machine_id: z.string().uuid('Invalid machine ID').optional().nullable(),
}).refine(data => {
  // If both dates provided, end must be >= start
  if (data.planned_start_date && data.planned_end_date) {
    return data.planned_end_date >= data.planned_start_date
  }
  return true
}, {
  message: 'Planned end date must be on or after start date',
  path: ['planned_end_date'],
}).refine(data => {
  // Time validation only applies to same-day schedules
  // Multi-day example: start 23:00 day 1, end 07:00 day 2 is valid
  // If both times provided and same day (or no end date), end > start
  if (data.scheduled_start_time && data.scheduled_end_time) {
    // Only validate time range if same day or dates not provided
    if (!data.planned_end_date || data.planned_start_date === data.planned_end_date) {
      return data.scheduled_end_time > data.scheduled_start_time
    }
  }
  return true
}, {
  message: 'Scheduled end time must be after start time',
  path: ['scheduled_end_time'],
})

export type ScheduleWOInput = z.infer<typeof scheduleWOSchema>

// ===== Types =====

export interface WorkOrder {
  id: string
  org_id: string
  wo_number: string
  product_id: string
  bom_id: string | null
  planned_quantity: number
  produced_quantity: number
  uom: string
  status: string
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  production_line_id: string | null
  routing_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  products?: {
    id: string
    code: string
    name: string
    uom: string
  }
  machines?: {
    id: string
    code: string
    name: string
  }
  boms?: {
    id: string
    version: string
    status: string
  }
}
