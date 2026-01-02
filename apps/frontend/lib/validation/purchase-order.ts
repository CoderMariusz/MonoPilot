/**
 * Purchase Order Validation Schemas
 * Story: 03.3 - PO CRUD + Lines
 *
 * Zod schemas for validating purchase order create/update operations.
 * Used by API routes and form components for consistent validation.
 *
 * @module purchase-order
 */

import { z } from 'zod'

/**
 * Currency enum for purchase orders.
 * Supported currencies: PLN, EUR, USD, GBP
 */
export const currencyEnum = z.enum(['PLN', 'EUR', 'USD', 'GBP'], {
  errorMap: () => ({ message: 'Currency must be PLN, EUR, USD, or GBP' }),
})

/**
 * TypeScript type for currency
 */
export type Currency = z.infer<typeof currencyEnum>

/**
 * PO Status enum representing the full lifecycle.
 * Status flow: draft -> submitted/pending_approval -> approved/rejected -> confirmed -> receiving -> closed
 * Any status can transition to cancelled (except closed and cancelled)
 * Story 03.5b: Added 'approved' and 'rejected' for approval workflow
 */
export const poStatusEnum = z.enum(
  ['draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'confirmed', 'receiving', 'closed', 'cancelled'],
  {
    errorMap: () => ({
      message: 'Status must be one of: draft, submitted, pending_approval, approved, rejected, confirmed, receiving, closed, cancelled',
    }),
  }
)

/**
 * TypeScript type for PO status
 */
export type POStatus = z.infer<typeof poStatusEnum>

/**
 * Helper function to check if a date is today or in the future.
 * Used for expected_delivery_date validation.
 */
function isTodayOrFuture(dateString: string): boolean {
  const inputDate = new Date(dateString)
  const today = new Date()
  // Set both dates to start of day for comparison
  inputDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return inputDate >= today
}

/**
 * Schema for creating a PO line item.
 * Required fields: product_id, quantity, unit_price, uom
 */
export const createPOLineSchema = z.object({
  product_id: z
    .string({
      required_error: 'Product ID is required',
      invalid_type_error: 'Product ID must be a string',
    })
    .uuid('Product ID must be a valid UUID'),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be a positive number')
    .max(999999999, 'Quantity cannot exceed 999,999,999'),

  unit_price: z
    .number({
      required_error: 'Unit price is required',
      invalid_type_error: 'Unit price must be a number',
    })
    .min(0, 'Unit price cannot be negative')
    .max(999999999, 'Unit price cannot exceed 999,999,999'),

  uom: z
    .string({
      required_error: 'Unit of measure is required',
      invalid_type_error: 'Unit of measure must be a string',
    })
    .min(1, 'Unit of measure is required')
    .max(20, 'Unit of measure cannot exceed 20 characters'),

  discount_percent: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0)
    .optional(),

  expected_delivery_date: z
    .string()
    .date('Expected delivery date must be a valid date (YYYY-MM-DD)')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable(),
})

/**
 * TypeScript type for create PO line input
 */
export type CreatePOLineInput = z.infer<typeof createPOLineSchema>

/**
 * Schema for updating a PO line item.
 * All fields are optional for partial updates.
 * Includes id for identifying which line to update and _delete flag for removal.
 */
export const updatePOLineSchema = createPOLineSchema.partial().extend({
  id: z.string().uuid('Line ID must be a valid UUID').optional(),
  _delete: z.boolean().optional(),
})

/**
 * TypeScript type for update PO line input
 */
export type UpdatePOLineInput = z.infer<typeof updatePOLineSchema>

/**
 * Schema for creating a purchase order.
 * Required fields: supplier_id, warehouse_id, expected_delivery_date
 */
export const createPOSchema = z.object({
  supplier_id: z
    .string({
      required_error: 'Supplier is required',
      invalid_type_error: 'Supplier ID must be a string',
    })
    .uuid('Supplier ID must be a valid UUID'),

  warehouse_id: z
    .string({
      required_error: 'Warehouse is required',
      invalid_type_error: 'Warehouse ID must be a string',
    })
    .uuid('Warehouse ID must be a valid UUID'),

  expected_delivery_date: z
    .string({
      required_error: 'Expected delivery date is required',
      invalid_type_error: 'Expected delivery date must be a string',
    })
    .date('Expected delivery date must be a valid date (YYYY-MM-DD)')
    .refine(isTodayOrFuture, {
      message: 'Expected delivery date must be today or in the future',
    }),

  currency: currencyEnum.optional().default('PLN'),

  tax_code_id: z
    .string()
    .uuid('Tax code ID must be a valid UUID')
    .optional()
    .nullable(),

  payment_terms: z
    .string()
    .max(50, 'Payment terms cannot exceed 50 characters')
    .optional()
    .nullable(),

  shipping_method: z
    .string()
    .max(100, 'Shipping method cannot exceed 100 characters')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable(),

  internal_notes: z
    .string()
    .max(2000, 'Internal notes cannot exceed 2000 characters')
    .optional()
    .nullable(),

  lines: z
    .array(createPOLineSchema)
    .min(0)
    .max(200, 'Cannot have more than 200 lines per PO')
    .optional(),
})

