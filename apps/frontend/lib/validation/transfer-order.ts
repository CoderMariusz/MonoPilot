/**
 * Transfer Order Validation Schemas (Story 03.8)
 *
 * Exports:
 * - createTransferOrderSchema: Create TO with all required validations
 * - updateTransferOrderSchema: Partial update with conditional validations
 * - createTOLineSchema: Create line item
 * - updateTOLineSchema: Update line item
 *
 * Validation Rules:
 * - from_warehouse_id != to_warehouse_id (SAME_WAREHOUSE)
 * - planned_receive_date >= planned_ship_date (INVALID_DATE_RANGE)
 * - quantity > 0 for all lines
 * - notes max 1000 chars for TO, 500 for lines
 */

import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export const toStatusEnum = z.enum(['draft', 'planned', 'shipped', 'received', 'closed', 'cancelled'])
export type TOStatus = z.infer<typeof toStatusEnum>

export const toPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent'])
export type TOPriority = z.infer<typeof toPriorityEnum>

// ============================================================================
// HELPER: Date validation
// ============================================================================

/**
 * Validates ISO date string format (YYYY-MM-DD)
 */
const isValidDate = (dateStr: string): boolean => {
  // Check format matches YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false
  }

  const [year, month, day] = dateStr.split('-').map(Number)

  // Check month is valid (1-12)
  if (month < 1 || month > 12) {
    return false
  }

  // Check day is valid for the month
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) {
    return false
  }

  // Create date and verify it matches
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

// ============================================================================
// CREATE TRANSFER ORDER SCHEMA
// ============================================================================

export const createTransferOrderSchema = z
  .object({
    from_warehouse_id: z.string().uuid('Invalid source warehouse ID'),
    to_warehouse_id: z.string().uuid('Invalid destination warehouse ID'),
    planned_ship_date: z.string().refine(isValidDate, {
      message: 'Invalid date format. Use YYYY-MM-DD.',
    }),
    planned_receive_date: z.string().refine(isValidDate, {
      message: 'Invalid date format. Use YYYY-MM-DD.',
    }),
    priority: toPriorityEnum.default('normal'),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
    lines: z
      .array(
        z.object({
          product_id: z.string().uuid('Invalid product ID'),
          quantity: z.number().positive('Quantity must be greater than 0'),
          notes: z.string().max(500).nullable().optional(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => data.from_warehouse_id !== data.to_warehouse_id,
    {
      message: 'From Warehouse and To Warehouse must be different',
      path: ['to_warehouse_id'],
    }
  )
  .refine(
    (data) => {
      // Compare dates as strings (YYYY-MM-DD format sorts correctly)
      return data.planned_receive_date >= data.planned_ship_date
    },
    {
      message: 'Planned Receive Date must be on or after Planned Ship Date',
      path: ['planned_receive_date'],
    }
  )

export type CreateTransferOrderInput = z.input<typeof createTransferOrderSchema>

// ============================================================================
// UPDATE TRANSFER ORDER SCHEMA
// ============================================================================

export const updateTransferOrderSchema = z
  .object({
    from_warehouse_id: z.string().uuid('Invalid source warehouse ID').optional(),
    to_warehouse_id: z.string().uuid('Invalid destination warehouse ID').optional(),
    planned_ship_date: z
      .string()
      .refine(isValidDate, {
        message: 'Invalid date format. Use YYYY-MM-DD.',
      })
      .optional(),
    planned_receive_date: z
      .string()
      .refine(isValidDate, {
        message: 'Invalid date format. Use YYYY-MM-DD.',
      })
      .optional(),
    priority: toPriorityEnum.optional(),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').nullable().optional(),
  })
  .refine(
    (data) => {
      // Only validate if both warehouses are provided
      if (data.from_warehouse_id && data.to_warehouse_id) {
        return data.from_warehouse_id !== data.to_warehouse_id
      }
      return true
    },
    {
      message: 'From Warehouse and To Warehouse must be different',
      path: ['to_warehouse_id'],
    }
  )
  .refine(
    (data) => {
      // Only validate if both dates are provided
      if (data.planned_ship_date && data.planned_receive_date) {
        return data.planned_receive_date >= data.planned_ship_date
      }
      return true
    },
    {
      message: 'Planned Receive Date must be on or after Planned Ship Date',
      path: ['planned_receive_date'],
    }
  )

export type UpdateTransferOrderInput = z.input<typeof updateTransferOrderSchema>

// ============================================================================
// CREATE TO LINE SCHEMA
// ============================================================================

export const createTOLineSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),
})

export type CreateTOLineInput = z.input<typeof createTOLineSchema>

// ============================================================================
// UPDATE TO LINE SCHEMA
// ============================================================================

export const updateTOLineSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').nullable().optional(),
})

export type UpdateTOLineInput = z.input<typeof updateTOLineSchema>

// ============================================================================
// LIST PARAMS SCHEMA
// ============================================================================

export const toListParamsSchema = z.object({
  search: z.string().min(2).optional(),
  status: z.union([toStatusEnum, z.array(toStatusEnum)]).optional(),
  from_warehouse_id: z.string().uuid().optional(),
  to_warehouse_id: z.string().uuid().optional(),
  priority: toPriorityEnum.optional(),
  sort: z.enum(['to_number', 'planned_ship_date', 'status', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export type TOListParams = z.infer<typeof toListParamsSchema>
