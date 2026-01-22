/**
 * SO Status Validation Schemas
 * Story: 07.3 - SO Status Workflow (Hold/Cancel/Confirm)
 *
 * Provides Zod validation schemas for:
 * - holdOrderSchema: Hold sales order with optional reason
 * - cancelOrderSchema: Cancel sales order with required reason
 * - confirmOrderSchema: Confirm sales order
 * - soStatusEnum: Valid SO status values
 */

import { z } from 'zod'

// ============================================================================
// SO Status Enum
// ============================================================================

/**
 * Valid SO status values
 * - draft: Order created, awaiting confirmation
 * - confirmed: Order confirmed, ready for allocation
 * - on_hold: Order placed on hold pending review
 * - cancelled: Order cancelled
 * - allocated: Inventory allocated
 * - picking: Items being picked
 * - packing: Items being packed
 * - shipped: Order shipped
 * - delivered: Order delivered
 */
export const SO_STATUSES = [
  'draft',
  'confirmed',
  'on_hold',
  'cancelled',
  'allocated',
  'picking',
  'packing',
  'shipped',
  'delivered',
] as const

export type SalesOrderStatus = (typeof SO_STATUSES)[number]

export const soStatusEnum = z.enum(SO_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${SO_STATUSES.join(', ')}`,
  }),
})

// ============================================================================
// Hold Order Schema
// ============================================================================

/**
 * Schema for placing a sales order on hold
 *
 * Fields:
 * - reason: Optional - Max 500 chars - Explanation for hold
 *
 * Validation Rules:
 * - reason is optional
 * - reason max length: 500 characters
 */
export const holdOrderSchema = z.object({
  reason: z
    .string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional(),
})

export type HoldOrderInput = z.infer<typeof holdOrderSchema>

// ============================================================================
// Cancel Order Schema
// ============================================================================

/**
 * Schema for cancelling a sales order
 *
 * Fields:
 * - reason: Required - Min 10 chars, Max 500 chars - Mandatory explanation
 *
 * Validation Rules:
 * - reason field is REQUIRED
 * - reason min length: 10 characters
 * - reason max length: 500 characters
 * - whitespace-only strings are rejected
 */
export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(1, 'Cancel reason is required')
    .max(500, 'Reason cannot exceed 500 characters')
    .transform((val) => val.trim())
    .refine((val) => val.length >= 10, {
      message: 'Reason must be at least 10 characters',
    }),
})

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>

// ============================================================================
// Confirm Order Schema
// ============================================================================

/**
 * Schema for confirming a sales order (releasing from hold)
 *
 * Fields: None required
 */
export const confirmOrderSchema = z.object({})

export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>

// ============================================================================
// Status Change Request Schema (Generic for PATCH endpoint)
// ============================================================================

/**
 * Schema for generic status change via PATCH endpoint
 *
 * Fields:
 * - action: Required - One of: hold, cancel, confirm
 * - reason: Conditional - Required for cancel, optional for hold
 */
export const statusChangeSchema = z
  .object({
    action: z.enum(['hold', 'cancel', 'confirm'], {
      errorMap: () => ({ message: 'Action must be one of: hold, cancel, confirm' }),
    }),
    reason: z
      .string()
      .max(500, 'Reason cannot exceed 500 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Require reason for cancel action
    if (data.action === 'cancel') {
      if (!data.reason || data.reason.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cancel reason is required',
          path: ['reason'],
        })
      } else if (data.reason.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Reason must be at least 10 characters',
          path: ['reason'],
        })
      }
    }
  })

export type StatusChangeInput = z.infer<typeof statusChangeSchema>

// ============================================================================
// Status Transition Map
// ============================================================================

/**
 * Valid status transitions map
 * Defines which statuses can transition to which other statuses
 */
export const STATUS_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  draft: ['confirmed', 'on_hold', 'cancelled'],
  confirmed: ['on_hold', 'cancelled', 'allocated'],
  on_hold: ['confirmed', 'cancelled'],
  allocated: ['cancelled', 'picking'],
  picking: ['packing'],
  packing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

// ============================================================================
// Status Configuration
// ============================================================================

export interface StatusConfig {
  code: SalesOrderStatus
  name: string
  description: string
  color: string
  icon: string
  allowsHold: boolean
  allowsCancel: boolean
  preventsAllocation: boolean
}

export const STATUS_CONFIG: Record<SalesOrderStatus, StatusConfig> = {
  draft: {
    code: 'draft',
    name: 'Draft',
    description: 'Order created, awaiting confirmation',
    color: 'gray',
    icon: 'FileText',
    allowsHold: true,
    allowsCancel: true,
    preventsAllocation: false,
  },
  confirmed: {
    code: 'confirmed',
    name: 'Confirmed',
    description: 'Order confirmed, ready for allocation',
    color: 'blue',
    icon: 'CheckCircle',
    allowsHold: true,
    allowsCancel: true,
    preventsAllocation: false,
  },
  on_hold: {
    code: 'on_hold',
    name: 'On Hold',
    description: 'Order placed on hold pending review',
    color: 'yellow',
    icon: 'PauseCircle',
    allowsHold: false,
    allowsCancel: true,
    preventsAllocation: true,
  },
  cancelled: {
    code: 'cancelled',
    name: 'Cancelled',
    description: 'Order cancelled',
    color: 'red',
    icon: 'XCircle',
    allowsHold: false,
    allowsCancel: false,
    preventsAllocation: true,
  },
  allocated: {
    code: 'allocated',
    name: 'Allocated',
    description: 'Inventory allocated',
    color: 'purple',
    icon: 'Package',
    allowsHold: false,
    allowsCancel: true,
    preventsAllocation: true,
  },
  picking: {
    code: 'picking',
    name: 'Picking',
    description: 'Items being picked',
    color: 'purple',
    icon: 'Truck',
    allowsHold: false,
    allowsCancel: false,
    preventsAllocation: true,
  },
  packing: {
    code: 'packing',
    name: 'Packing',
    description: 'Items being packed',
    color: 'purple',
    icon: 'Box',
    allowsHold: false,
    allowsCancel: false,
    preventsAllocation: true,
  },
  shipped: {
    code: 'shipped',
    name: 'Shipped',
    description: 'Order shipped',
    color: 'green',
    icon: 'Truck',
    allowsHold: false,
    allowsCancel: false,
    preventsAllocation: true,
  },
  delivered: {
    code: 'delivered',
    name: 'Delivered',
    description: 'Order delivered',
    color: 'green',
    icon: 'CheckCircle',
    allowsHold: false,
    allowsCancel: false,
    preventsAllocation: true,
  },
}

// ============================================================================
// Response Types
// ============================================================================

export interface HoldOrderResponse {
  success: boolean
  sales_order: {
    id: string
    so_number: string
    status: SalesOrderStatus
    notes: string | null
    updated_at: string
  }
  message: string
}

export interface CancelOrderResponse {
  success: boolean
  sales_order: {
    id: string
    so_number: string
    status: SalesOrderStatus
    notes: string | null
    updated_at: string
  }
  message: string
}

export interface ConfirmOrderResponse {
  success: boolean
  sales_order: {
    id: string
    so_number: string
    status: SalesOrderStatus
    confirmed_at: string | null
    updated_at: string
  }
  message: string
}