/**
 * TypeScript type for create PO input
 */
export type CreatePOInput = z.infer<typeof createPOSchema>

/**
 * Schema for updating a purchase order.
 * All fields are optional for partial updates.
 * Note: supplier_id cannot be changed after creation.
 */
export const updatePOSchema = z.object({
  expected_delivery_date: z
    .string()
    .date('Expected delivery date must be a valid date (YYYY-MM-DD)')
    .optional(),

  warehouse_id: z
    .string()
    .uuid('Warehouse ID must be a valid UUID')
    .optional(),

  currency: currencyEnum.optional(),

  tax_code_id: z
    .string()
    .uuid('Tax code ID must be a valid UUID')
    .optional()
    .nullable(),

  payment_terms: z
    .string()
    .max(50, 'Payment terms cannot exceed 50 characters')
    .optional()
    .nullable(),

  shipping_method: z
    .string()
    .max(100, 'Shipping method cannot exceed 100 characters')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable(),

  internal_notes: z
    .string()
    .max(2000, 'Internal notes cannot exceed 2000 characters')
    .optional()
    .nullable(),

  lines: z.array(updatePOLineSchema).optional(),
})

/**
 * TypeScript type for update PO input
 */
export type UpdatePOInput = z.infer<typeof updatePOSchema>

/**
 * Schema for list query parameters.
 */
export const poListQuerySchema = z.object({
  search: z.string().min(2).optional(),
  supplier_id: z.string().uuid().optional(),
  status: z.string().optional(), // Can be comma-separated for multiple statuses
  warehouse_id: z.string().uuid().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  sort: z
    .enum(['po_number', 'expected_delivery_date', 'total', 'created_at'])
    .default('created_at')
    .optional(),
  order: z.enum(['asc', 'desc']).default('desc').optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
})

/**
 * TypeScript type for list query parameters
 */
export type POListQuery = z.infer<typeof poListQuerySchema>

/**
 * Schema for cancel PO request.
 */
export const cancelPOSchema = z.object({
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
})

/**
 * TypeScript type for cancel PO input
 */
export type CancelPOInput = z.infer<typeof cancelPOSchema>

// ============================================================================
// Approval Workflow Schemas (Story 03.5b)
// ============================================================================

/**
 * Schema for submitting a PO for approval.
 * No body required - action is determined by PO state and settings.
 */
export const submitPoSchema = z.object({
  // No body needed - submit is an idempotent action
}).passthrough()

/**
 * TypeScript type for submit PO input
 */
export type SubmitPoInput = z.infer<typeof submitPoSchema>

/**
 * Schema for approving a PO.
 * Notes are optional but limited to 1000 characters.
 */
export const approvePoSchema = z.object({
  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional(),
})

/**
 * TypeScript type for approve PO input
 */
export type ApprovePoInput = z.infer<typeof approvePoSchema>

/**
 * Schema for rejecting a PO.
 * Rejection reason is required with minimum 10 characters.
 */
export const rejectPoSchema = z.object({
  rejection_reason: z
    .string({
      required_error: 'Rejection reason is required',
      invalid_type_error: 'Rejection reason must be a string',
    })
    .min(1, 'Rejection reason is required')
    .transform((val) => val.trim())
    .refine((val) => val.length >= 10, {
      message: 'Rejection reason must be at least 10 characters',
    })
    .refine((val) => val.length <= 1000, {
      message: 'Rejection reason must not exceed 1000 characters',
    }),
})

/**
 * TypeScript type for reject PO input
 */
export type RejectPoInput = z.infer<typeof rejectPoSchema>

/**
 * PO Approval action type
 */
export type POApprovalAction = 'submitted' | 'approved' | 'rejected'

/**
 * PO Approval status type
 */
export type POApprovalStatus = 'pending' | 'approved' | 'rejected' | null

/**
 * PO Approval History interface
 */
export interface POApprovalHistory {
  id: string
  org_id: string
  po_id: string
  action: POApprovalAction
  user_id: string
  user_name: string
  user_role: string
  notes: string | null
  created_at: string
}
