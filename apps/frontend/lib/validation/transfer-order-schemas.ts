/**
 * Transfer Order Validation Schemas
 * Epic 3 Batch 3B: Transfer Orders
 * Stories: 3.6, 3.7, 3.8, 3.9
 * Date: 2025-01-23
 */

import { z } from 'zod'

// ===== Transfer Order Schemas (Story 3.6) =====

export const createTransferOrderSchema = z
  .object({
    from_warehouse_id: z.string().uuid('Invalid source warehouse ID'),
    to_warehouse_id: z.string().uuid('Invalid destination warehouse ID'),
    planned_ship_date: z.coerce.date(),
    planned_receive_date: z.coerce.date(),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
  })
  .refine(
    (data) => data.from_warehouse_id !== data.to_warehouse_id,
    {
      message: 'Source and destination warehouses must be different',
      path: ['to_warehouse_id'],
    }
  )
  .refine(
    (data) => {
      const shipDate = new Date(data.planned_ship_date)
      const receiveDate = new Date(data.planned_receive_date)
      shipDate.setHours(0, 0, 0, 0)
      receiveDate.setHours(0, 0, 0, 0)
      return receiveDate >= shipDate
    },
    {
      message: 'Planned receive date must be on or after planned ship date',
      path: ['planned_receive_date'],
    }
  )

export type CreateTransferOrderInput = z.input<typeof createTransferOrderSchema>

export const updateTransferOrderSchema = z
  .object({
    from_warehouse_id: z.string().uuid('Invalid source warehouse ID').optional(),
    to_warehouse_id: z.string().uuid('Invalid destination warehouse ID').optional(),
    planned_ship_date: z.coerce.date().optional(),
    planned_receive_date: z.coerce.date().optional(),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.from_warehouse_id && data.to_warehouse_id) {
        return data.from_warehouse_id !== data.to_warehouse_id
      }
      return true
    },
    {
      message: 'Source and destination warehouses must be different',
      path: ['to_warehouse_id'],
    }
  )
  .refine(
    (data) => {
      if (data.planned_ship_date && data.planned_receive_date) {
        const shipDate = new Date(data.planned_ship_date)
        const receiveDate = new Date(data.planned_receive_date)
        shipDate.setHours(0, 0, 0, 0)
        receiveDate.setHours(0, 0, 0, 0)
        return receiveDate >= shipDate
      }
      return true
    },
    {
      message: 'Planned receive date must be on or after planned ship date',
      path: ['planned_receive_date'],
    }
  )

export type UpdateTransferOrderInput = z.input<typeof updateTransferOrderSchema>

// ===== TO Line Schemas (Story 3.7) =====

export const createToLineSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
})

export type CreateToLineInput = z.input<typeof createToLineSchema>

export const updateToLineSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
})

export type UpdateToLineInput = z.input<typeof updateToLineSchema>

// ===== Status Change Schema (Story 3.6 - AC-3.6.7) =====

export const changeToStatusSchema = z.object({
  status: z.enum(['planned', 'shipped', 'received', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid status. Must be one of: planned, shipped, received, cancelled' })
  }),
})

export type ChangeToStatusInput = z.infer<typeof changeToStatusSchema>

// ===== Partial Shipment Schemas (Story 3.8) =====

export const shipToLineItemSchema = z.object({
  to_line_id: z.string().uuid('Invalid TO line ID'),
  ship_qty: z.number().nonnegative('Ship quantity must be >= 0'),
})

export type ShipToLineItem = z.infer<typeof shipToLineItemSchema>

export const shipToSchema = z
  .object({
    line_items: z.array(shipToLineItemSchema).min(1, 'At least one line item required'),
    actual_ship_date: z.coerce.date().optional(),
  })
  .refine(
    (data) => data.line_items.some((item) => item.ship_qty > 0),
    {
      message: 'At least one line item must have ship quantity > 0',
      path: ['line_items'],
    }
  )

export type ShipToInput = z.input<typeof shipToSchema>

// ===== Partial Receipt Schemas (Story 3.9a) =====

export const receiveToLineItemSchema = z.object({
  line_id: z.string().uuid('Invalid TO line ID'),
  receive_qty: z.number().nonnegative('Receive quantity must be >= 0').max(99999.9999, 'Receive quantity cannot exceed 99999.9999'),
})

export type ReceiveToLineItem = z.infer<typeof receiveToLineItemSchema>

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const receiveTORequestSchema = z
  .object({
    receipt_date: z.string().regex(dateRegex, 'Receipt date must be in YYYY-MM-DD format'),
    lines: z.array(receiveToLineItemSchema).min(1, 'At least one line item required'),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  })
  .refine(
    (data) => {
      // Validate receipt_date is not in the future
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const receiptDate = new Date(data.receipt_date)
      receiptDate.setHours(0, 0, 0, 0)
      return receiptDate <= today
    },
    {
      message: 'Receipt date cannot be in the future',
      path: ['receipt_date'],
    }
  )
  .refine(
    (data) => data.lines.some((item) => item.receive_qty > 0),
    {
      message: 'At least one line must have quantity > 0',
      path: ['lines'],
    }
  )

export type ReceiveTOInput = z.infer<typeof receiveTORequestSchema>

// ===== LP Selection Schemas (Story 3.9) =====

export const lpSelectionItemSchema = z.object({
  lp_id: z.string().uuid('Invalid License Plate ID'),
  reserved_qty: z.number().positive('Reserved quantity must be > 0'),
})

export type LpSelectionItem = z.infer<typeof lpSelectionItemSchema>

export const selectLpsSchema = z
  .object({
    selections: z.array(lpSelectionItemSchema).min(1, 'At least one LP selection required'),
  })
  .refine(
    (data) => {
      // Check for duplicate LP IDs
      const lpIds = data.selections.map((s) => s.lp_id)
      const uniqueLpIds = new Set(lpIds)
      return lpIds.length === uniqueLpIds.size
    },
    {
      message: 'Each License Plate can only be selected once per line',
      path: ['selections'],
    }
  )

export type SelectLpsInput = z.input<typeof selectLpsSchema>

// ===== Transfer Order Filters =====

export const transferOrderFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  from_warehouse_id: z.string().uuid().optional(),
  to_warehouse_id: z.string().uuid().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  sort_by: z.enum(['to_number', 'planned_ship_date', 'status', 'created_at']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
})

export type TransferOrderFilters = z.infer<typeof transferOrderFiltersSchema>

// ===== TypeScript Types =====

export interface TransferOrder {
  id: string
  org_id: string
  to_number: string
  from_warehouse_id: string
  to_warehouse_id: string
  status: string
  planned_ship_date: string
  planned_receive_date: string
  actual_ship_date: string | null
  actual_receive_date: string | null
  notes: string | null
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  from_warehouse?: { code: string; name: string }
  to_warehouse?: { code: string; name: string }
  lines?: ToLine[]
}

export interface ToLine {
  id: string
  transfer_order_id: string
  product_id: string
  quantity: number
  uom: string
  shipped_qty: number
  received_qty: number
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  product?: { code: string; name: string }
  lp_selections?: ToLineLp[]
}

export interface ToLineLp {
  id: string
  to_line_id: string
  lp_id: string
  reserved_qty: number
  created_at: string
  // Joined data
  license_plate?: { lp_number: string }
}

// Status enum (from migration)
export type TransferOrderStatus =
  | 'draft'
  | 'planned'
  | 'partially_shipped'
  | 'shipped'
  | 'partially_received'
  | 'received'
  | 'cancelled'
